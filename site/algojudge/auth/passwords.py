"""Password hashing with Argon2id (argon2-cffi defaults follow the RFC 9106 recommendations)."""

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

_hasher = PasswordHasher()

# Verified against when the login name does not exist, so a failed login takes the same time either way
# and response timing does not reveal which usernames exist.
_DUMMY_HASH = _hasher.hash("algojudge-timing-equaliser")


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str | None, password: str) -> bool:
    try:
        return _hasher.verify(password_hash or _DUMMY_HASH, password) and password_hash is not None
    except (VerificationError, InvalidHashError):
        return False


def needs_rehash(password_hash: str) -> bool:
    return _hasher.check_needs_rehash(password_hash)
