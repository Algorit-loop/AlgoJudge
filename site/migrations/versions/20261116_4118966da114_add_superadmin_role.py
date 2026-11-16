"""add superadmin role

Revision ID: 4118966da114
Revises: e07c3d8dfc1d
Create Date: 2026-11-16 09:51:17.873159
"""

from collections.abc import Sequence

from alembic import op

revision: str = "4118966da114"
down_revision: str | None = "e07c3d8dfc1d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


OLD_ROLES = ("admin", "setter", "user")
NEW_ROLES = ("superadmin", "admin", "setter", "user")


def _role_check(roles: tuple[str, ...]) -> str:
    return "role IN (" + ", ".join(f"'{r}'" for r in roles) + ")"


def upgrade() -> None:
    op.drop_constraint(op.f("ck_users_role"), "users", type_="check")
    op.create_check_constraint(op.f("ck_users_role"), "users", _role_check(NEW_ROLES))


def downgrade() -> None:
    # Superadmins become plain admins before the role disappears.
    op.execute("UPDATE users SET role = 'admin' WHERE role = 'superadmin'")
    op.drop_constraint(op.f("ck_users_role"), "users", type_="check")
    op.create_check_constraint(op.f("ck_users_role"), "users", _role_check(OLD_ROLES))
