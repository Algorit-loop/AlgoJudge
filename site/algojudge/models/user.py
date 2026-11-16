import enum
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, Identity, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column

from algojudge.models.base import Base


class Role(enum.StrEnum):
    # Highest first. A role can only be granted from the terminal (CLI) if it is SUPERADMIN.
    SUPERADMIN = "superadmin"  # everything admins can do, plus managing admins; created only via the CLI
    ADMIN = "admin"  # manages the site and users below admin
    SETTER = "setter"  # creates and edits problems and contests
    USER = "user"  # solves problems, takes part in contests

    @property
    def rank(self) -> int:
        return _RANK[self]

    @property
    def is_admin(self) -> bool:
        """Admin or above."""
        return self.rank >= _RANK[Role.ADMIN]


_RANK = {Role.USER: 0, Role.SETTER: 1, Role.ADMIN: 2, Role.SUPERADMIN: 3}


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    username: Mapped[str] = mapped_column(String(32))
    email: Mapped[str] = mapped_column(String(254))
    password_hash: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(64))
    # Stored as text with a CHECK constraint (not a native PG enum) so adding a role later is a simple migration.
    role: Mapped[Role] = mapped_column(
        Enum(
            Role,
            native_enum=False,
            create_constraint=True,
            length=16,
            values_callable=lambda e: [m.value for m in e],
            name="role",
        ),
        default=Role.USER,
        server_default=Role.USER.value,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        # Usernames and emails are unique regardless of letter case ("Alice" and "alice" are the same account).
        Index("uq_users_username_lower", func.lower(username), unique=True),
        Index("uq_users_email_lower", func.lower(email), unique=True),
    )
