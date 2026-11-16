"""Account operations shared by the API and the CLI."""

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from algojudge.auth.passwords import hash_password
from algojudge.models import Role, User


class AccountConflict(Exception):
    """Username or email already in use. `field` says which."""

    def __init__(self, field: str):
        super().__init__(field)
        self.field = field


async def find_by_login(db: AsyncSession, login: str) -> User | None:
    """Look a user up by username or email, ignoring letter case."""
    login = login.strip().lower()
    stmt = select(User).where(or_(func.lower(User.username) == login, func.lower(User.email) == login))
    return (await db.execute(stmt)).scalars().first()


async def create_user(
    db: AsyncSession,
    *,
    username: str,
    email: str,
    password: str,
    display_name: str | None = None,
    role: Role = Role.USER,
) -> User:
    username = username.strip()
    email = email.strip()
    for field, value, column in (("username", username, User.username), ("email", email, User.email)):
        exists = await db.scalar(select(User.id).where(func.lower(column) == value.lower()))
        if exists is not None:
            raise AccountConflict(field)

    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        display_name=(display_name or "").strip() or username,
        role=role,
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError as exc:
        # Lost a race with a concurrent sign-up using the same name/email.
        await db.rollback()
        field = "email" if "email" in str(exc.orig) else "username"
        raise AccountConflict(field) from exc
    await db.refresh(user)
    return user
