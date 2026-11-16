from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration, read from environment variables (see compose.yaml / .env.example)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://algojudge:algojudge@localhost:5432/algojudge"
    redis_url: str = "redis://localhost:6379/0"
    # How long /api/health waits for each dependency before reporting it as down.
    health_timeout_seconds: float = 2.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
