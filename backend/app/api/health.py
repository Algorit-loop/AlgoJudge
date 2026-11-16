import asyncio
from collections.abc import Awaitable, Callable
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.config import Settings, get_settings
from app.deps import get_engine, get_redis

router = APIRouter()

Status = Literal["ok", "down"]


class HealthResponse(BaseModel):
    status: Status
    database: Status
    redis: Status


async def _probe(check: Callable[[], Awaitable[object]], timeout: float) -> Status:
    try:
        await asyncio.wait_for(check(), timeout)
    except Exception:
        return "down"
    return "ok"


@router.get("/health", response_model=HealthResponse)
async def health(
    response: Response,
    settings: Annotated[Settings, Depends(get_settings)],
    engine: Annotated[AsyncEngine, Depends(get_engine)],
    redis: Annotated[Redis, Depends(get_redis)],
) -> HealthResponse:
    """Report whether the API and its dependencies are reachable. Returns 503 if any dependency is down."""

    async def check_db() -> None:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))

    db_status, redis_status = await asyncio.gather(
        _probe(check_db, settings.health_timeout_seconds),
        _probe(redis.ping, settings.health_timeout_seconds),
    )
    overall: Status = "ok" if db_status == redis_status == "ok" else "down"
    if overall != "ok":
        response.status_code = 503
    return HealthResponse(status=overall, database=db_status, redis=redis_status)
