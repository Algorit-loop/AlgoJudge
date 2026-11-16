#!/usr/bin/env bash
# Tạo tài khoản superadmin cho AlgoJudge từ terminal.
#
#   ./scripts/create-superadmin.sh                       # hỏi lần lượt tên đăng nhập, email, mật khẩu
#   ./scripts/create-superadmin.sh --username root --email root@example.com
#
# Quyền superadmin chỉ cấp được từ terminal, không bao giờ qua web.
# Nâng một tài khoản có sẵn lên superadmin:
#   docker compose exec api python -m algojudge.cli set-role --username <tên> --role superadmin
set -euo pipefail
cd "$(dirname "$0")/.."

if ! docker compose ps --status running --services 2>/dev/null | grep -qx api; then
  echo "Service 'api' chưa chạy. Hãy chạy: docker compose up -d" >&2
  exit 1
fi

# `docker compose exec` allocates a terminal by default (needed for the hidden password prompt);
# disable it when stdin is not a terminal, so the script also works piped (with --password-stdin).
if [ -t 0 ]; then
  exec docker compose exec api python -m algojudge.cli create-superadmin "$@"
else
  exec docker compose exec -T api python -m algojudge.cli create-superadmin "$@"
fi
