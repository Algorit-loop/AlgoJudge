from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from algojudge.models import Role

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
