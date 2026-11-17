"""Lookup tables managed by admins: languages, problem types (categories) and problem groups."""

from sqlalchemy import BigInteger, Boolean, Identity, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from algojudge.models.base import Base

SLUG_PATTERN = r"^[a-z0-9_-]{1,32}$"


class Language(Base):
    """A submission language. `key` is the dmoj judge executor name (e.g. CPP17, PY3)."""

    __tablename__ = "languages"

    key: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(64))  # e.g. "C++17 (g++)"
    ext: Mapped[str] = mapped_column(String(16))  # source file extension, without the dot
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0")


class ProblemType(Base):
    """What kind of problem it is (shown on the problem page), e.g. "Quy hoạch động", "Đồ thị". A problem has many."""

    __tablename__ = "problem_types"

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    slug: Mapped[str] = mapped_column(String(32), unique=True)
    name: Mapped[str] = mapped_column(String(100))


class ProblemGroup(Base):
    """Where a problem is filed in the problem list, e.g. "VOI", "Luyện tập cơ bản". A problem has at most one."""

    __tablename__ = "problem_groups"

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    slug: Mapped[str] = mapped_column(String(32), unique=True)
    name: Mapped[str] = mapped_column(String(100))
