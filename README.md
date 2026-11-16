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
| `/` | Frontend React (Vite dev server, tự tải lại khi sửa code) |
| `/api/*` | Backend FastAPI (tự tải lại khi sửa code) |
| `/api/docs` | Tài liệu API (Swagger) |
| `/api/health` | Kiểm tra trạng thái: 200 nếu mọi thứ ổn, 503 nếu CSDL hoặc Redis mất kết nối |

Chỉ nginx mở cổng ra máy (mặc định 8080, đổi bằng `HTTP_PORT` trong `.env`).

## Lệnh hay dùng

```bash
docker compose logs -f backend                       # xem log
docker compose exec backend pytest                   # test backend
docker compose exec backend ruff check .             # lint backend
docker compose exec frontend npm run typecheck       # kiểm tra kiểu frontend
docker compose down                                  # dừng (giữ dữ liệu)
docker compose down -v                               # dừng và XÓA dữ liệu CSDL/Redis
```

Thêm gói Python: sửa `backend/pyproject.toml`, chạy `uv lock` (hoặc qua image `ghcr.io/astral-sh/uv`), rồi `docker compose up -d --build backend`.
Thêm gói npm: `npm install <gói>` trong `frontend/`, rồi `docker compose up -d --build frontend`.

## Cấu trúc thư mục

```
backend/        FastAPI (Python 3.12, uv)
frontend/       React + TypeScript + Mantine + i18next (Vite)
deploy/nginx/   Cấu hình nginx
judge-server/   Máy chấm VNOJ (dmoj), source đưa vào repo
compose.yaml    Docker Compose cho môi trường phát triển
DESIGN.md       Tài liệu thiết kế
```
