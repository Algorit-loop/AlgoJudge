"""The CLI is run as a real subprocess against the test database (DATABASE_URL is inherited from conftest)."""

import asyncio
import os
import sys

from sqlalchemy import select

from algojudge.deps import get_sessionmaker
from algojudge.models import Role, User


async def _cli(*args: str, stdin: str = "") -> tuple[int, str]:
    proc = await asyncio.create_subprocess_exec(
        sys.executable,
        "-m",
        "algojudge.cli",
        *args,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        env=os.environ.copy(),
    )
    out, _ = await proc.communicate(stdin.encode())
    return proc.returncode or 0, out.decode()


async def _role(username: str) -> Role | None:
    async with get_sessionmaker()() as db:
        return await db.scalar(select(User.role).where(User.username == username))


async def test_create_superadmin_and_login(client):
    code, out = await _cli(
        "create-superadmin",
        "--username",
        "boss",
        "--email",
        "boss@example.com",
        "--password-stdin",
        stdin="supersecret1\n",
    )
    assert code == 0, out
    assert await _role("boss") == Role.SUPERADMIN
    r = await client.post("/api/auth/login", json={"login": "boss", "password": "supersecret1"})
    assert r.status_code == 200 and r.json()["role"] == "superadmin"


async def test_create_superadmin_rejects_duplicates_and_bad_input():
    args = ("create-superadmin", "--username", "boss", "--email", "boss@example.com", "--password-stdin")
    assert (await _cli(*args, stdin="supersecret1\n"))[0] == 0
    code, out = await _cli(*args, stdin="supersecret1\n")
    assert code != 0 and "đã được dùng" in out
    code, out = await _cli(
        "create-superadmin", "--username", "x", "--email", "a@b.c", "--password-stdin", stdin="supersecret1\n"
    )
    assert code != 0 and "Tên đăng nhập" in out
    code, out = await _cli(
        "create-superadmin", "--username", "boss2", "--email", "b@b.c", "--password-stdin", stdin="short\n"
    )
    assert code != 0 and "8 đến 128" in out


async def test_set_role_protects_last_superadmin():
    await _cli(
        "create-superadmin",
        "--username",
        "boss",
        "--email",
        "boss@example.com",
        "--password-stdin",
        stdin="supersecret1\n",
    )
    code, out = await _cli("set-role", "--username", "boss", "--role", "admin")
    assert code != 0 and "superadmin cuối cùng" in out
    assert await _role("boss") == Role.SUPERADMIN

    await _cli(
        "create-user",
        "--username",
        "boss2",
        "--email",
        "b2@example.com",
        "--role",
        "superadmin",
        "--password-stdin",
        stdin="supersecret1\n",
    )
    code, out = await _cli("set-role", "--username", "boss", "--role", "admin")
    assert code == 0, out
    assert await _role("boss") == Role.ADMIN
