"""problem metadata, members, catalog, solutions

Revision ID: 561a33c4465f
Revises: faaf0ac385e1
Create Date: 2026-11-17 06:36:37.193467
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "561a33c4465f"
down_revision: str | None = "faaf0ac385e1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "languages",
        sa.Column("key", sa.String(length=16), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("ext", sa.String(length=16), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.PrimaryKeyConstraint("key", name=op.f("pk_languages")),
    )
    op.create_table(
        "problem_groups",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("slug", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_problem_groups")),
        sa.UniqueConstraint("slug", name=op.f("uq_problem_groups_slug")),
    )
    op.create_table(
        "problem_types",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=False), nullable=False),
        sa.Column("slug", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_problem_types")),
        sa.UniqueConstraint("slug", name=op.f("uq_problem_types_slug")),
    )
    op.create_table(
        "problem_languages",
        sa.Column("problem_id", sa.BigInteger(), nullable=False),
        sa.Column("language_key", sa.String(length=16), nullable=False),
        sa.ForeignKeyConstraint(
            ["language_key"],
            ["languages.key"],
            name=op.f("fk_problem_languages_language_key_languages"),
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["problem_id"], ["problems.id"], name=op.f("fk_problem_languages_problem_id_problems"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("problem_id", "language_key", name=op.f("pk_problem_languages")),
    )
    op.create_table(
        "problem_members",
        sa.Column("problem_id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "role",
            sa.Enum(
                "creator", "curator", "tester", name="member_role", native_enum=False, create_constraint=True, length=16
            ),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["problem_id"], ["problems.id"], name=op.f("fk_problem_members_problem_id_problems"), ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_problem_members_user_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("problem_id", "user_id", name=op.f("pk_problem_members")),
    )
    op.create_index(op.f("ix_problem_members_user_id"), "problem_members", ["user_id"], unique=False)
    op.create_table(
        "problem_solutions",
        sa.Column("problem_id", sa.BigInteger(), nullable=False),
        sa.Column("content_md", sa.Text(), server_default="", nullable=False),
        sa.Column("is_public", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("publish_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["problem_id"], ["problems.id"], name=op.f("fk_problem_solutions_problem_id_problems"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("problem_id", name=op.f("pk_problem_solutions")),
    )
    op.create_table(
        "problem_type_links",
        sa.Column("problem_id", sa.BigInteger(), nullable=False),
        sa.Column("type_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["problem_id"], ["problems.id"], name=op.f("fk_problem_type_links_problem_id_problems"), ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["type_id"],
            ["problem_types.id"],
            name=op.f("fk_problem_type_links_type_id_problem_types"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("problem_id", "type_id", name=op.f("pk_problem_type_links")),
    )
    op.create_index(op.f("ix_problem_type_links_type_id"), "problem_type_links", ["type_id"], unique=False)
    # Existing authors become "creator" members.
    op.execute(
        "INSERT INTO problem_members (problem_id, user_id, role) "
        "SELECT problem_id, user_id, 'creator' FROM problem_authors"
    )
    op.drop_index(op.f("ix_problem_authors_user_id"), table_name="problem_authors")
    op.drop_table("problem_authors")
    op.add_column("problems", sa.Column("points", sa.Float(), server_default="100", nullable=False))
    op.add_column(
        "problems",
        sa.Column(
            "scoring_mode",
            sa.Enum("icpc", "partial", name="scoring_mode", native_enum=False, create_constraint=True, length=16),
            server_default="icpc",
            nullable=False,
        ),
    )
    op.add_column("problems", sa.Column("published_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("problems", sa.Column("group_id", sa.BigInteger(), nullable=True))
    op.add_column(
        "problems",
        sa.Column(
            "source_visibility",
            sa.Enum(
                "default",
                "always",
                "solved",
                "only_own",
                name="source_visibility",
                native_enum=False,
                create_constraint=True,
                length=16,
            ),
            server_default="default",
            nullable=False,
        ),
    )
    op.add_column(
        "problems",
        sa.Column(
            "testcase_visibility",
            sa.Enum(
                "always",
                "outside_contest",
                "staff_only",
                name="testcase_visibility",
                native_enum=False,
                create_constraint=True,
                length=16,
            ),
            server_default="staff_only",
            nullable=False,
        ),
    )
    op.add_column(
        "problems",
        sa.Column(
            "testcase_result_visibility",
            sa.Enum(
                "all",
                "groups_only",
                "submission_only",
                name="testcase_result_visibility",
                native_enum=False,
                create_constraint=True,
                length=16,
            ),
            server_default="all",
            nullable=False,
        ),
    )
    op.create_index(op.f("ix_problems_group_id"), "problems", ["group_id"], unique=False)
    op.create_index(op.f("ix_problems_published_at"), "problems", ["published_at"], unique=False)
    op.create_foreign_key(
        op.f("fk_problems_group_id_problem_groups"),
        "problems",
        "problem_groups",
        ["group_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_check_constraint(op.f("ck_problems_points_range"), "problems", "points BETWEEN 0.01 AND 1000.0")
    # Problems that were already public count as published when they were created.
    op.execute("UPDATE problems SET published_at = created_at WHERE visibility = 'public'")
    # Existing problems accept every seeded language that is enabled.
    _seed_languages()
    op.execute(
        "INSERT INTO problem_languages (problem_id, language_key) "
        "SELECT p.id, l.key FROM problems p CROSS JOIN languages l WHERE l.is_enabled"
    )


# Languages installed in the vnoj/judge-tiervnoj image (checked with the judge's runtime list on 2026-11-17).
# key = dmoj executor name. Admins can rename, reorder or disable them later.
LANGUAGES = [
    # key, name, ext, enabled
    ("CPP17", "C++17", "cpp", True),
    ("CPP20", "C++20", "cpp", True),
    ("CPP14", "C++14", "cpp", True),
    ("CPP11", "C++11", "cpp", True),
    ("CPP23", "C++23", "cpp", True),
    ("CPP03", "C++03", "cpp", False),
    ("C", "C", "c", True),
    ("C11", "C11", "c", True),
    ("C23", "C23", "c", False),
    ("PY3", "Python 3", "py", True),
    ("PYPY3", "PyPy 3", "py", True),
    ("PY2", "Python 2", "py", False),
    ("PYPY", "PyPy 2", "py", False),
    ("JAVA", "Java", "java", True),
    ("JAVA8", "Java 8", "java", False),
    ("KOTLIN", "Kotlin", "kt", True),
    ("PAS", "Pascal", "pas", True),
    ("GO", "Go", "go", True),
    ("RUST", "Rust", "rs", True),
    ("PERL", "Perl", "pl", False),
    ("AWK", "AWK", "awk", False),
    ("SED", "sed", "sed", False),
    ("GAS64", "Assembly (x64)", "asm", False),
    ("SCRATCH", "Scratch", "sb3", False),
    ("CPPTHEMIS", "C++ (Themis)", "cpp", False),
    ("PASTHEMIS", "Pascal (Themis)", "pas", False),
    ("CPPICPC", "C++ (ICPC)", "cpp", False),
    ("CICPC", "C (ICPC)", "c", False),
    ("TEXT", "Text", "txt", False),
]


def _seed_languages() -> None:
    table = sa.table(
        "languages",
        sa.column("key", sa.String),
        sa.column("name", sa.String),
        sa.column("ext", sa.String),
        sa.column("is_enabled", sa.Boolean),
        sa.column("sort_order", sa.Integer),
    )
    op.bulk_insert(
        table,
        [
            {"key": k, "name": n, "ext": e, "is_enabled": on, "sort_order": i}
            for i, (k, n, e, on) in enumerate(LANGUAGES)
        ],
    )


def downgrade() -> None:
    op.drop_constraint(op.f("fk_problems_group_id_problem_groups"), "problems", type_="foreignkey")
    op.drop_index(op.f("ix_problems_published_at"), table_name="problems")
    op.drop_index(op.f("ix_problems_group_id"), table_name="problems")
    op.drop_constraint(op.f("ck_problems_points_range"), "problems", type_="check")
    op.drop_column("problems", "testcase_result_visibility")
    op.drop_column("problems", "testcase_visibility")
    op.drop_column("problems", "source_visibility")
    op.drop_column("problems", "group_id")
    op.drop_column("problems", "published_at")
    op.drop_column("problems", "scoring_mode")
    op.drop_column("problems", "points")
    op.create_table(
        "problem_authors",
        sa.Column("problem_id", sa.BIGINT(), autoincrement=False, nullable=False),
        sa.Column("user_id", sa.BIGINT(), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(
            ["problem_id"], ["problems.id"], name=op.f("fk_problem_authors_problem_id_problems"), ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_problem_authors_user_id_users"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("problem_id", "user_id", name=op.f("pk_problem_authors")),
    )
    op.create_index(op.f("ix_problem_authors_user_id"), "problem_authors", ["user_id"], unique=False)
    op.execute(
        "INSERT INTO problem_authors (problem_id, user_id) "
        "SELECT problem_id, user_id FROM problem_members WHERE role = 'creator'"
    )
    op.drop_index(op.f("ix_problem_type_links_type_id"), table_name="problem_type_links")
    op.drop_table("problem_type_links")
    op.drop_table("problem_solutions")
    op.drop_index(op.f("ix_problem_members_user_id"), table_name="problem_members")
    op.drop_table("problem_members")
    op.drop_table("problem_languages")
    op.drop_table("problem_types")
    op.drop_table("problem_groups")
    op.drop_table("languages")
