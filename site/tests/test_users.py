import pytest

from algojudge.auth.users import create_user
from algojudge.deps import get_sessionmaker
from algojudge.models import Role
from tests.conftest import register


async def _logged_in(new_client, username: str, role: Role):
    async with get_sessionmaker()() as db:
        await create_user(db, username=username, email=f"{username}@example.com", password="password123", role=role)
    c = new_client()
    assert (await c.post("/api/auth/login", json={"login": username, "password": "password123"})).status_code == 200
    return c


@pytest.fixture
async def admin_client(new_client):
    return await _logged_in(new_client, "root", Role.ADMIN)


@pytest.fixture
async def super_client(new_client):
    return await _logged_in(new_client, "boss", Role.SUPERADMIN)


async def _id(client, username: str) -> int:
    r = await client.get(f"/api/users/by-username/{username}")
    return r.json()["id"]


async def test_list_users_requires_admin(client, admin_client):
    assert (await client.get("/api/users")).status_code == 401
    await register(client)
    r = await client.get("/api/users")
    assert r.status_code == 403 and r.json()["detail"]["code"] == "forbidden"

    r = await admin_client.get("/api/users")
    assert r.status_code == 200
    assert r.json()["total"] == 2
    r = await admin_client.get("/api/users", params={"q": "ALI"})
    assert [u["username"] for u in r.json()["items"]] == ["alice"]
    r = await admin_client.get("/api/users", params={"role": "admin"})
    assert [u["username"] for u in r.json()["items"]] == ["root"]


async def test_admin_changes_role(client, admin_client):
    uid = (await register(client)).json()["id"]
    r = await admin_client.patch(f"/api/users/{uid}", json={"role": "setter"})
    assert r.status_code == 200 and r.json()["role"] == "setter"
    # The new role applies immediately to the user's existing session.
    assert (await client.get("/api/auth/me")).json()["user"]["role"] == "setter"


async def test_regular_user_cannot_change_roles(client):
    uid = (await register(client)).json()["id"]
    assert (await client.patch(f"/api/users/{uid}", json={"role": "admin"})).status_code == 403


async def test_admin_cannot_demote_or_disable_self(admin_client):
    me = (await admin_client.get("/api/auth/me")).json()["user"]
    for body in ({"role": "user"}, {"is_active": False}):
        r = await admin_client.patch(f"/api/users/{me['id']}", json=body)
        assert r.status_code == 400 and r.json()["detail"]["code"] == "cannot_modify_self"


async def test_deactivating_user_logs_them_out_and_blocks_login(client, admin_client, new_client):
    uid = (await register(client)).json()["id"]
    assert (await admin_client.patch(f"/api/users/{uid}", json={"is_active": False})).status_code == 200
    assert (await client.get("/api/auth/me")).json()["user"] is None
    r = await new_client().post("/api/auth/login", json={"login": "alice", "password": "password123"})
    assert r.status_code == 403 and r.json()["detail"]["code"] == "account_disabled"
    # Re-activating lets them in again.
    await admin_client.patch(f"/api/users/{uid}", json={"is_active": True})
    r = await new_client().post("/api/auth/login", json={"login": "alice", "password": "password123"})
    assert r.status_code == 200


async def test_public_profile(client):
    await register(client, username="Alice", display_name="Alice A")
    r = await client.get("/api/users/by-username/alice")
    assert r.status_code == 200
    assert r.json()["display_name"] == "Alice A" and "email" not in r.json()
    assert (await client.get("/api/users/by-username/nobody")).status_code == 404


async def test_admin_cannot_touch_admins_or_superadmins(admin_client, super_client, new_client):
    await _logged_in(new_client, "other_admin", Role.ADMIN)
    for target in ("other_admin", "boss"):
        uid = await _id(admin_client, target)
        r = await admin_client.patch(f"/api/users/{uid}", json={"is_active": False})
        assert r.status_code == 403 and r.json()["detail"]["code"] == "insufficient_rank", target


async def test_admin_cannot_grant_admin_or_superadmin(client, admin_client):
    uid = (await register(client)).json()["id"]
    for role in ("admin", "superadmin"):
        r = await admin_client.patch(f"/api/users/{uid}", json={"role": role})
        assert r.status_code == 403 and r.json()["detail"] == {"code": "role_not_assignable", "field": "role"}
    assert (await admin_client.patch(f"/api/users/{uid}", json={"role": "setter"})).status_code == 200


async def test_superadmin_manages_admins_but_never_grants_superadmin(client, admin_client, super_client):
    uid = (await register(client)).json()["id"]
    assert (await super_client.patch(f"/api/users/{uid}", json={"role": "admin"})).status_code == 200
    r = await super_client.patch(f"/api/users/{uid}", json={"role": "superadmin"})
    assert r.status_code == 403 and r.json()["detail"]["code"] == "role_not_assignable"
    # ...and can demote / disable an admin.
    root = await _id(super_client, "root")
    assert (await super_client.patch(f"/api/users/{root}", json={"role": "user"})).json()["role"] == "user"
    assert (await super_client.patch(f"/api/users/{root}", json={"is_active": False})).status_code == 200
    # The demoted, disabled admin lost access immediately.
    assert (await admin_client.get("/api/users")).status_code == 401


async def test_superadmin_cannot_be_changed_from_web(super_client, new_client):
    other = await _logged_in(new_client, "boss2", Role.SUPERADMIN)
    uid = await _id(other, "boss")
    r = await other.patch(f"/api/users/{uid}", json={"role": "admin"})
    assert r.status_code == 403 and r.json()["detail"]["code"] == "insufficient_rank"


async def test_superadmin_can_list_users(super_client):
    assert (await super_client.get("/api/users")).status_code == 200
