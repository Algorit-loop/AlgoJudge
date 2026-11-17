#!/usr/bin/env bash
# Chuẩn bị AlgoJudge để chạy: tạo thư mục dữ liệu, tạo file cấu hình từ file mẫu, giao quyền thư mục dữ liệu.
#
#   ./scripts/init.sh            # chuẩn bị xong thì dừng, tự chạy `docker compose up -d --build` sau
#   ./scripts/init.sh --start    # chuẩn bị xong thì khởi động luôn
#
# Chạy lại bao nhiêu lần cũng được. Script KHÔNG BAO GIỜ ghi đè file cấu hình đã có và không xóa dữ liệu:
#   - <tên>.example (file mẫu, trong git)  →  <tên> (file cấu hình chính, không trong git), chỉ tạo khi chưa có.
#   - Nếu file chính đã có mà file mẫu có thêm biến mới, biến mới được nối vào cuối file chính.
#   - .env mới tạo trên CSDL chưa khởi tạo thì được đặt POSTGRES_PASSWORD ngẫu nhiên.
set -euo pipefail
cd "$(dirname "$0")/.."

start=false
for arg in "$@"; do
  case "$arg" in
    --start) start=true ;;
    -h|--help) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Không hiểu tham số: $arg (xem --help)" >&2; exit 2 ;;
  esac
done

say() { printf '  %s\n' "$*"; }

# --- 1. Kiểm tra công cụ ---------------------------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "Chưa có Docker. Cài Docker Engine trước: https://docs.docker.com/engine/install/" >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Chưa có Docker Compose v2 (lệnh 'docker compose')." >&2
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "Không gọi được Docker. Docker đã chạy chưa, và tài khoản này có trong nhóm 'docker' chưa?" >&2
  exit 1
fi

# --- 2. Thư mục dữ liệu ----------------------------------------------------------------------------------
echo "Thư mục dữ liệu (data/):"
for dir in data/postgres data/redis data/media data/backups; do
  if [ -d "$dir" ]; then
    say "đã có   $dir"
  else
    mkdir -p "$dir"
    say "tạo     $dir"
  fi
done

# --- 3. File cấu hình từ file mẫu ------------------------------------------------------------------------
random_password() {
  # 32 letters/digits; avoids characters that would need escaping in a database URL.
  LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32 || true
}

# Append to $2 every KEY=... line of $1 whose KEY is not defined in $2. Prints the keys added.
merge_missing_keys() {
  local example=$1 target=$2 line key added=()
  while IFS= read -r line || [ -n "$line" ]; do
    [[ $line =~ ^([A-Za-z_][A-Za-z0-9_]*)= ]] || continue
    key=${BASH_REMATCH[1]}
    grep -qE "^${key}=" "$target" && continue
    [ ${#added[@]} -eq 0 ] && printf '\n# Added by scripts/init.sh on %s (new in %s)\n' "$(date +%F)" "$example" >>"$target"
    printf '%s\n' "$line" >>"$target"
    added+=("$key")
  done <"$example"
  [ ${#added[@]} -eq 0 ] || echo "${added[*]}"
}

echo "File cấu hình:"
# Only sample files tracked by git, so nothing from reference/ or node_modules/ is picked up.
while IFS= read -r example; do
  target=${example%.example}
  if [ ! -e "$target" ]; then
    cp "$example" "$target"
    if [ "$(basename "$target")" = ".env" ]; then
      chmod 600 "$target"  # holds the database password
      if [ -d data/postgres/pgdata ]; then
        say "tạo     $target  (giữ mật khẩu CSDL mẫu, vì CSDL trong data/postgres đã được tạo với mật khẩu đó)"
      else
        sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(random_password)/" "$target"
        say "tạo     $target  (POSTGRES_PASSWORD ngẫu nhiên)"
      fi
    else
      say "tạo     $target"
    fi
  else
    added=""
    case "$target" in
      *.env|.env) added=$(merge_missing_keys "$example" "$target") ;;
    esac
    if [ -n "$added" ]; then
      say "bổ sung $target: $added"
    else
      say "đã có   $target"
    fi
  fi
done < <(git ls-files -- '*.example' '.*.example' 2>/dev/null | sort -u)

# --- 4. Giao quyền thư mục dữ liệu -----------------------------------------------------------------------
# data-init (compose.yaml) runs as root and gives media/ and backups/ to their service users; postgres and redis
# take their own directories when they start. After that your account can no longer delete data by accident.
echo "Giao quyền thư mục dữ liệu cho các service:"
docker compose run --rm --no-deps data-init >/dev/null
say "xong (xóa dữ liệu từ giờ phải dùng sudo, xem README mục \"Dữ liệu và sao lưu\")"

# --- 5. Khởi động ----------------------------------------------------------------------------------------
if $start; then
  echo "Khởi động:"
  docker compose up -d --build
  port=$(grep -E '^HTTP_PORT=' .env 2>/dev/null | cut -d= -f2)
  echo
  echo "Mở http://localhost:${port:-8080}"
  echo "Tạo tài khoản quản trị đầu tiên: ./scripts/create-superadmin.sh"
else
  echo
  echo "Bước tiếp theo:"
  echo "  1. Xem lại .env nếu cần (cổng, đăng ký mở hay đóng...)"
  echo "  2. docker compose up -d --build"
  echo "  3. ./scripts/create-superadmin.sh"
fi
