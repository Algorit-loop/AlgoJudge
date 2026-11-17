"""Test setup: a throw-away PostgreSQL database and Redis db 15, migrated with Alembic.

Runs inside the api container: `docker compose exec api pytest`.
"""

import asyncio
import os
import tempfile

# Point the app at the test database/redis BEFORE anything reads the settings.
_base_url = os.environ.get("DATABASE_URL", "postgresql+asyncpg://algojudge:algojudge@localhost:5432/algojudge")
_server_url, _ = _base_url.rsplit("/", 1)
TEST_DB = "algojudge_test"
os.environ["DATABASE_URL"] = f"{_server_url}/{TEST_DB}"
os.environ["REDIS_URL"] = os.environ.get("REDIS_URL", "redis://localhost:6379/0").rsplit("/", 1)[0] + "/15"
# Uploaded files go to a throw-away directory, not the real media folder.
os.environ["MEDIA_DIR"] = tempfile.mkdtemp(prefix="algojudge-test-media-")

import httpx2  # noqa: E402
import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from sqlalchemy import text  # noqa: E402
from sqlalchemy.ext.asyncio import create_async_engine  # noqa: E402

from algojudge.config import get_settings  # noqa: E402
from algojudge.deps import close_connections, get_engine, get_redis  # noqa: E402
from algojudge.main import app  # noqa: E402

_LANGUAGES: list[dict] = []


@pytest.fixture(scope="session", autouse=True)
async def _database():
    admin_engine = create_async_engine(f"{_server_url}/postgres", isolation_level="AUTOCOMMIT")
    async with admin_engine.connect() as conn:
        await conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB}" WITH (FORCE)'))
        await conn.execute(text(f'CREATE DATABASE "{TEST_DB}"'))
    await admin_engine.dispose()

    cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    cfg.attributes["url"] = os.environ["DATABASE_URL"]
    # Alembic's env.py runs its own event loop, so run it in a worker thread.
    await asyncio.to_thread(command.upgrade, cfg, "head")
    # The migration seeds the language list; keep a copy to restore it before every test.
    async with get_engine().connect() as conn:
        rows = (await conn.execute(text("SELECT key, name, ext, is_enabled, sort_order FROM languages"))).mappings()
        _LANGUAGES[:] = [dict(r) for r in rows]
    yield
    await close_connections()


@pytest.fixture(autouse=True)
async def _clean_state():
    async with get_engine().begin() as conn:
        await conn.execute(
            text("TRUNCATE users, problems, problem_types, problem_groups, languages RESTART IDENTITY CASCADE")
        )
        await conn.execute(
            text(
                "INSERT INTO languages (key, name, ext, is_enabled, sort_order) "
                "VALUES (:key, :name, :ext, :is_enabled, :sort_order)"
            ),
            _LANGUAGES,
        )
    await get_redis().flushdb()
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def settings():
    return get_settings()


@pytest.fixture
async def client():
    async with httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture
async def new_client():
    """Factory for extra, independent clients (separate cookie jars = separate browsers)."""
    clients: list[httpx2.AsyncClient] = []

    def make() -> httpx2.AsyncClient:
        c = httpx2.AsyncClient(transport=httpx2.ASGITransport(app=app), base_url="http://test")
        clients.append(c)
        return c

    yield make
    for c in clients:
        await c.aclose()


async def register(client, username="alice", email=None, password="password123", **extra):
    body = {"username": username, "email": email or f"{username}@example.com", "password": password, **extra}
    return await client.post("/api/auth/register", json=body)


async def login_as(new_client, username: str, role, password: str = "password123"):
    """Create a user with `role` directly in the DB and return a client logged in as them."""
    from algojudge.auth.users import create_user
    from algojudge.deps import get_sessionmaker

    async with get_sessionmaker()() as db:
        await create_user(db, username=username, email=f"{username}@example.com", password=password, role=role)
    c = new_client()
    r = await c.post("/api/auth/login", json={"login": username, "password": password})
    assert r.status_code == 200, r.text
    return c
