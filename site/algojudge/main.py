from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from algojudge.api import auth, health, users
from algojudge.api.errors import install_error_handlers
from algojudge.deps import close_connections


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    yield
    await close_connections()


# Every route lives under /api: nginx forwards /api/* here unchanged, everything else goes to the UI.
app = FastAPI(
    title="AlgoJudge API",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)
install_error_handlers(app)
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
