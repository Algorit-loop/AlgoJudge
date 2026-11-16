"""Command-line administration.

    docker compose exec api python -m algojudge.cli create-user --username admin --email a@b.c --role admin
    docker compose exec api python -m algojudge.cli set-role --username alice --role setter

The password is asked interactively, or read from stdin with --password-stdin (for scripts).
"""

import argparse
import asyncio
import getpass
import sys

from sqlalchemy import func, select

from algojudge.auth.users import AccountConflict, create_user
from algojudge.deps import close_connections, get_sessionmaker
from algojudge.models import Role, User


def _read_password(from_stdin: bool) -> str:
    if from_stdin:
        password = sys.stdin.readline().rstrip("\n")
    else:
        password = getpass.getpass("Mật khẩu: ")
        if getpass.getpass("Nhập lại mật khẩu: ") != password:
            sys.exit("Mật khẩu nhập lại không khớp.")
    if not 8 <= len(password) <= 128:
        sys.exit("Mật khẩu phải dài từ 8 đến 128 ký tự.")
    return password


async def _create_user(args: argparse.Namespace) -> None:
    password = _read_password(args.password_stdin)
    async with get_sessionmaker()() as db:
        try:
            user = await create_user(
                db,
                username=args.username,
                email=args.email,
                password=password,
                display_name=args.display_name,
                role=Role(args.role),
            )
        except AccountConflict as exc:
            sys.exit(f"{exc.field} đã được dùng.")
    print(f"Đã tạo tài khoản #{user.id} {user.username} ({user.role.value}).")


async def _set_role(args: argparse.Namespace) -> None:
    async with get_sessionmaker()() as db:
        user = await db.scalar(select(User).where(func.lower(User.username) == args.username.lower()))
        if user is None:
            sys.exit(f"Không có tài khoản {args.username}.")
        user.role = Role(args.role)
        await db.commit()
    print(f"{user.username} giờ có vai trò {user.role.value}.")


def main() -> None:
    parser = argparse.ArgumentParser(prog="algojudge.cli")
    sub = parser.add_subparsers(dest="command", required=True)
    roles = [r.value for r in Role]

    p = sub.add_parser("create-user", help="Tạo tài khoản (dùng --role admin để tạo admin đầu tiên)")
    p.add_argument("--username", required=True)
    p.add_argument("--email", required=True)
    p.add_argument("--display-name")
    p.add_argument("--role", choices=roles, default=Role.USER.value)
    p.add_argument("--password-stdin", action="store_true", help="Đọc mật khẩu từ một dòng trên stdin")
    p.set_defaults(func=_create_user)

    p = sub.add_parser("set-role", help="Đổi vai trò của một tài khoản")
    p.add_argument("--username", required=True)
    p.add_argument("--role", choices=roles, required=True)
    p.set_defaults(func=_set_role)

    args = parser.parse_args()

    async def run() -> None:
        try:
            await args.func(args)
        finally:
            await close_connections()

    asyncio.run(run())


if __name__ == "__main__":
    main()
