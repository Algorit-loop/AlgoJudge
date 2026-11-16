"""Shared connections to PostgreSQL and Redis, created once per process."""

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.config import get_settings

_engine: AsyncEngine | None = None
_redis: Redis | None = None


def get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        _engine = create_async_engine(get_settings().database_url, pool_pre_ping=True)
    return _engine


def get_redis() -> Redis:
    global _redis
    if _redis is None:
        _redis = Redis.from_url(get_settings().redis_url)
    return _redis


async def close_connections() -> None:
    global _engine, _redis
    if _engine is not None:
        await _engine.dispose()
        _engine = None
    if _redis is not None:
        await _redis.aclose()
        _redis = None
