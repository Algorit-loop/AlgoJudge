"""Authentication dependencies: who is making this request, and are they allowed to."""

from collections.abc import Callable, Coroutine
from typing import Annotated, Any

from fastapi import Depends, Request
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from algojudge.api.errors import ApiError
from algojudge.auth.sessions import get_session_user_id
from algojudge.config import Settings, get_settings
from algojudge.deps import get_db, get_redis
from algojudge.models import Role, User

DbSession = Annotated[AsyncSession, Depends(get_db)]
RedisClient = Annotated[Redis, Depends(get_redis)]
AppSettings = Annotated[Settings, Depends(get_settings)]


async def get_current_user_optional(
    request: Request, db: DbSession, redis: RedisClient, settings: AppSettings
) -> User | None:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        return None
    user_id = await get_session_user_id(redis, token)
    if user_id is None:
        return None
    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        return None
    return user


OptionalUser = Annotated[User | None, Depends(get_current_user_optional)]


async def get_current_user(user: OptionalUser) -> User:
    if user is None:
        raise ApiError(401, "not_authenticated")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*roles: Role) -> Callable[[User], Coroutine[Any, Any, User]]:
    """Dependency factory: the current user must have one of the given roles (admins always pass)."""

    async def checker(user: CurrentUser) -> User:
        if user.role != Role.ADMIN and user.role not in roles:
            raise ApiError(403, "forbidden")
        return user

    return checker


AdminUser = Annotated[User, Depends(require_role(Role.ADMIN))]
