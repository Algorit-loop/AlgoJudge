from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from algojudge.models import Role
from algojudge.models.catalog import SLUG_PATTERN
from algojudge.models.problem import (
    MEMORY_LIMIT_KB_RANGE,
    POINTS_RANGE,
    PROBLEM_CODE_PATTERN,
    TIME_LIMIT_MS_RANGE,
    ScoringMode,
    SourceVisibility,
    TestcaseResultVisibility,
    TestcaseVisibility,
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


# --- Catalog: languages, problem types, problem groups ---


class LanguageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    name: str
    ext: str
    is_enabled: bool
    sort_order: int


class LanguageUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=64)
    is_enabled: bool | None = None
    sort_order: int | None = Field(default=None, ge=0, le=10_000)


class CatalogItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str


class CatalogItemCreate(BaseModel):
    slug: str = Field(pattern=SLUG_PATTERN)
    name: str = Field(min_length=1, max_length=100)


class CatalogItemUpdate(BaseModel):
    slug: str | None = Field(default=None, pattern=SLUG_PATTERN)
    name: str | None = Field(default=None, min_length=1, max_length=100)


# --- Problems ---

STATEMENT_MAX_CHARS = 100_000
TimeLimit = Annotated[int, Field(ge=TIME_LIMIT_MS_RANGE[0], le=TIME_LIMIT_MS_RANGE[1])]
MemoryLimit = Annotated[int, Field(ge=MEMORY_LIMIT_KB_RANGE[0], le=MEMORY_LIMIT_KB_RANGE[1])]
Points = Annotated[float, Field(ge=POINTS_RANGE[0], le=POINTS_RANGE[1])]


class ProblemSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    title: str
    points: float
    scoring_mode: ScoringMode
    time_limit_ms: int
    memory_limit_kb: int
    visibility: Visibility
    published_at: datetime | None
    created_at: datetime
    group: CatalogItem | None
    types: list[CatalogItem]


class ProblemList(BaseModel):
    items: list[ProblemSummary]
    total: int


class ProblemDetail(ProblemSummary):
    statement_md: str
    updated_at: datetime
    allowed_languages: list[LanguageOut]
    creators: list[PublicUser]
    has_solution: bool = False
    # What the current viewer may do.
    can_edit: bool = False
    can_change_visibility: bool = False
    can_delete: bool = False


class ProblemSettings(ProblemDetail):
    """Everything an editor sees: ProblemDetail plus staff lists and visibility policies."""

    curators: list[PublicUser]
    testers: list[PublicUser]
    source_visibility: SourceVisibility
    testcase_visibility: TestcaseVisibility
    testcase_result_visibility: TestcaseResultVisibility


class ProblemCreate(BaseModel):
    code: str = Field(pattern=PROBLEM_CODE_PATTERN)
    title: str = Field(min_length=1, max_length=200)
    statement_md: str = Field(default="", max_length=STATEMENT_MAX_CHARS)
    time_limit_ms: TimeLimit = 1000
    memory_limit_kb: MemoryLimit = 262_144
    points: Points = 100.0
    scoring_mode: ScoringMode = ScoringMode.ICPC


class ProblemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    statement_md: str | None = Field(default=None, max_length=STATEMENT_MAX_CHARS)
    time_limit_ms: TimeLimit | None = None
    memory_limit_kb: MemoryLimit | None = None
    points: Points | None = None
    scoring_mode: ScoringMode | None = None
    visibility: Visibility | None = None
    published_at: datetime | None = None
    # null clears the group; leave the field out to keep it.
    group_id: int | None = None
    type_ids: list[int] | None = Field(default=None, max_length=20)
    language_keys: list[str] | None = Field(default=None, max_length=100)
    source_visibility: SourceVisibility | None = None
    testcase_visibility: TestcaseVisibility | None = None
    testcase_result_visibility: TestcaseResultVisibility | None = None


class ProblemMembersUpdate(BaseModel):
    creators: list[str] = Field(max_length=20)
    curators: list[str] = Field(default_factory=list, max_length=20)
    testers: list[str] = Field(default_factory=list, max_length=100)


class SolutionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    content_md: str
    is_public: bool
    publish_at: datetime | None
    updated_at: datetime
    # True when visible to ordinary users right now (public and past publish_at).
    is_visible: bool = False


class SolutionUpdate(BaseModel):
    content_md: str = Field(max_length=STATEMENT_MAX_CHARS)
    is_public: bool = False
    publish_at: datetime | None = None


class ImageUploaded(BaseModel):
    url: str
