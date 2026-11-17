import enum
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Identity,
    Integer,
    String,
    Table,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from algojudge.models.base import Base
from algojudge.models.catalog import Language, ProblemGroup, ProblemType
from algojudge.models.user import User

# Problem codes are also directory names (problems/<code>/), so keep them simple and lowercase.
PROBLEM_CODE_PATTERN = r"^[a-z0-9_]{2,32}$"

TIME_LIMIT_MS_RANGE = (100, 20_000)
MEMORY_LIMIT_KB_RANGE = (16 * 1024, 2 * 1024 * 1024)  # 16 MB .. 2 GB
POINTS_RANGE = (0.01, 1000.0)


def _str_enum(cls: type[enum.StrEnum], name: str, length: int = 16) -> Enum:
    # Text + CHECK constraint (not a native PG enum), so adding a value later is a simple migration.
    return Enum(
        cls, native_enum=False, create_constraint=True, length=length,
        values_callable=lambda e: [m.value for m in e], name=name,
    )  # fmt: skip


class Visibility(enum.StrEnum):
    PUBLIC = "public"  # listed and open to everyone
    PRIVATE = "private"  # only its staff (creators, curators, testers) and admins see it


class ScoringMode(enum.StrEnum):
    # Stop at the first failed test; the submission gets all the points or none (ICPC style).
    ICPC = "icpc"
    # Every test (or test group) earns its share of the points.
    PARTIAL = "partial"


class SourceVisibility(enum.StrEnum):
    """Who may read other people's submitted source code for this problem (authors/admins always can)."""

    DEFAULT = "default"  # follow the site-wide setting
    ALWAYS = "always"  # everyone
    SOLVED = "solved"  # users who have solved the problem
    ONLY_OWN = "only_own"  # nobody: each user sees only their own code


class TestcaseVisibility(enum.StrEnum):
    """Who may see the input/output of the test cases."""

    __test__ = False  # not a pytest test class

    ALWAYS = "always"  # everyone
    OUTSIDE_CONTEST = "outside_contest"  # everyone, except while they are in a contest
    STAFF_ONLY = "staff_only"  # only creators, curators and admins


class TestcaseResultVisibility(enum.StrEnum):
    """How much of a submission's judging result its author sees."""

    __test__ = False

    ALL = "all"  # verdict, time and memory of every test case
    GROUPS_ONLY = "groups_only"  # only the result of each test group (subtask)
    SUBMISSION_ONLY = "submission_only"  # only the final verdict and score


class MemberRole(enum.StrEnum):
    CREATOR = "creator"  # edits the problem and is credited as an author
    CURATOR = "curator"  # edits the problem, not credited
    TESTER = "tester"  # sees the private problem (to test it), cannot edit


problem_type_links = Table(
    "problem_type_links",
    Base.metadata,
    Column("problem_id", ForeignKey("problems.id", ondelete="CASCADE"), primary_key=True),
    Column("type_id", ForeignKey("problem_types.id", ondelete="CASCADE"), primary_key=True, index=True),
)

problem_languages = Table(
    "problem_languages",
    Base.metadata,
    Column("problem_id", ForeignKey("problems.id", ondelete="CASCADE"), primary_key=True),
    Column("language_key", ForeignKey("languages.key", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True),
)


class Problem(Base):
    __tablename__ = "problems"

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    # Immutable after creation: it names the test-data directory.
    code: Mapped[str] = mapped_column(String(32), unique=True)
    title: Mapped[str] = mapped_column(String(200))
    statement_md: Mapped[str] = mapped_column(Text, default="", server_default="")
    time_limit_ms: Mapped[int] = mapped_column(Integer, default=1000, server_default="1000")
    memory_limit_kb: Mapped[int] = mapped_column(Integer, default=262_144, server_default="262144")
    points: Mapped[float] = mapped_column(Float, default=100.0, server_default="100")
    scoring_mode: Mapped[ScoringMode] = mapped_column(
        _str_enum(ScoringMode, "scoring_mode"), default=ScoringMode.ICPC, server_default=ScoringMode.ICPC.value
    )
    visibility: Mapped[Visibility] = mapped_column(
        _str_enum(Visibility, "visibility"), default=Visibility.PRIVATE, server_default=Visibility.PRIVATE.value
    )
    # Shown on the problem page and used to sort "newest". Set automatically on first publish if empty.
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    group_id: Mapped[int | None] = mapped_column(ForeignKey("problem_groups.id", ondelete="SET NULL"), index=True)
    source_visibility: Mapped[SourceVisibility] = mapped_column(
        _str_enum(SourceVisibility, "source_visibility"),
        default=SourceVisibility.DEFAULT,
        server_default=SourceVisibility.DEFAULT.value,
    )
    testcase_visibility: Mapped[TestcaseVisibility] = mapped_column(
        _str_enum(TestcaseVisibility, "testcase_visibility"),
        default=TestcaseVisibility.STAFF_ONLY,
        server_default=TestcaseVisibility.STAFF_ONLY.value,
    )
    testcase_result_visibility: Mapped[TestcaseResultVisibility] = mapped_column(
        _str_enum(TestcaseResultVisibility, "testcase_result_visibility"),
        default=TestcaseResultVisibility.ALL,
        server_default=TestcaseResultVisibility.ALL.value,
    )
    created_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    members: Mapped[list["ProblemMember"]] = relationship(
        back_populates="problem", cascade="all, delete-orphan", lazy="selectin"
    )
    group: Mapped[ProblemGroup | None] = relationship(lazy="selectin")
    types: Mapped[list[ProblemType]] = relationship(
        secondary=problem_type_links, order_by=ProblemType.name, lazy="selectin"
    )
    allowed_languages: Mapped[list[Language]] = relationship(
        secondary=problem_languages, order_by=(Language.sort_order, Language.key), lazy="selectin"
    )
    solution: Mapped["ProblemSolution | None"] = relationship(
        back_populates="problem", cascade="all, delete-orphan", lazy="selectin", uselist=False
    )

    __table_args__ = (
        CheckConstraint(f"code ~ '{PROBLEM_CODE_PATTERN}'", name="code_format"),
        CheckConstraint(
            f"time_limit_ms BETWEEN {TIME_LIMIT_MS_RANGE[0]} AND {TIME_LIMIT_MS_RANGE[1]}", name="time_limit_range"
        ),
        CheckConstraint(
            f"memory_limit_kb BETWEEN {MEMORY_LIMIT_KB_RANGE[0]} AND {MEMORY_LIMIT_KB_RANGE[1]}",
            name="memory_limit_range",
        ),
        CheckConstraint(f"points BETWEEN {POINTS_RANGE[0]} AND {POINTS_RANGE[1]}", name="points_range"),
    )

    def users_with(self, *roles: MemberRole) -> list[User]:
        return sorted((m.user for m in self.members if m.role in roles), key=lambda u: u.username.lower())

    def role_of(self, user_id: int) -> MemberRole | None:
        return next((m.role for m in self.members if m.user_id == user_id), None)


class ProblemMember(Base):
    """A user's role on one problem (creator, curator or tester). One role per user per problem."""

    __tablename__ = "problem_members"

    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True)
    role: Mapped[MemberRole] = mapped_column(_str_enum(MemberRole, "member_role"))

    problem: Mapped[Problem] = relationship(back_populates="members")
    user: Mapped[User] = relationship(lazy="selectin")


class ProblemSolution(Base):
    """The editorial (official solution write-up) of a problem."""

    __tablename__ = "problem_solutions"

    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id", ondelete="CASCADE"), primary_key=True)
    content_md: Mapped[str] = mapped_column(Text, default="", server_default="")
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    # When set, a public solution only becomes visible from this moment (e.g. after a contest ends).
    publish_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    problem: Mapped[Problem] = relationship(back_populates="solution")
