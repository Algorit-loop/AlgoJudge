from fastapi.testclient import TestClient

from app.deps import get_engine, get_redis
from app.main import app


class _Conn:
    def __init__(self, fail: bool):
        self.fail = fail

    async def __aenter__(self):
        if self.fail:
            raise ConnectionError("db down")
        return self

    async def __aexit__(self, *exc):
        return False

    async def execute(self, _stmt):
        return None


class _Engine:
    def __init__(self, fail: bool = False):
        self.fail = fail

    def connect(self):
        return _Conn(self.fail)


class _Redis:
    def __init__(self, fail: bool = False):
        self.fail = fail

    async def ping(self):
        if self.fail:
            raise ConnectionError("redis down")
        return True


def _client(db_fail: bool = False, redis_fail: bool = False) -> TestClient:
    app.dependency_overrides[get_engine] = lambda: _Engine(db_fail)
    app.dependency_overrides[get_redis] = lambda: _Redis(redis_fail)
    return TestClient(app)


def teardown_function():
    app.dependency_overrides.clear()


def test_health_ok():
    r = _client().get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "database": "ok", "redis": "ok"}


def test_health_db_down():
    r = _client(db_fail=True).get("/api/health")
    assert r.status_code == 503
    assert r.json() == {"status": "down", "database": "down", "redis": "ok"}


def test_health_redis_down():
    r = _client(redis_fail=True).get("/api/health")
    assert r.status_code == 503
    assert r.json() == {"status": "down", "database": "ok", "redis": "down"}
