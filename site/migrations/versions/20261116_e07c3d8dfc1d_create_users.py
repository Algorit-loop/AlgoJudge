"""create users

Revision ID: e07c3d8dfc1d
Revises:
Create Date: 2026-11-16 09:15:15.954235
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e07c3d8dfc1d"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("username", sa.String(length=32), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=64), nullable=False),
        sa.Column(
            "role",
            sa.Enum("admin", "setter", "user", name="role", native_enum=False, create_constraint=True, length=16),
            server_default="user",
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
    )
    # Case-insensitive uniqueness: "Alice" and "alice" are the same account.
    op.create_index("uq_users_username_lower", "users", [sa.literal_column("lower(username)")], unique=True)
    op.create_index("uq_users_email_lower", "users", [sa.literal_column("lower(email)")], unique=True)


def downgrade() -> None:
    op.drop_index("uq_users_email_lower", table_name="users")
    op.drop_index("uq_users_username_lower", table_name="users")
    op.drop_table("users")
