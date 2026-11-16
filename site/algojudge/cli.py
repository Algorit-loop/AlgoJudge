"""Command-line administration (run inside the api container, or use scripts/create-superadmin.sh).

    python -m algojudge.cli create-superadmin                 # asks for username, email, password
    python -m algojudge.cli create-user --username bob --email bob@x.y --role setter
    python -m algojudge.cli set-role --username alice --role admin

The terminal is the only place that can grant or remove the superadmin role.
Passwords are asked interactively, or read from one line of stdin with --password-stdin (for scripts).
"""

import argparse
import asyncio
import getpass
import re
import sys

from sqlalchemy import func, select

from algojudge.auth.users import AccountConflict, create_user
from algojudge.deps import close_connections, get_sessionmaker
from algojudge.models import Role, User

USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,32}$")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
FIELD_LABEL = {"username": "Tên đăng nhập", "email": "Email"}


def _ask(prompt: str, pattern: re.Pattern[str] | None = None, error: str = "") -> str:
    while True:
        value = input(prompt).strip()
        if value and (pattern is None or pattern.fullmatch(value)):
            return value
        print(error or "Không được để trống.")


def _read_password(from_stdin: bool) -> str:
    if from_stdin:
        password = sys.stdin.readline().rstrip("\n")
        if not 8 <= len(password) <= 128:
            sys.exit("Mật khẩu phải dài từ 8 đến 128 ký tự.")
        return password
    while True:
        password = getpass.getpass("Mật khẩu (8–128 ký tự): ")
        if not 8 <= len(password) <= 128:
            print("Mật khẩu phải dài từ 8 đến 128 ký tự.")
            continue
        if getpass.getpass("Nhập lại mật khẩu: ") != password:
            print("Mật khẩu nhập lại không khớp.")
            continue
        return password


def _validate(args: argparse.Namespace) -> None:
    if args.username is not None and not USERNAME_RE.fullmatch(args.username):
        sys.exit("Tên đăng nhập chỉ gồm 3–32 chữ cái không dấu, chữ số hoặc dấu gạch dưới.")
    if args.email is not None and not EMAIL_RE.fullmatch(args.email):
        sys.exit("Email không hợp lệ.")


async def _create(args: argparse.Namespace, role: Role) -> None:
    _validate(args)
    interactive = not args.password_stdin
    username = args.username or (
        _ask("Tên đăng nhập: ", USERNAME_RE, "Chỉ gồm 3–32 chữ cái không dấu, chữ số hoặc dấu gạch dưới.")
        if interactive
        else sys.exit("Cần --username.")
    )
    email = args.email or (
        _ask("Email: ", EMAIL_RE, "Email không hợp lệ.") if interactive else sys.exit("Cần --email.")
    )
    display_name = args.display_name
    if display_name is None and interactive:
        display_name = input("Tên hiển thị (Enter để dùng tên đăng nhập): ").strip() or None
    password = _read_password(args.password_stdin)

    async with get_sessionmaker()() as db:
        try:
            user = await create_user(
                db, username=username, email=email, password=password, display_name=display_name, role=role
            )
        except AccountConflict as exc:
            sys.exit(f"{FIELD_LABEL[exc.field]} đã được dùng cho tài khoản khác.")
    print(f"Đã tạo tài khoản #{user.id} {user.username} với vai trò {user.role.value}.")


async def _create_superadmin(args: argparse.Namespace) -> None:
    await _create(args, Role.SUPERADMIN)


async def _create_user(args: argparse.Namespace) -> None:
    await _create(args, Role(args.role))


async def _set_role(args: argparse.Namespace) -> None:
    new_role = Role(args.role)
    async with get_sessionmaker()() as db:
        user = await db.scalar(select(User).where(func.lower(User.username) == args.username.lower()))
        if user is None:
            sys.exit(f"Không có tài khoản {args.username}.")
        if user.role == Role.SUPERADMIN and new_role != Role.SUPERADMIN and not args.force:
            others = await db.scalar(
                select(func.count()).where(User.role == Role.SUPERADMIN, User.is_active, User.id != user.id)
            )
            if not others:
                sys.exit(
                    f"{user.username} là superadmin cuối cùng đang hoạt động. "
                    "Hãy tạo superadmin khác trước, hoặc thêm --force nếu chắc chắn."
                )
        old_role = user.role
        user.role = new_role
        await db.commit()
    print(f"{user.username}: {old_role.value} → {new_role.value}.")


def _add_account_args(p: argparse.ArgumentParser) -> None:
    p.add_argument("--username", help="Bỏ trống để được hỏi")
    p.add_argument("--email", help="Bỏ trống để được hỏi")
    p.add_argument("--display-name")
    p.add_argument("--password-stdin", action="store_true", help="Đọc mật khẩu từ một dòng trên stdin (không hỏi)")


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m algojudge.cli", description="Quản trị AlgoJudge từ terminal")
    sub = parser.add_subparsers(dest="command", required=True)
    roles = [r.value for r in Role]

    p = sub.add_parser("create-superadmin", help="Tạo tài khoản superadmin (hỏi lần lượt từng thông tin)")
    _add_account_args(p)
    p.set_defaults(func=_create_superadmin)

    p = sub.add_parser("create-user", help="Tạo tài khoản với vai trò bất kỳ")
    _add_account_args(p)
    p.add_argument("--role", choices=roles, default=Role.USER.value)
    p.set_defaults(func=_create_user)

    p = sub.add_parser("set-role", help="Đổi vai trò của một tài khoản (kể cả cấp/thu quyền superadmin)")
    p.add_argument("--username", required=True)
    p.add_argument("--role", choices=roles, required=True)
    p.add_argument("--force", action="store_true", help="Cho phép hạ quyền superadmin cuối cùng")
    p.set_defaults(func=_set_role)

    args = parser.parse_args()

    async def run() -> None:
        try:
            await args.func(args)
        finally:
            await close_connections()

    try:
        asyncio.run(run())
    except (KeyboardInterrupt, EOFError):
        sys.exit("\nĐã hủy.")


if __name__ == "__main__":
    main()
