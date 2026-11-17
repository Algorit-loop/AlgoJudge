import enum
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Identity,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from algojudge.models.base import Base
from algojudge.models.user import User

# Problem codes are also directory names (problems/<code>/), so keep them simple and lowercase.
PROBLEM_CODE_PATTERN = r"^[a-z0-9_]{2,32}$"

TIME_LIMIT_MS_RANGE = (100, 20_000)
MEMORY_LIMIT_KB_RANGE = (16 * 1024, 2 * 1024 * 1024)  # 16 MB .. 2 GB


class Visibility(enum.StrEnum):
    PUBLIC = "public"  # listed and open to everyone
    PRIVATE = "private"  # only its authors and admins see it


class Problem(Base):
    __tablename__ = "problems"

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    # Immutable after creation: it names the test-data directory.
    code: Mapped[str] = mapped_column(String(32), unique=True)
    title: Mapped[str] = mapped_column(String(200))
    statement_md: Mapped[str] = mapped_column(Text, default="", server_default="")
    time_limit_ms: Mapped[int] = mapped_column(Integer, default=1000, server_default="1000")
    memory_limit_kb: Mapped[int] = mapped_column(Integer, default=262_144, server_default="262144")
    visibility: Mapped[Visibility] = mapped_column(
        Enum(
            Visibility,
            native_enum=False,
            create_constraint=True,
            length=16,
            values_callable=lambda e: [m.value for m in e],
            name="visibility",
        ),
        default=Visibility.PRIVATE,
        server_default=Visibility.PRIVATE.value,
    )
    created_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    authors: Mapped[list[User]] = relationship(secondary="problem_authors", order_by="User.username", lazy="selectin")

    __table_args__ = (
        CheckConstraint(f"code ~ '{PROBLEM_CODE_PATTERN}'", name="code_format"),
        CheckConstraint(
            f"time_limit_ms BETWEEN {TIME_LIMIT_MS_RANGE[0]} AND {TIME_LIMIT_MS_RANGE[1]}", name="time_limit_range"
        ),
        CheckConstraint(
            f"memory_limit_kb BETWEEN {MEMORY_LIMIT_KB_RANGE[0]} AND {MEMORY_LIMIT_KB_RANGE[1]}",
            name="memory_limit_range",
        ),
    )


class ProblemAuthor(Base):
    """People who may edit a problem (besides admins). The creator is the first author."""

    __tablename__ = "problem_authors"

    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True)
