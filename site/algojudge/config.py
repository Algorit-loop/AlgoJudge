from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration, read from environment variables (see compose.yaml / .env.example)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://algojudge:algojudge@localhost:5432/algojudge"
    redis_url: str = "redis://localhost:6379/0"
    # How long /api/health waits for each dependency before reporting it as down.
    health_timeout_seconds: float = 2.0

    # --- Accounts / sessions ---
    # Whether anyone can create an account from the sign-up page. When false, only admins create accounts (CLI).
    registration_open: bool = True
    session_cookie_name: str = "aj_session"
    # Set to true when the site is served over HTTPS so the browser only sends the cookie over HTTPS.
    session_cookie_secure: bool = False
    # Lifetime of a session: "remember me" ticked vs not ticked.
    session_ttl_remember_seconds: int = 30 * 24 * 3600
    session_ttl_seconds: int = 24 * 3600
    # Failed logins allowed per (IP, login name) inside the window before answering 429.
    login_max_failures: int = 10
    login_failure_window_seconds: int = 15 * 60

    # --- Problems ---
    # Who may read others' source code when a problem's source visibility is "default":
    # "always", "solved" (users who solved the problem) or "only_own".
    default_source_visibility: str = "solved"

    # --- Uploaded files (problem statement images) ---
    # Written by the API, served read-only by nginx at media_url.
    media_dir: str = "/data/media"
    media_url: str = "/media/"
    max_image_bytes: int = 5 * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
