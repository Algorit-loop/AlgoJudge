from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from algojudge.models import Role
from algojudge.models.problem import (
    MEMORY_LIMIT_KB_RANGE,
    PROBLEM_CODE_PATTERN,
    TIME_LIMIT_MS_RANGE,
    Visibility,
)

USERNAME_PATTERN = r"^[A-Za-z0-9_]{3,32}$"


class PublicUser(BaseModel):
    """What anyone may see about a user."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    display_name: str
    role: Role
    created_at: datetime


class Me(PublicUser):
    """The logged-in user's own account."""

    email: str


class AdminUserView(Me):
    is_active: bool
    last_login_at: datetime | None


class RegisterRequest(BaseModel):
    username: str = Field(pattern=USERNAME_PATTERN)
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=8, max_length=128)
    display_name: str | None = Field(default=None, max_length=64)


class LoginRequest(BaseModel):
    # Username or email.
    login: str = Field(min_length=1, max_length=254)
    password: str = Field(min_length=1, max_length=128)
    remember: bool = False


class MeResponse(BaseModel):
    user: Me | None


class RegistrationInfo(BaseModel):
    registration_open: bool


class UserList(BaseModel):
    items: list[AdminUserView]
    total: int


class UserUpdate(BaseModel):
    role: Role | None = None
    is_active: bool | None = None


# --- Problems ---

STATEMENT_MAX_CHARS = 100_000


class ProblemSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    title: str
    time_limit_ms: int
    memory_limit_kb: int
    visibility: Visibility
    created_at: datetime


class ProblemList(BaseModel):
    items: list[ProblemSummary]
    total: int


class ProblemDetail(ProblemSummary):
    statement_md: str
    updated_at: datetime
    authors: list[PublicUser]
    # Whether the current viewer may edit it / change who the authors are / publish it.
    can_edit: bool = False
    can_change_visibility: bool = False


class ProblemCreate(BaseModel):
    code: str = Field(pattern=PROBLEM_CODE_PATTERN)
    title: str = Field(min_length=1, max_length=200)
    statement_md: str = Field(default="", max_length=STATEMENT_MAX_CHARS)
    time_limit_ms: int = Field(default=1000, ge=TIME_LIMIT_MS_RANGE[0], le=TIME_LIMIT_MS_RANGE[1])
    memory_limit_kb: int = Field(default=262_144, ge=MEMORY_LIMIT_KB_RANGE[0], le=MEMORY_LIMIT_KB_RANGE[1])


class ProblemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    statement_md: str | None = Field(default=None, max_length=STATEMENT_MAX_CHARS)
    time_limit_ms: int | None = Field(default=None, ge=TIME_LIMIT_MS_RANGE[0], le=TIME_LIMIT_MS_RANGE[1])
    memory_limit_kb: int | None = Field(default=None, ge=MEMORY_LIMIT_KB_RANGE[0], le=MEMORY_LIMIT_KB_RANGE[1])
    visibility: Visibility | None = None


class ProblemAuthorsUpdate(BaseModel):
    usernames: list[str] = Field(max_length=20)


class ImageUploaded(BaseModel):
    url: str
