# AlgoJudge

Hệ thống chấm bài lập trình kiểu OJ + DOMjudge, dùng máy chấm VNOJ (dmoj). Thiết kế và các quyết định: xem [DESIGN.md](DESIGN.md).

## Chạy môi trường phát triển

Cần Docker và Docker Compose v2.

```bash
cp .env.example .env        # không bắt buộc, mọi giá trị đều có mặc định
docker compose up -d --build
```

Mở <http://localhost:8080>. Trang chủ hiện trạng thái API, CSDL và Redis.

| Đường dẫn | Đi tới |
|---|---|
| `/` | Giao diện React (`ui/` Vite dev server, tự tải lại khi sửa code) |
| `/api/*` | API FastAPI (`site/`, tự tải lại khi sửa code) |
| `/api/docs` | Tài liệu API (Swagger) |
| `/api/health` | Kiểm tra trạng thái: 200 nếu mọi thứ ổn, 503 nếu CSDL hoặc Redis mất kết nối |

Chỉ nginx mở cổng ra máy (mặc định 8080, đổi bằng `HTTP_PORT` trong `.env`).
Khi khởi động, service `api` tự chạy migration CSDL (`alembic upgrade head`).

### Tạo tài khoản superadmin

```bash
./scripts/create-superadmin.sh
```

Script hỏi lần lượt tên đăng nhập, email, tên hiển thị và mật khẩu. Cũng có thể truyền sẵn: `./scripts/create-superadmin.sh --username root --email root@example.com`.

Quyền **superadmin chỉ cấp được từ terminal**. Trên web, mỗi người chỉ quản lý được tài khoản có vai trò thấp hơn mình (superadmin > admin > setter > user). Các lệnh khác:

```bash
docker compose exec api python -m algojudge.cli set-role --username alice --role admin        # đổi vai trò (kể cả superadmin)
docker compose exec api python -m algojudge.cli create-user --username bob --email b@x.y --role setter
docker compose exec api python -m algojudge.cli --help
```

## Lệnh hay dùng

```bash
docker compose logs -f api                           # xem log
docker compose exec api pytest                       # test site (dùng CSDL riêng algojudge_test, Redis db 15)
docker compose exec api alembic revision --autogenerate -m "..."   # tạo migration sau khi sửa model
docker compose exec api ruff check .                 # lint site
docker compose exec ui npm run typecheck             # kiểm tra kiểu ui
docker compose down                                  # dừng (giữ dữ liệu)
docker compose down -v                               # dừng và XÓA dữ liệu CSDL/Redis (file trong data/ vẫn còn)
```

Thêm gói Python: sửa `site/pyproject.toml`, chạy `uv lock` (hoặc qua image `ghcr.io/astral-sh/uv`), rồi `docker compose up -d --build api`.
Thêm gói npm: `npm install <gói>` trong `ui/`, rồi `docker compose up -d --build ui`.

## Cấu trúc thư mục

```
site/           Python 3.12 (uv): FastAPI, sau này thêm Celery worker, bridge, wsevent
  algojudge/    package chính (api/, models/, bridge/, wsevent/, tasks/ — dùng chung model và cấu hình)
  tests/
ui/             React + TypeScript + Mantine + i18next (Vite)
judge-server/   Máy chấm VNOJ (dmoj judge-server), source đưa vào repo
deploy/nginx/   Cấu hình nginx
scripts/        Script tiện ích (create-superadmin.sh)
data/media/     File được upload (ảnh trong đề). Không đưa vào git, nginx phục vụ ở /media/
compose.yaml    Docker Compose cho môi trường phát triển
DESIGN.md       Tài liệu thiết kế
```
