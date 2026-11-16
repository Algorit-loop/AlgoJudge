from algojudge.config import Settings, get_settings
from algojudge.main import app
from tests.conftest import register


def _override_settings(**changes):
    overridden = get_settings().model_copy(update=changes)
    app.dependency_overrides[get_settings] = lambda: overridden
    return overridden


async def test_register_logs_in_and_me_returns_user(client):
    r = await register(client, display_name="Alice A")
    assert r.status_code == 201
    body = r.json()
    assert body["username"] == "alice" and body["display_name"] == "Alice A" and body["role"] == "user"
    assert "password" not in str(body)
    set_cookie = r.headers["set-cookie"].lower()
    assert "aj_session=" in set_cookie and "httponly" in set_cookie and "samesite=lax" in set_cookie
    # Without "remember me" the cookie is a browser-session cookie.
    assert "max-age" not in set_cookie

    me = (await client.get("/api/auth/me")).json()["user"]
    assert me["username"] == "alice" and me["email"] == "alice@example.com"


async def test_display_name_defaults_to_username(client):
    assert (await register(client)).json()["display_name"] == "alice"


async def test_me_anonymous_is_null(client):
    r = await client.get("/api/auth/me")
    assert r.status_code == 200 and r.json() == {"user": None}


async def test_register_rejects_duplicates_case_insensitively(client, new_client):
    await register(client, username="Alice", email="Alice@Example.com")
    r = await register(new_client(), username="alice", email="other@example.com")
    assert r.status_code == 409 and r.json()["detail"] == {"code": "username_taken", "field": "username"}
    r = await register(new_client(), username="bob", email="alice@example.COM")
    assert r.status_code == 409 and r.json()["detail"] == {"code": "email_taken", "field": "email"}


async def test_register_validates_input(client):
    r = await register(client, username="a b")
    assert r.status_code == 422 and r.json()["detail"] == {"code": "invalid_input", "field": "username"}
    r = await register(client, username="bob", password="short")
    assert r.status_code == 422 and r.json()["detail"]["field"] == "password"
    r = await register(client, username="bob", email="not-an-email")
    assert r.status_code == 422 and r.json()["detail"]["field"] == "email"


async def test_registration_closed(client):
    _override_settings(registration_open=False)
    assert (await client.get("/api/auth/registration")).json() == {"registration_open": False}
    r = await register(client)
    assert r.status_code == 403 and r.json()["detail"]["code"] == "registration_closed"


async def test_login_with_username_or_email(client, new_client):
    await register(client, username="Alice")
    for login in ("alice", "ALICE", "alice@example.com"):
        c = new_client()
        r = await c.post("/api/auth/login", json={"login": login, "password": "password123"})
        assert r.status_code == 200, login
        assert (await c.get("/api/auth/me")).json()["user"]["username"] == "Alice"


async def test_login_wrong_password_or_unknown_user(client):
    await register(client)
    for body in ({"login": "alice", "password": "wrong-password"}, {"login": "nobody", "password": "password123"}):
        r = await client.post("/api/auth/login", json=body)
        assert r.status_code == 401 and r.json()["detail"]["code"] == "invalid_credentials"


async def test_remember_me_sets_persistent_cookie(client, new_client, settings: Settings):
    await register(client)
    r = await new_client().post("/api/auth/login", json={"login": "alice", "password": "password123", "remember": True})
    assert f"max-age={settings.session_ttl_remember_seconds}" in r.headers["set-cookie"].lower()


async def test_logout_invalidates_session(client, new_client):
    await register(client)
    token = client.cookies.get("aj_session")
    assert (await client.post("/api/auth/logout")).status_code == 204
    assert (await client.get("/api/auth/me")).json()["user"] is None
    # The old token is dead on the server too, not just removed from this browser.
    other = new_client()
    other.cookies.set("aj_session", token)
    assert (await other.get("/api/auth/me")).json()["user"] is None


async def test_too_many_failed_logins(client):
    _override_settings(login_max_failures=3)
    await register(client)
    for _ in range(3):
        assert (
            await client.post("/api/auth/login", json={"login": "alice", "password": "nope-nope"})
        ).status_code == 401
    # Locked out even with the right password until the window expires.
    r = await client.post("/api/auth/login", json={"login": "alice", "password": "password123"})
    assert r.status_code == 429 and r.json()["detail"]["code"] == "too_many_attempts"
