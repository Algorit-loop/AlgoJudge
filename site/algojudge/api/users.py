from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import func, or_, select

from algojudge.api.deps import AdminUser, DbSession, RedisClient
from algojudge.api.errors import ApiError
from algojudge.api.schemas import AdminUserView, PublicUser, UserList, UserUpdate
from algojudge.auth.sessions import delete_all_sessions
from algojudge.models import Role, User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=UserList)
async def list_users(
    _admin: AdminUser,
    db: DbSession,
    q: Annotated[str | None, Query(max_length=100)] = None,
    role: Role | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> UserList:
    """Admin only: search users by username, display name or email."""
    stmt = select(User)
    if q:
        pattern = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(User.username).like(pattern),
                func.lower(User.display_name).like(pattern),
                func.lower(User.email).like(pattern),
            )
        )
    if role is not None:
        stmt = stmt.where(User.role == role)
    total = await db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = await db.scalars(stmt.order_by(User.id).offset((page - 1) * page_size).limit(page_size))
    return UserList(items=[AdminUserView.model_validate(u) for u in rows], total=total)


@router.get("/by-username/{username}", response_model=PublicUser)
async def get_user_by_username(username: str, db: DbSession) -> User:
    user = await db.scalar(select(User).where(func.lower(User.username) == username.lower(), User.is_active))
    if user is None:
        raise ApiError(404, "user_not_found")
    return user


@router.patch("/{user_id}", response_model=AdminUserView)
async def update_user(user_id: int, body: UserUpdate, admin: AdminUser, db: DbSession, redis: RedisClient) -> User:
    """Admin only: change a user's role or (de)activate the account.

    You can only manage accounts ranked below you, and only grant roles ranked below you:
    an admin manages setters/users; a superadmin also manages admins. Superadmin itself is never
    granted or changed from the web, only from the terminal (python -m algojudge.cli).
    """
    user = await db.get(User, user_id)
    if user is None:
        raise ApiError(404, "user_not_found")
    if user.id == admin.id:
        # Also guarantees the site never loses its last admin by someone demoting themselves.
        raise ApiError(400, "cannot_modify_self")
    if user.role.rank >= admin.role.rank:
        raise ApiError(403, "insufficient_rank")
    if body.role is not None and body.role.rank >= admin.role.rank:
        raise ApiError(403, "role_not_assignable", field="role")
    if body.role is not None:
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active
    await db.commit()
    if body.is_active is False:
        await delete_all_sessions(redis, user.id)
    return user
