import os
from pathlib import Path

import pytest

from algojudge.models import Role
from tests.conftest import login_as

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


@pytest.fixture
async def setter(new_client):
    return await login_as(new_client, "setter1", Role.SETTER)


@pytest.fixture
async def setter2(new_client):
    return await login_as(new_client, "setter2", Role.SETTER)


@pytest.fixture
async def admin(new_client):
    return await login_as(new_client, "admin1", Role.ADMIN)


@pytest.fixture
async def user(new_client):
    return await login_as(new_client, "user1", Role.USER)


async def _create(client, code="aplusb", **extra):
    body = {"code": code, "title": "A + B", "statement_md": "Tính $a+b$.", **extra}
    return await client.post("/api/problems", json=body)


async def test_setter_creates_private_problem_and_is_author(setter):
    r = await _create(setter, time_limit_ms=2000, memory_limit_kb=65536)
    assert r.status_code == 201, r.text
    p = r.json()
    assert p["code"] == "aplusb" and p["visibility"] == "private"
    assert [a["username"] for a in p["creators"]] == ["setter1"]
    assert p["can_edit"] is True and p["can_change_visibility"] is False and p["can_delete"] is False
    assert p["points"] == 100 and p["scoring_mode"] == "icpc" and p["testcase_visibility"] == "staff_only"
    assert p["time_limit_ms"] == 2000 and p["memory_limit_kb"] == 65536


async def test_only_setters_and_above_create(client, user):
    assert (await _create(client)).status_code == 401
    assert (await _create(user)).status_code == 403


async def test_code_rules(setter):
    assert (await _create(setter, code="ApB")).json()["detail"] == {"code": "invalid_input", "field": "code"}
    assert (await _create(setter, code="a")).status_code == 422
    assert (await _create(setter, code="a-b")).status_code == 422
    assert (await _create(setter)).status_code == 201
    r = await _create(setter)
    assert r.status_code == 409 and r.json()["detail"] == {"code": "problem_code_taken", "field": "code"}


async def test_limits_validated(setter):
    assert (await _create(setter, time_limit_ms=50)).json()["detail"]["field"] == "time_limit_ms"
    assert (await _create(setter, memory_limit_kb=1024)).json()["detail"]["field"] == "memory_limit_kb"


async def test_private_problem_hidden_from_others(client, setter, setter2, user, admin):
    await _create(setter)
    for c in (client, user, setter2):
        assert (await c.get("/api/problems/aplusb")).status_code == 404
        assert (await c.get("/api/problems")).json()["total"] == 0
    for c in (setter, admin):
        assert (await c.get("/api/problems/aplusb")).status_code == 200
        assert (await c.get("/api/problems")).json()["total"] == 1


async def test_publish_is_admin_only(client, setter, admin):
    await _create(setter)
    r = await setter.patch("/api/problems/aplusb", json={"visibility": "public"})
    assert r.status_code == 403 and r.json()["detail"]["code"] == "visibility_admin_only"
    r = await admin.patch("/api/problems/aplusb", json={"visibility": "public"})
    assert r.status_code == 200 and r.json()["visibility"] == "public"
    # Now everyone sees it, but only authors/admins may edit.
    r = await client.get("/api/problems/aplusb")
    assert r.status_code == 200 and r.json()["can_edit"] is False
    assert (await client.patch("/api/problems/aplusb", json={"title": "x"})).status_code == 403


async def test_author_edits_and_non_author_cannot(setter, setter2, admin):
    await _create(setter)
    r = await setter.patch("/api/problems/aplusb", json={"title": "Tổng hai số", "statement_md": "# Đề\n$x^2$"})
    assert r.status_code == 200 and r.json()["title"] == "Tổng hai số"
    await admin.patch("/api/problems/aplusb", json={"visibility": "public"})
    assert (await setter2.patch("/api/problems/aplusb", json={"title": "hack"})).status_code == 403
    assert (await admin.patch("/api/problems/aplusb", json={"title": "Admin sửa"})).status_code == 200


async def _members(client, creators, curators=(), testers=()):
    body = {"creators": list(creators), "curators": list(curators), "testers": list(testers)}
    return await client.put("/api/problems/aplusb/members", json=body)


async def test_members_roles(setter, setter2, user, new_client):
    await _create(setter)
    r = await _members(setter, ["setter1"], curators=["SETTER2"], testers=["user1"])
    assert r.status_code == 200, r.text
    body = r.json()
    assert [u["username"] for u in body["creators"]] == ["setter1"]
    assert [u["username"] for u in body["curators"]] == ["setter2"]
    assert [u["username"] for u in body["testers"]] == ["user1"]
    # Curator edits; tester sees the private problem but cannot edit it.
    assert (await setter2.patch("/api/problems/aplusb", json={"title": "Curator sửa"})).status_code == 200
    r = await user.get("/api/problems/aplusb")
    assert r.status_code == 200 and r.json()["can_edit"] is False
    assert (await user.patch("/api/problems/aplusb", json={"title": "x"})).status_code == 403
    # Only creators are credited on the public page.
    assert [u["username"] for u in r.json()["creators"]] == ["setter1"]
    assert "curators" not in r.json()


async def test_members_validation(setter, setter2, user):
    await _create(setter)
    r = await _members(setter, ["setter1"], curators=["user1"])
    assert r.status_code == 400 and r.json()["detail"] == {"code": "editor_must_be_setter", "field": "user1"}
    r = await _members(setter, ["setter1"], testers=["ghost"])
    assert r.json()["detail"] == {"code": "user_not_found", "field": "ghost"}
    r = await _members(setter, ["setter1"], curators=["setter2"], testers=["setter2"])
    assert r.json()["detail"]["code"] == "member_in_two_roles"
    r = await _members(setter, [], curators=["setter1"])
    assert r.json()["detail"]["code"] == "creators_required"
    # A non-admin editor cannot drop their own edit access.
    r = await _members(setter, ["setter2"], testers=["setter1"])
    assert r.status_code == 400 and r.json()["detail"]["code"] == "cannot_remove_self"


async def test_settings_and_metadata(setter, admin):
    await _create(setter)
    g = (await admin.post("/api/problem-groups", json={"slug": "voi", "name": "VOI"})).json()
    t1 = (await admin.post("/api/problem-types", json={"slug": "dp", "name": "Quy hoạch động"})).json()
    t2 = (await admin.post("/api/problem-types", json={"slug": "graph", "name": "Đồ thị"})).json()
    body = {
        "points": 250.5,
        "scoring_mode": "partial",
        "group_id": g["id"],
        "type_ids": [t1["id"], t2["id"]],
        "language_keys": ["CPP17", "PY3"],
        "source_visibility": "only_own",
        "testcase_visibility": "outside_contest",
        "testcase_result_visibility": "groups_only",
        "published_at": "2026-12-01T00:00:00Z",
    }
    r = await setter.patch("/api/problems/aplusb", json=body)
    assert r.status_code == 200, r.text
    p = r.json()
    assert p["points"] == 250.5 and p["scoring_mode"] == "partial"
    assert p["group"]["slug"] == "voi"
    assert sorted(t["slug"] for t in p["types"]) == ["dp", "graph"]
    assert [lang["key"] for lang in p["allowed_languages"]] == ["CPP17", "PY3"]
    assert p["source_visibility"] == "only_own" and p["testcase_visibility"] == "outside_contest"
    assert p["testcase_result_visibility"] == "groups_only"
    assert p["published_at"].startswith("2026-12-01")
    # Settings are editors-only; the public detail hides the policies.
    assert (await setter.get("/api/problems/aplusb/settings")).status_code == 200
    # Clearing the group.
    assert (await setter.patch("/api/problems/aplusb", json={"group_id": None})).json()["group"] is None
    # Validation.
    assert (await setter.patch("/api/problems/aplusb", json={"language_keys": []})).json()["detail"]["code"] == (
        "languages_required"
    )
    r = await setter.patch("/api/problems/aplusb", json={"language_keys": ["NOPE"]})
    assert r.json()["detail"]["code"] == "language_not_found"
    assert (await setter.patch("/api/problems/aplusb", json={"points": 0})).status_code == 422
    # Filters.
    await admin.patch("/api/problems/aplusb", json={"visibility": "public", "group_id": g["id"]})
    assert (await admin.get("/api/problems", params={"group": "voi"})).json()["total"] == 1
    assert (await admin.get("/api/problems", params={"type": "dp"})).json()["total"] == 1
    assert (await admin.get("/api/problems", params={"type": "greedy"})).json()["total"] == 0


async def test_new_problem_gets_enabled_languages(setter):
    p = (await _create(setter)).json()
    keys = [lang["key"] for lang in p["allowed_languages"]]
    assert "CPP17" in keys and "PY3" in keys and "PY2" not in keys


async def test_publishing_sets_published_at(setter, admin):
    p = (await _create(setter)).json()
    assert p["published_at"] is None
    r = await admin.patch("/api/problems/aplusb", json={"visibility": "public"})
    assert r.json()["published_at"] is not None
    # The editor sends every field; an explicit null date on a public problem is filled in again.
    r = await admin.patch("/api/problems/aplusb", json={"visibility": "public", "published_at": None})
    assert r.json()["published_at"] is not None


async def test_solution(client, setter, admin, user):
    await _create(setter)
    await admin.patch("/api/problems/aplusb", json={"visibility": "public"})
    assert (await client.get("/api/problems/aplusb/solution")).status_code == 404
    r = await setter.put("/api/problems/aplusb/solution", json={"content_md": "Dùng $a+b$.", "is_public": False})
    assert r.status_code == 200 and r.json()["is_visible"] is False
    # Hidden from normal users until public.
    assert (await user.get("/api/problems/aplusb/solution")).status_code == 404
    assert (await user.get("/api/problems/aplusb")).json()["has_solution"] is False
    # Public but scheduled in the future: still hidden.
    body = {"content_md": "Dùng $a+b$.", "is_public": True, "publish_at": "2999-01-01T00:00:00Z"}
    await setter.put("/api/problems/aplusb/solution", json=body)
    assert (await user.get("/api/problems/aplusb/solution")).status_code == 404
    # Public now: visible.
    await setter.put("/api/problems/aplusb/solution", json={"content_md": "Dùng $a+b$.", "is_public": True})
    r = await user.get("/api/problems/aplusb/solution")
    assert r.status_code == 200 and r.json()["content_md"] == "Dùng $a+b$."
    assert (await user.get("/api/problems/aplusb")).json()["has_solution"] is True
    assert (await user.put("/api/problems/aplusb/solution", json={"content_md": "x"})).status_code == 403
    assert (await setter.delete("/api/problems/aplusb/solution")).status_code == 204
    assert (await user.get("/api/problems/aplusb/solution")).status_code == 404


async def test_list_search_mine_and_sort(setter, setter2, admin):
    await _create(setter, code="bbb", title="Đường đi ngắn nhất")
    await _create(setter, code="aaa", title="Tổng")
    await _create(setter2, code="ccc", title="Cây khung")
    r = (await admin.get("/api/problems")).json()
    assert [p["code"] for p in r["items"]] == ["aaa", "bbb", "ccc"]
    r = (await admin.get("/api/problems", params={"sort": "newest"})).json()
    assert [p["code"] for p in r["items"]] == ["ccc", "aaa", "bbb"]
    # A published problem sorts by its publish date.
    await admin.patch("/api/problems/bbb", json={"published_at": "2030-01-01T00:00:00Z"})
    r = (await admin.get("/api/problems", params={"sort": "newest"})).json()
    assert [p["code"] for p in r["items"]] == ["bbb", "ccc", "aaa"]
    r = (await admin.get("/api/problems", params={"q": "đường"})).json()
    assert [p["code"] for p in r["items"]] == ["bbb"]
    r = (await setter.get("/api/problems", params={"mine": "true"})).json()
    assert [p["code"] for p in r["items"]] == ["aaa", "bbb"]


async def test_delete_admin_only(setter, admin):
    await _create(setter)
    assert (await setter.delete("/api/problems/aplusb")).status_code == 403
    assert (await admin.delete("/api/problems/aplusb")).status_code == 204
    assert (await admin.get("/api/problems/aplusb")).status_code == 404


async def test_upload_image(setter, setter2, settings):
    await _create(setter)
    r = await setter.post("/api/problems/aplusb/images", files={"file": ("x.png", PNG, "image/png")})
    assert r.status_code == 201, r.text
    url = r.json()["url"]
    assert url.startswith("/media/problems/aplusb/") and url.endswith(".png")
    path = os.path.join(settings.media_dir, url.removeprefix("/media/"))
    assert Path(path).read_bytes() == PNG
    # Same bytes -> same URL (content-addressed).
    r2 = await setter.post("/api/problems/aplusb/images", files={"file": ("other-name.png", PNG, "image/png")})
    assert r2.json()["url"] == url
    # Non-authors cannot upload.
    r = await setter2.post("/api/problems/aplusb/images", files={"file": ("x.png", PNG, "image/png")})
    assert r.status_code == 404


async def test_upload_rejects_svg_and_fake_images(setter):
    await _create(setter)
    svg = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    r = await setter.post("/api/problems/aplusb/images", files={"file": ("x.png", svg, "image/png")})
    assert r.status_code == 415 and r.json()["detail"]["code"] == "image_type_not_allowed"


async def test_upload_size_limit(setter, settings):
    await _create(setter)
    big = PNG + b"\x00" * settings.max_image_bytes
    r = await setter.post("/api/problems/aplusb/images", files={"file": ("x.png", big, "image/png")})
    assert r.status_code == 413 and r.json()["detail"]["code"] == "image_too_large"
