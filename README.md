# AlgoJudge

Hệ thống chấm bài lập trình kiểu OJ + DOMjudge, dùng máy chấm VNOJ (dmoj). Thiết kế và các quyết định: xem [DESIGN.md](DESIGN.md).

## Chạy môi trường phát triển

Cần Docker và Docker Compose v2, và tài khoản nằm trong nhóm `docker`.

```bash
./scripts/init.sh             # tạo data/, tạo .env từ .env.example, giao quyền thư mục dữ liệu
docker compose up -d --build  # hoặc gộp hai bước: ./scripts/init.sh --start
```

`scripts/init.sh` chạy lại bao nhiêu lần cũng được: không ghi đè file cấu hình đã có, không xóa dữ liệu. Nó làm ba việc:
- Tạo các thư mục `data/postgres`, `data/redis`, `data/media`, `data/backups` nếu chưa có.
- Với mỗi file mẫu `<tên>.example` trong git, tạo file cấu hình chính `<tên>` nếu chưa có (hiện chỉ có `.env`). `.env` mới được đặt `POSTGRES_PASSWORD` ngẫu nhiên nếu CSDL chưa được tạo. Nếu `.env` đã có mà file mẫu có thêm biến mới, biến mới được nối vào cuối `.env`.
- Giao các thư mục dữ liệu cho user của từng service (xem mục "Dữ liệu và sao lưu").

Cấu hình nằm trong `.env`, không sửa `.env.example`. Sửa xong chạy `docker compose up -d` để áp dụng.

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
docker compose exec --user "$(id -u):$(id -g)" api alembic revision --autogenerate -m "..."   # tạo migration (chạy bằng UID của bạn để file thuộc về bạn)
docker compose exec api ruff check .                 # lint site
docker compose exec ui npm run typecheck             # kiểm tra kiểu ui
docker compose down                                  # dừng (dữ liệu trong data/ vẫn còn)
```

## Dữ liệu và sao lưu

Mọi dữ liệu nằm trong `data/` của repo dưới dạng file thật, không dùng volume của Docker. Xóa container, `docker compose down -v`, xóa image hay cài lại Docker đều không ảnh hưởng tới `data/`.

**Dữ liệu được bảo vệ khỏi xóa nhầm.** Mỗi thư mục trong `data/` thuộc về user của service ghi vào nó, không phải tài khoản của bạn. Vì vậy `rm -rf`, `git clean -x` hay ghi đè nhầm đều bị từ chối, muốn xóa phải dùng `sudo`. Bạn vẫn đọc được `media/`, `redis/` và `backups/` (để chép bản sao lưu đi nơi khác).

| Thư mục | Chủ sở hữu | Ai giao quyền |
|---|---|---|
| `data/postgres/pgdata/` | UID 70 (`postgres` trong image) | Image PostgreSQL, mỗi lần khởi động |
| `data/redis/` | UID 999 (`redis` trong image) | Service `data-init` |
| `data/media/` | UID 10001 (user của ứng dụng, service `api`) | Service `data-init` |
| `data/backups/` | UID 70 (bản dump do `pg_dump` trong container ghi) | Service `data-init` |

`data-init` là service chạy một lần bằng root trước khi `api` và `postgres` khởi động. `scripts/init.sh` cũng gọi nó.
Lưu ý: tài khoản nằm trong nhóm `docker` vẫn có thể dùng Docker để xóa, nên đây là lớp chống tai nạn, không phải lớp bảo mật. Lớp này cũng không cứu được khi hỏng ổ đĩa, nên hãy chép bản sao lưu ra máy khác.

```bash
# Sao lưu (không cần sudo, chạy được khi site đang chạy). File nằm ở data/backups/
docker compose exec -T -u postgres postgres pg_dump -U algojudge -d algojudge -f /backups/$(date +%F).sql
# Khôi phục vào CSDL đang chạy
docker compose exec -T -u postgres postgres psql -U algojudge -d algojudge -f /backups/YYYY-MM-DD.sql
# Xóa một bản sao lưu cũ
docker compose exec -T postgres rm /backups/YYYY-MM-DD.sql
# Chép nguyên thư mục data/ (phải dừng trước, chép lúc đang chạy có thể hỏng CSDL)
docker compose stop && sudo cp -a data ../algojudge-data-$(date +%F) && docker compose start
# Xóa CSDL có chủ đích để làm lại từ đầu (cần sudo)
docker compose stop postgres && sudo rm -rf data/postgres/pgdata && docker compose up -d
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
data/           Mọi dữ liệu lúc chạy, không đưa vào git:
  postgres/     CSDL PostgreSQL (trong pgdata/)
  redis/        Redis (phiên đăng nhập, cache)
  media/        File được upload (ảnh trong đề), nginx phục vụ ở /media/
  backups/      Nơi đặt các file sao lưu
compose.yaml    Docker Compose cho môi trường phát triển
DESIGN.md       Tài liệu thiết kế
```
