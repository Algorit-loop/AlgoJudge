from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import health
from app.deps import close_connections


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    yield
    await close_connections()


# Every route lives under /api: nginx forwards /api/* here unchanged, everything else goes to the frontend.
app = FastAPI(
    title="AlgoJudge API",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)
app.include_router(health.router, prefix="/api")
