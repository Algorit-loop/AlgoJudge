from datetime import UTC, datetime

from fastapi import APIRouter, Request, Response

from algojudge.api.deps import AppSettings, DbSession, OptionalUser, RedisClient
from algojudge.api.errors import ApiError
from algojudge.api.schemas import LoginRequest, Me, MeResponse, RegisterRequest, RegistrationInfo
from algojudge.auth.passwords import hash_password, needs_rehash, verify_password
from algojudge.auth.sessions import create_session, delete_session
from algojudge.auth.users import AccountConflict, create_user, find_by_login
from algojudge.config import Settings
from algojudge.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


def _client_ip(request: Request) -> str:
    # nginx sets X-Real-IP; fall back to the socket address when called directly (tests, dev without nginx).
    return request.headers.get("x-real-ip") or (request.client.host if request.client else "unknown")


async def _start_session(
    response: Response, redis: RedisClient, settings: Settings, user: User, remember: bool
) -> None:
    ttl = settings.session_ttl_remember_seconds if remember else settings.session_ttl_seconds
    token = await create_session(redis, user.id, ttl)
    response.set_cookie(
        settings.session_cookie_name,
        token,
        # Without "remember me" the cookie dies with the browser session (the server copy expires after `ttl`).
        max_age=ttl if remember else None,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        path="/",
    )


@router.get("/registration", response_model=RegistrationInfo)
async def registration_info(settings: AppSettings) -> RegistrationInfo:
    return RegistrationInfo(registration_open=settings.registration_open)


@router.post("/register", response_model=Me, status_code=201)
async def register(
    body: RegisterRequest, response: Response, db: DbSession, redis: RedisClient, settings: AppSettings
) -> User:
    if not settings.registration_open:
        raise ApiError(403, "registration_closed")
    try:
        user = await create_user(
            db, username=body.username, email=str(body.email), password=body.password, display_name=body.display_name
        )
    except AccountConflict as exc:
        raise ApiError(409, f"{exc.field}_taken", field=exc.field) from exc
    await _start_session(response, redis, settings, user, remember=False)
    return user


@router.post("/login", response_model=Me)
async def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    db: DbSession,
    redis: RedisClient,
    settings: AppSettings,
) -> User:
    fail_key = f"login_fail:{_client_ip(request)}:{body.login.strip().lower()}"
    failures = int(await redis.get(fail_key) or 0)
    if failures >= settings.login_max_failures:
        raise ApiError(429, "too_many_attempts")

    user = await find_by_login(db, body.login)
    if not verify_password(user.password_hash if user else None, body.password) or user is None:
        async with redis.pipeline(transaction=True) as pipe:
            pipe.incr(fail_key)
            pipe.expire(fail_key, settings.login_failure_window_seconds, nx=True)
            await pipe.execute()
        raise ApiError(401, "invalid_credentials")
    if not user.is_active:
        raise ApiError(403, "account_disabled")

    await redis.delete(fail_key)
    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(body.password)
    user.last_login_at = datetime.now(UTC)
    await db.commit()
    await _start_session(response, redis, settings, user, remember=body.remember)
    return user


@router.post("/logout", status_code=204)
async def logout(request: Request, response: Response, redis: RedisClient, settings: AppSettings) -> None:
    token = request.cookies.get(settings.session_cookie_name)
    if token:
        await delete_session(redis, token)
    response.delete_cookie(settings.session_cookie_name, path="/")


@router.get("/me", response_model=MeResponse)
async def me(user: OptionalUser) -> MeResponse:
    # Always 200: "not logged in" is a normal state for the UI, not an error.
    return MeResponse(user=Me.model_validate(user) if user else None)
