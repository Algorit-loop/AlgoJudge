"""Server-side sessions stored in Redis.

The browser only holds a random token in an httpOnly cookie. Redis maps sha256(token) -> user id,
so a Redis dump does not contain usable tokens. Each user also has a set of their session keys,
which lets us log a user out everywhere (e.g. when an admin deactivates the account).
"""

import hashlib
import secrets

from redis.asyncio import Redis

_SESSION_PREFIX = "session:"
_USER_SESSIONS_PREFIX = "user_sessions:"


def _key(token: str) -> str:
    return _SESSION_PREFIX + hashlib.sha256(token.encode()).hexdigest()


async def create_session(redis: Redis, user_id: int, ttl_seconds: int) -> str:
    token = secrets.token_urlsafe(32)
    key = _key(token)
    user_key = f"{_USER_SESSIONS_PREFIX}{user_id}"
    async with redis.pipeline(transaction=True) as pipe:
        pipe.set(key, str(user_id), ex=ttl_seconds)
        pipe.sadd(user_key, key)
        # The index set lives as long as the longest session it may contain.
        pipe.expire(user_key, ttl_seconds, gt=True)
        pipe.expire(user_key, ttl_seconds, nx=True)
        await pipe.execute()
    return token


async def get_session_user_id(redis: Redis, token: str) -> int | None:
    value = await redis.get(_key(token))
    return int(value) if value is not None else None


async def delete_session(redis: Redis, token: str) -> None:
    key = _key(token)
    user_id = await redis.get(key)
    async with redis.pipeline(transaction=True) as pipe:
        pipe.delete(key)
        if user_id is not None:
            pipe.srem(f"{_USER_SESSIONS_PREFIX}{user_id}", key)
        await pipe.execute()


async def delete_all_sessions(redis: Redis, user_id: int) -> None:
    user_key = f"{_USER_SESSIONS_PREFIX}{user_id}"
    keys = await redis.smembers(user_key)
    await redis.delete(user_key, *keys)
