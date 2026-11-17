from algojudge.models import Role
from tests.conftest import login_as


async def test_languages_public_and_admin_toggle(client, new_client):
    langs = (await client.get("/api/languages")).json()
    keys = [lang["key"] for lang in langs]
    assert keys[0] == "CPP17" and "PY3" in keys and "PY2" not in keys  # disabled ones hidden
    admin = await login_as(new_client, "admin1", Role.ADMIN)
    all_keys = [lang["key"] for lang in (await admin.get("/api/languages", params={"include_disabled": "true"})).json()]
    assert "PY2" in all_keys
    # Anonymous include_disabled is ignored.
    assert len((await client.get("/api/languages", params={"include_disabled": "true"})).json()) == len(langs)
    r = await admin.patch("/api/languages/PY2", json={"is_enabled": True, "name": "Python 2.7"})
    assert r.status_code == 200 and r.json()["name"] == "Python 2.7"
    assert "PY2" in [lang["key"] for lang in (await client.get("/api/languages")).json()]
    user = await login_as(new_client, "user1", Role.USER)
    assert (await user.patch("/api/languages/PY2", json={"is_enabled": False})).status_code == 403


async def test_types_and_groups_crud(client, new_client):
    admin = await login_as(new_client, "admin1", Role.ADMIN)
    setter = await login_as(new_client, "setter1", Role.SETTER)
    for path in ("problem-types", "problem-groups"):
        assert (await setter.post(f"/api/{path}", json={"slug": "dp", "name": "DP"})).status_code == 403
        r = await admin.post(f"/api/{path}", json={"slug": "dp", "name": "Quy hoạch động"})
        assert r.status_code == 201
        item_id = r.json()["id"]
        r = await admin.post(f"/api/{path}", json={"slug": "dp", "name": "Trùng"})
        assert r.status_code == 409 and r.json()["detail"] == {"code": "slug_taken", "field": "slug"}
        assert (await admin.post(f"/api/{path}", json={"slug": "Bad Slug", "name": "x"})).status_code == 422
        r = await admin.patch(f"/api/{path}/{item_id}", json={"name": "QHĐ"})
        assert r.json()["name"] == "QHĐ"
        assert [i["slug"] for i in (await client.get(f"/api/{path}")).json()] == ["dp"]
        assert (await admin.delete(f"/api/{path}/{item_id}")).status_code == 204
        assert (await client.get(f"/api/{path}")).json() == []


async def test_deleting_type_keeps_problem(new_client):
    admin = await login_as(new_client, "admin1", Role.ADMIN)
    t = (await admin.post("/api/problem-types", json={"slug": "dp", "name": "DP"})).json()
    g = (await admin.post("/api/problem-groups", json={"slug": "voi", "name": "VOI"})).json()
    await admin.post("/api/problems", json={"code": "aplusb", "title": "A+B"})
    await admin.patch("/api/problems/aplusb", json={"type_ids": [t["id"]], "group_id": g["id"]})
    await admin.delete(f"/api/problem-types/{t['id']}")
    await admin.delete(f"/api/problem-groups/{g['id']}")
    p = (await admin.get("/api/problems/aplusb")).json()
    assert p["types"] == [] and p["group"] is None
