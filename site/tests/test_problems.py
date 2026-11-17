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
    assert [a["username"] for a in p["authors"]] == ["setter1"]
    assert p["can_edit"] is True and p["can_change_visibility"] is False
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


async def test_invite_coauthor(setter, setter2, user):
    await _create(setter)
    r = await setter.put("/api/problems/aplusb/authors", json={"usernames": ["setter1", "SETTER2"]})
    assert r.status_code == 200
    assert [a["username"] for a in r.json()["authors"]] == ["setter1", "setter2"]
    # The invited setter can now see and edit the private problem.
    assert (await setter2.patch("/api/problems/aplusb", json={"title": "Cùng sửa"})).status_code == 200
    # Regular users cannot be authors; unknown names and empty lists are refused.
    r = await setter.put("/api/problems/aplusb/authors", json={"usernames": ["setter1", "user1"]})
    assert r.status_code == 400 and r.json()["detail"] == {"code": "author_must_be_setter", "field": "user1"}
    r = await setter.put("/api/problems/aplusb/authors", json={"usernames": ["ghost"]})
    assert r.status_code == 400 and r.json()["detail"] == {"code": "user_not_found", "field": "ghost"}
    assert (await setter.put("/api/problems/aplusb/authors", json={"usernames": []})).status_code == 400


async def test_list_search_mine_and_sort(setter, setter2, admin):
    await _create(setter, code="bbb", title="Đường đi ngắn nhất")
    await _create(setter, code="aaa", title="Tổng")
    await _create(setter2, code="ccc", title="Cây khung")
    r = (await admin.get("/api/problems")).json()
    assert [p["code"] for p in r["items"]] == ["aaa", "bbb", "ccc"]
    r = (await admin.get("/api/problems", params={"sort": "newest"})).json()
    assert [p["code"] for p in r["items"]] == ["ccc", "aaa", "bbb"]
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
