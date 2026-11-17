# AlgoJudge — Tài liệu thiết kế

> File này ghi lại những gì **đã thảo luận và chốt** cho dự án, để người và Claude cùng nắm dự án rõ ràng, chính xác.
> Cập nhật mỗi khi có quyết định quan trọng. Ghi rõ trạng thái: **[CHỐT]** · **[NHÁP]** (đang bàn) · **[HOÃN]** (để sau).
> Lịch sử thay đổi ở cuối file.

---

## 1. Mục tiêu và phạm vi

- Xây một trang web chấm bài **kiểu OJ và DOMjudge** (chỉ gần giống, không làm y hệt), phục vụ cá nhân hoặc tổ chức.
- Source VNOJ (`reference/vnoj-src/`) **chỉ để tham khảo**, không sao chép thiết kế y nguyên. Mỗi thành phần phải tự có lý do để tồn tại.
- **MVP** gồm:
  1. Bài tập và nộp bài: kho bài, đề Markdown/LaTeX, upload test, nộp bài, xem verdict từng test theo thời gian thực.
  2. Kỳ thi **ICPC**: tính penalty, đóng băng bảng (freeze), hỏi đáp (clarification).
  3. Kỳ thi **IOI/OI**: chấm điểm theo subtask, xếp hạng theo điểm.
- Ngoài MVP (làm sau): tổ chức/nhóm/lớp, phân quyền chi tiết, virtual contest, kiểm tra đạo code.

## 2. Các quyết định đã chốt

| # | Quyết định | Lý do | Ngày |
|---|---|---|---|
| D1 | Máy chấm: **VNOJ judge-server** (dmoj). **Source được đưa thẳng vào repo ở `judge-server/`** và sau này có thể sửa (ví dụ tính điểm subtask). Bản gốc: `VNOI-Admin/judge-server` master `2375961` (10/10/2026), bỏ `.github/`, sửa `tar xj` thành `tar xz` trong `.docker/tiervnoj/Dockerfile` | Sandbox và ngôn ngữ đầy đủ. Chỉ cần clone một repo là có đủ để cài. **Đánh đổi:** khi đã sửa, cập nhật theo bản gốc phải merge tay, và phải tự build image judge từ `judge-server/` | 2026-11-16 |
| D2 | Backend **FastAPI** (Python), frontend **React** (SPA, Vite) | Dùng Python giống judge, dễ viết bridge theo giao thức dmoj | 2026-11-16 |
| D3 | **Toàn bộ hệ thống chạy trên một máy** (site và judge chung máy), triển khai bằng Docker Compose | Mục tiêu hiện tại. Thay cho lựa chọn "vài máy" trước đó | 2026-11-16 |
| D4 | Có **nginx** đứng trước | HTTPS, file tĩnh, chia `/api` và `/ws`, giới hạn request và dung lượng gửi lên | 2026-11-16 |
| D5 | Có **wsevent** (WebSocket) để cập nhật thời gian thực, **kèm polling dự phòng** | WebSocket mất tin khi đứt kết nối, có mạng chặn WebSocket, wsevent chết không được làm hỏng cả trang | 2026-11-16 |
| D6 | CSDL **PostgreSQL** cùng **Redis** | Làm mới nên không bị ràng buộc MySQL. Có JSONB và migration hoàn tác được. Redis chỉ làm cache, hàng đợi, pub/sub | 2026-11-16 |
| D7 | **Test data lưu dạng file** trong thư mục `problems/`, không lưu trong CSDL | Judge dmoj chỉ đọc test từ thư mục trên ổ đĩa (xem mục 8) | 2026-11-16 |
| D8 | Có **bridge** giữa site và judge | Judge là client TCP lâu dài nói giao thức dmoj. FastAPI không giữ kết nối lâu dài được. Deploy lại backend không làm đứt judge | 2026-11-16 |
| D9 | Có **Celery** (dùng Redis làm hàng đợi) cùng **Celery beat** | Việc dài như rejudge, giải nén zip test, tính lại bảng xếp hạng, export không được chạy trong request HTTP | 2026-11-16 |
| D10 | Code đặt **ngay trong repo AlgoJudge**: `site/` (toàn bộ Python: API, Celery, bridge, wsevent, trong package `algojudge`), `ui/` (React), `judge-server/` (máy chấm), `deploy/`. `reference/` chỉ để tham khảo, **nằm trong `.gitignore`** | Một repo duy nhất. API, Celery, bridge và wsevent **dùng chung model CSDL và cấu hình**, nên là một project Python chạy bằng nhiều lệnh khác nhau. VNOJ cũng gom như vậy trong repo `site` | 2026-11-16 |
| D11 | Công cụ backend: Python 3.12, FastAPI, SQLAlchemy 2 (async), Alembic, Pydantic v2, quản lý gói bằng `uv` | Bộ công cụ chuẩn cho FastAPI | 2026-11-16 |
| D12 | Đăng nhập bằng **session trong cookie httpOnly**, phiên lưu ở Redis. **Không dùng JWT** | Web và API cùng một tên miền qua nginx. Đăng xuất là hủy phiên ngay. JavaScript không đọc được cookie | 2026-11-16 |
| D13 | Frontend: Vite, React, TypeScript, **Mantine**, React Router, TanStack Query. Đề bài render Markdown kèm KaTeX. Ô soạn code dùng CodeMirror | Mantine có đủ component cho trang quản trị, dark mode có sẵn | 2026-11-16 |
| D14 | Giao diện **tiếng Việt, chuẩn bị sẵn i18n**: mọi chuỗi đi qua thư viện i18n | Sau này thêm tiếng Anh không phải sửa code | 2026-11-16 |
| D15 | wsevent là một service Python nhỏ. Ra ngoài máy chỉ mở cổng của nginx. Bridge 9999 chỉ mở trong mạng nội bộ Docker | Trên máy đã có `bkdnoj_bridged` dùng 9998–9999 và `bkdnoj_nginx` dùng 8888 | 2026-11-16 |
| D16 | **Mọi dữ liệu lúc chạy nằm trong `data/` của repo** dưới dạng file thật, gắn vào container bằng bind mount, **không dùng volume của Docker**: `data/postgres/` (trong `pgdata/`), `data/redis/`, `data/media/`, `data/backups/`, và sau này `problems/`. **Mỗi thư mục thuộc user của service ghi vào nó, không thuộc tài khoản người dùng**: `pgdata/` UID 70, `redis/` UID 999, `media/` UID 10001 (user của ứng dụng: `api`, sau này Celery), `backups/` UID 70. Image PostgreSQL tự giao quyền `pgdata/` khi khởi động. Service một lần `data-init` (alpine, root) tạo và giao quyền `media/`, `backups/`, `redis/` trước khi các service khác chạy (image Redis chỉ đổi chủ, không đổi quyền nhóm, mà nhóm `redis` trong image là GID 1000, thường trùng nhóm của người dùng) | Cài lại, xóa container, volume hay image không làm mất dữ liệu. Dễ thấy, dễ sao lưu. Dữ liệu chỉ mất khi cố ý xóa bằng `sudo`: `rm -rf` hay `git clean -x` nhầm đều bị từ chối. VNOJ cũng gắn `./database/` vào MySQL (`vnoj-docker/dmoj/docker-compose.yml:8`). **Đánh đổi:** (1) `api` không còn chạy bằng UID người dùng, nên không ghi được vào `site/`: lệnh tạo migration phải chạy `exec --user "$(id -u):$(id -g)"`, pytest tắt cache (`-p no:cacheprovider`), ruff tắt cache (`RUFF_NO_CACHE`). (2) Sao lưu không cần sudo phải qua `pg_dump` trong container; chép thẳng thư mục cần sudo. (3) Người trong nhóm `docker` vẫn xóa được qua Docker: đây là chống tai nạn, không phải bảo mật. (4) `PGDATA` là thư mục con `pgdata/` vì initdb cần thư mục rỗng, còn `data/postgres/` giữ `.gitkeep` | 2026-11-17 |
| D17 | **`scripts/init.sh`** chuẩn bị bản cài đặt: tạo thư mục `data/`, tạo file cấu hình chính từ mọi file mẫu `*.example` có trong git (không ghi đè, chỉ nối biến mới vào `.env`), đặt `POSTGRES_PASSWORD` ngẫu nhiên khi CSDL chưa được tạo, rồi chạy `data-init`. `.env` được truyền vào `api` qua `env_file` | Cài mới chỉ cần hai lệnh, chạy lại an toàn. Trước đây `REGISTRATION_OPEN` và `SESSION_COOKIE_SECURE` trong `.env` **không tới được API** (compose chỉ truyền `DATABASE_URL`, `REDIS_URL`, còn API tìm `.env` trong `site/`), nên đặt `REGISTRATION_OPEN=false` cũng không có tác dụng | 2026-11-17 |

## 3. Kiến trúc tổng thể [CHỐT]

Tất cả chạy trên **một máy**, mỗi khối là một container trong Docker Compose.

```
                 Trình duyệt (React SPA)
                    │ HTTPS / WSS
               ┌────▼────┐
               │  nginx  │── file tĩnh React, ảnh/PDF đề
               └─┬─────┬─┘
          /api   │     │  /ws
        ┌────────▼─┐ ┌─▼────────┐
        │ FastAPI  │ │ wsevent  │◄──── Redis pub/sub ◄──┐
        └─┬───┬────┘ └──────────┘                       │
          │   │ đẩy việc / báo bài mới                  │
          │   └────────► Redis ◄──────┐                 │
          │                ▲          │                 │
   ┌──────▼─────┐          │   ┌──────┴───────┐         │
   │ PostgreSQL │◄─────────┼───┤ Celery worker│         │
   └──────▲─────┘          │   │  + beat      │         │
          │                │   └──────────────┘         │
          │          ┌─────┴────┐                       │
          └──────────┤  bridge  ├───────────────────────┘
                     └────▲─────┘
                          │ TCP 9999 (giao thức dmoj, chỉ trong mạng nội bộ Docker)
                     ┌────┴─────┐
                     │ judge ×N │── đọc test ở /problems (gắn chỉ đọc)
                     └──────────┘
   Thư mục problems/ trên máy: backend và Celery đọc/ghi, judge chỉ đọc
```

## 4. Vai trò từng thành phần [CHỐT]

| Thành phần | Làm gì | Nếu thiếu |
|---|---|---|
| nginx | HTTPS, phục vụ build React, chia đường `/api` → FastAPI và `/ws` → wsevent, giới hạn request, giới hạn dung lượng gửi lên | Phải để FastAPI tự lo HTTPS và file tĩnh, khó bảo vệ trước spam |
| FastAPI | REST API: đăng nhập, bài, nộp bài, kỳ thi, bảng xếp hạng. **Mọi kiểm tra quyền nằm ở đây** | — |
| React | Giao diện | — |
| wsevent | Giữ kết nối WebSocket với trình duyệt, nhận tín hiệu qua Redis pub/sub rồi gửi đi | Chỉ còn polling, chậm và tốn tải hơn |
| bridge | Nhận kết nối từ judge, xếp hàng và phân bài theo ưu tiên, nhận kết quả, ghi vào CSDL, báo cho wsevent. Judge đứt giữa chừng thì đưa bài vào hàng lại | Không có gì nói chuyện được với judge |
| judge | Biên dịch và chạy bài trong sandbox, so output, trả kết quả từng test | Không chấm được |
| Celery | Việc nền và việc định kỳ | Việc dài làm timeout request |
| PostgreSQL | **Nơi lưu dữ liệu gốc** | — |
| Redis | Cache (bảng xếp hạng…), hàng đợi Celery, pub/sub, giới hạn request | Mất cache và hàng đợi. **Không lưu dữ liệu gốc ở đây** |
| `problems/` | Test, `init.yml` cho judge, checker | — |

## 5. Nguyên tắc thiết kế [CHỐT]

1. **PostgreSQL là nơi lưu dữ liệu gốc.** Redis chỉ chứa thứ có thể tính lại được.
2. **Bài nộp được ghi vào CSDL trước** với trạng thái `QUEUED`, rồi mới báo cho bridge qua Redis. Lúc bridge chết hay khởi động lại cũng không mất bài: khi khởi động, bridge tự quét các bài `QUEUED` chưa được chấm.
3. **Tin WebSocket chỉ là tín hiệu, không chứa kết quả**, ví dụ `{"type":"submission","id":123}`. Client nhận được thì gọi API để lấy dữ liệu, và API kiểm tra quyền. Nhờ vậy **không lộ kết quả khi bảng ICPC đang đóng băng**.
4. **Polling chỉ là dự phòng:** dùng khi WebSocket không nối được, và gọi API một lần mỗi khi nối lại. Bảng xếp hạng được tính sẵn lưu trong Redis, và client chờ thêm một khoảng ngẫu nhiên trước khi gọi để tránh dồn tải.
5. **Hạn chế sửa judge.** Việc nào làm được ở site hoặc bridge thì làm ở đó. Mỗi chỗ sửa trong `judge-server/` phải ghi lại ở mục 8 hoặc trong commit, để sau này merge bản gốc dễ hơn.

## 6. Mô hình dữ liệu [NHÁP — đang thảo luận, trừ các bảng đã ghi CHỐT]

Quy ước: mọi bảng có `id BIGSERIAL` trừ khi ghi khác. Thời gian lưu dạng `TIMESTAMPTZ`.

### 6.1 Người dùng và ngôn ngữ

**users** [CHỐT — đã làm ở M1, migration `e07c3d8dfc1d`, `4118966da114`]
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | bigint identity | |
| username | varchar(32) | `^[A-Za-z0-9_]{3,32}$`. **Unique không phân biệt hoa thường** (index trên `lower(username)`), nhưng giữ nguyên cách viết lúc đăng ký để hiển thị |
| email | varchar(254) | Unique không phân biệt hoa thường |
| password_hash | varchar(255) | Argon2id (argon2-cffi). Tự băm lại khi đăng nhập nếu tham số băm thay đổi |
| display_name | varchar(64) | Mặc định bằng username |
| role | varchar(16) + CHECK `superadmin` / `admin` / `setter` / `user` | Không dùng enum native của PostgreSQL, để thêm vai trò chỉ cần một migration đơn giản (`superadmin` đã được thêm theo cách này) |
| is_active | bool | `false` = bị khóa: không đăng nhập được, mọi phiên đang mở bị hủy |
| created_at | timestamptz | |
| last_login_at | timestamptz, nullable | |

**languages**: xem mục 6.2 (đã làm, migration `561a33c4465f`).

### 6.2 Bài tập và test

#### Tiêu chuẩn một bài tập [CHỐT — yêu cầu của người dùng, 2026-11-17]

> **Mọi bài tập phải có tối thiểu các thành phần sau.** Các việc sau này (test, chấm, kỳ thi, giao diện) đều phải tôn trọng danh sách này. Đây là mức "tiêu chuẩn", không làm sơ sài.

| Thành phần | Cột / bảng | Ý nghĩa |
|---|---|---|
| Problem code | `problems.code` | Mã bài, không đổi được sau khi tạo |
| Problem name | `problems.title` | Tên bài |
| Date of publishing | `problems.published_at` | Ngày công bố. Tự điền khi công khai mà chưa có. Dùng để sắp xếp "mới nhất" |
| Creators | `problem_members` role `creator` | Sửa được bài, **được ghi tên tác giả**. Phải là setter trở lên |
| Curators | `problem_members` role `curator` | Sửa được bài, **không** được ghi tên. Phải là setter trở lên |
| Testers | `problem_members` role `tester` | Xem được bài khi còn riêng tư, **không** sửa được. Ai cũng được |
| Submission source visibility | `problems.source_visibility` | `default` (theo cài đặt chung `DEFAULT_SOURCE_VISIBILITY`, mặc định `solved`) / `always` / `solved` / `only_own`. **Áp dụng từ M4** |
| Testcase visibility | `problems.testcase_visibility` | `staff_only` (mặc định) / `outside_contest` / `always`. **Áp dụng từ M3–M4** |
| Testcase result visibility | `problems.testcase_result_visibility` | `all` (mặc định) / `groups_only` / `submission_only`. **Áp dụng từ M4** |
| Problem types | `problem_types` + `problem_type_links` | Dạng bài, nhiều–nhiều (ví dụ Quy hoạch động, Đồ thị). Admin quản lý ở `/admin/catalog` |
| Problem group | `problem_groups` + `problems.group_id` | Nhóm bài, tối đa một (ví dụ VOI, Luyện tập cơ bản) |
| Points | `problems.points` | 0,01–1000, mặc định 100 |
| Scoring mode | `problems.scoring_mode` | `icpc` (dừng ở test sai đầu tiên, đúng hết hoặc 0 điểm, **mặc định**) / `partial` (điểm từng phần). Tương ứng loại 1 và loại 2 ở mục "Cách tính điểm" bên dưới |
| Time limit, Memory limit | `time_limit_ms`, `memory_limit_kb` | 0,1–20 giây, 16 MB–2 GB |
| Allowed languages | `languages` + `problem_languages` | Ít nhất một. Bài mới nhận mọi ngôn ngữ đang bật |
| Solution | `problem_solutions` | Lời giải (editorial) dạng Markdown. Thí sinh thấy khi `is_public` và đã qua `publish_at` |

Ý nghĩa của creator, curator, tester và ba chế độ hiển thị lấy theo VNOJ (`judge/models/problem.py`: `authors`/`curators`/`testers`, `SubmissionSourceAccess`, `ProblemTestcaseAccess`, `ProblemTestcaseResultAccess`), nhưng đặt lại tên giá trị cho dễ đọc.

**problems** [CHỐT — migration `faaf0ac385e1`, `561a33c4465f`]
| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | bigint identity | |
| code | varchar(32), unique, CHECK `^[a-z0-9_]{2,32}$` | Đồng thời là tên thư mục `problems/<code>/` |
| title | varchar(200) | |
| statement_md | text | Tối đa 100.000 ký tự |
| time_limit_ms | int, CHECK 100–20.000 | |
| memory_limit_kb | int, CHECK 16 MB–2 GB | |
| points | float, CHECK 0,01–1000 | |
| scoring_mode | varchar + CHECK | xem trên |
| visibility | varchar + CHECK `public` / `private` | Chỉ admin đổi |
| published_at | timestamptz, có index | |
| group_id | → problem_groups, `SET NULL` | |
| source_visibility, testcase_visibility, testcase_result_visibility | varchar + CHECK | xem trên |
| created_by_id | → users, `SET NULL` | |
| created_at, updated_at | timestamptz | |

**problem_members**: (problem_id, user_id) là PK, cột `role` ∈ `creator` / `curator` / `tester`. **Mỗi người chỉ giữ một vai trò trong một bài.** Bảng này thay cho `problem_authors` (tác giả cũ chuyển thành `creator`).

**languages**: `key` là PK (tên executor của dmoj: `CPP17`, `PY3`…), `name`, `ext`, `is_enabled`, `sort_order`. Migration nạp sẵn 29 ngôn ngữ có trong image `vnoj/judge-tiervnoj` (kiểm tra bằng `/api/info` ngày 2026-11-17), bật sẵn 14 ngôn ngữ phổ biến. Admin đổi tên, bật/tắt, sắp xếp ở `/admin/catalog`.

**problem_types**, **problem_groups**: `id`, `slug` (unique, `^[a-z0-9_-]{1,32}$`, dùng trong đường dẫn lọc `?type=dp`), `name`. Xóa một mục thì các bài chỉ bị gỡ khỏi mục đó.

**problem_solutions**: `problem_id` là PK, `content_md`, `is_public`, `publish_at` (nullable), `updated_at`.

`data_version` và các cột cấu hình chấm sẽ thêm ở M3, cùng bảng `problem_data`.

#### Cấu hình test là gì? [CHỐT]

Ngoài các file `.in`/`.out`, judge cần biết **cách chấm** chúng: có những test nào, test nào ghép với `.out` nào, mỗi test hay mỗi subtask bao nhiêu điểm, dùng checker gì, đọc/ghi qua stdin hay file, bài thường hay tương tác. Judge dmoj đọc tất cả những điều này từ file `problems/<code>/init.yml`.

**Time limit và memory limit không nằm trong `init.yml`.** Site gửi chúng kèm theo từng bài nộp. Ví dụ `judge-web/server.py` gọi `Submission(..., tl, ml, ...)`.

**Cách làm (học từ VNOJ):** **CSDL là nơi lưu cấu hình gốc.** Admin chỉnh trên giao diện, backend kiểm tra rồi **tự sinh `init.yml`**. Không ai sửa `init.yml` bằng tay.
1. Admin upload file zip test. Celery kiểm tra file zip và lưu vào `problems/<code>/`. Judge đọc được thẳng từ zip qua khóa `archive`, không cần giải nén.
2. Admin khai báo danh sách test, subtask, điểm, checker trên giao diện. Những thông tin này lưu vào CSDL.
3. Backend kiểm tra: file có tồn tại không, tổng điểm có lớn hơn 0 không, `dependencies` chỉ được trỏ tới subtask đứng trước… Nếu **lỗi** thì ghi thông báo vào `problem_data.feedback` và **xóa `init.yml`**, để judge không chấm theo cấu hình sai. Nếu **đúng** thì ghi `init.yml` và đổi `data_version`.

Ví dụ `init.yml` được sinh ra cho một bài có 2 subtask:
```yaml
archive: tests.zip
checker: standard
test_cases:
- points: 30            # subtask 1
  batched:
  - {in: 1.in, out: 1.out}
  - {in: 2.in, out: 2.out}
- points: 70            # subtask 2, chỉ chấm khi subtask 1 đã qua
  dependencies: [1]
  batched:
  - {in: 3.in, out: 3.out}
```

#### Cách tính điểm và nhóm test [NHÁP — người dùng đề xuất, chốt khi thiết kế trang "sửa testcase"]

Chỉ có **một khái niệm: nhóm test có hệ số**. Mỗi test upload lên có hệ số mặc định là 1, tức là một nhóm 1 test. Admin chọn nhiều test để gộp thành một nhóm và đặt điểm cho nhóm.

- **Loại 1 (ICPC):** test đầu tiên không AC thì mọi test còn lại là SC. Làm bằng cờ `short-circuit` mà site gửi kèm bài nộp. Judge đã hỗ trợ sẵn: `dmoj/judge.py:69,501`, VNOJ đặt `short_circuit = not partial`.
- **Loại 2 (nhóm, tính theo tỉ lệ):** điểm nhóm = (số test AC / số test trong nhóm) × điểm nhóm. Tỉ lệ cuối cùng = tổng điểm đạt / tổng hệ số. Ví dụ: 20 test, nhóm gồm test 6–15 được 15 điểm, test 3, 19, 15 WA → (8 + 9/10 × 15) / (10 + 15) = 21,5 / 25.
- **Loại 3:** _chưa xác định._

**[CHỐT] Không dùng `batched` của dmoj.** "Subtask" là khái niệm riêng của site. Batch của judge để nguyên, không dùng tới.
**[CHỐT] Thứ tự làm:** thiết kế và làm trang **"sửa testcase"** trước, sau đó mới làm phần chạy chấm và tính điểm.

**Ràng buộc kỹ thuật (đã kiểm tra source):** nhóm tính theo tỉ lệ **không được** dùng `batched` của dmoj, vì trong batch, test sai sẽ làm các test sau bị SC. Vì vậy nhóm chỉ tồn tại ở phía site. `init.yml` ghi phẳng mọi test, mỗi test `points: 1` (phải > 0, vì sai một test 0 điểm sẽ bỏ qua mọi test sau). Bridge tự tính điểm theo nhóm.

**Câu hỏi đang chờ:**
1. Loại 3 là gì?
2. Có thêm kiểu nhóm "tất cả hoặc không" (subtask kiểu IOI, dùng được `batched`) không?
3. Checker cho điểm lẻ thì tính theo tỉ lệ điểm thay vì đếm số test AC?
4. Có cho sửa hệ số của test lẻ không? Test chỉ thuộc tối đa một nhóm, chọn test bất kỳ?
5. Trong kỳ thi ICPC, mọi bài tự động chấm theo loại 1?

> Các bảng `problem_subtasks` và `problem_testcases` bên dưới **sẽ được thiết kế lại** theo mô hình nhóm có hệ số.

**problem_data**: cấu hình chấm của bài, quan hệ 1–1 với `problems`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| problem_id | PK → problems | |
| archive | text, nullable | Tên file zip test trong `problems/<code>/` |
| checker | enum `standard` / `floats` / `floatsabs` / `floatsrel` / `identical` / `linecount` / `custom` | Danh sách lấy theo VNOJ |
| checker_args | jsonb | Ví dụ độ chính xác của `floats`. Checker `custom` thì lưu tên file và loại (`testlib`, `themis`…) |
| grader | enum `standard` / `interactive` / `signature` / `output_only` | |
| grader_args | jsonb | Ví dụ đọc/ghi file: `{io_input_file, io_output_file}` |
| output_limit_length, output_prefix_length | int, nullable | |
| hints | text[] | `unicode`, `nobigmath` |
| feedback | text | Lỗi lần sinh `init.yml` gần nhất. Rỗng nghĩa là cấu hình hợp lệ |
| data_version | text | Hash, đổi mỗi khi `init.yml` hoặc test thay đổi |

**problem_subtasks**: bài không chia subtask thì không có dòng nào, mỗi test tự mang điểm.
| Cột | Kiểu | Ghi chú |
|---|---|---|
| problem_id | → problems | |
| idx | int | 1, 2, 3… |
| points | numeric | |
| dependencies | int[] | Các subtask phải qua hết trước khi chấm subtask này (`dependencies` của dmoj) |

**problem_testcases**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| problem_id | → problems | |
| order | int | |
| subtask_id | → problem_subtasks, nullable | |
| input_file, output_file | text | Tên file trong zip hoặc trong thư mục bài |
| points | numeric, nullable | Bắt buộc khi test không thuộc subtask nào, để trống khi có subtask |
| checker, checker_args | nullable | Ghi đè checker riêng cho test này (ít dùng) |

**Để sau [HOÃN]:** sinh test bằng generator, pretest kiểu Codeforces, upload thẳng file Polygon.

> Subtask tương ứng với `batched` của dmoj (đã kiểm tra source, xem mục 8):
> - **Judge:** trong một batch, khi một test sai, các test còn lại được trả về `SC` (bỏ qua, không chạy). Batch có thể khai báo `dependencies`, tức là chỉ chấm khi các batch trước đó đã qua hết.
> - **Judge không tự tính điểm cho batch.** Nó chỉ gửi điểm của từng test. **Bridge của mình phải tự tính:** điểm subtask = **min** điểm các test trong batch. Như vậy sai một test là mất điểm cả subtask, đúng kiểu IOI.
> - Cần biết thêm: nếu sai một test **0 điểm** (thường là test ví dụ), judge sẽ bỏ qua **toàn bộ** các test sau đó.
>
> Vì vậy `problem_subtasks` có cột `dependencies`, và `submission_testcases.result` có thêm giá trị `SC`.

### 6.3 Bài nộp

**submissions**: bảng lớn, giữ các dòng gọn
| Cột | Kiểu | Ghi chú |
|---|---|---|
| user_id | → users | |
| problem_id | → problems | |
| contest_id | → contests, nullable | Nộp trong kỳ thi |
| participant_id | → contest_participants, nullable | |
| language_key | → languages | |
| status | enum `QUEUED` / `COMPILING` / `GRADING` / `DONE` / `ABORTED` | Đang ở bước nào |
| result | enum `AC` / `WA` / `TLE` / `MLE` / `OLE` / `RTE` / `IR` / `CE` / `IE`, nullable | Kết quả cuối |
| points, total_points | numeric | |
| max_time_ms, max_memory_kb | int | |
| compile_log | text | |
| created_at, judged_at | timestamptz | |

**submission_sources**: tách mã nguồn ra bảng riêng (quan hệ 1–1) để truy vấn danh sách bài nộp nhẹ hơn
| Cột | Kiểu |
|---|---|
| submission_id | PK → submissions |
| source | text |

**submission_testcases**: kết quả từng test
| Cột | Kiểu | Ghi chú |
|---|---|---|
| submission_id | → submissions | |
| position | int | |
| subtask_idx | int, nullable | |
| result | enum (như trên) + `SC` | `SC` = bị bỏ qua vì một test trước đó trong cùng subtask đã sai |
| time_ms, memory_kb | int | |
| points, total_points | numeric | |
| feedback | text | Thông điệp từ checker |

### 6.4 Kỳ thi

**contests**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| key | text, unique | |
| name, description | text | |
| format | enum `icpc` / `ioi` | |
| start_time, end_time | timestamptz | |
| freeze_time | timestamptz, nullable | Chỉ ICPC. Bài nộp sau thời điểm này hiển thị là "đang chờ" |
| unfrozen_at | timestamptz, nullable | Lúc admin mở băng bảng |
| penalty_minutes | int, mặc định 20 | ICPC |
| ce_counts_penalty | bool, mặc định false | ICPC: lỗi biên dịch có bị tính penalty không |
| ioi_scoring | enum `max_submission` / `max_subtask` | IOI: lấy điểm của bài nộp tốt nhất, hay lấy điểm cao nhất của từng subtask qua mọi bài nộp |
| visibility | enum `public` / `private` | |
| registration | enum `open` / `invite` | |
| created_by | → users | |

**contest_problems**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| contest_id, problem_id | | unique theo cặp |
| label | text | `A`, `B`, … |
| order | int | |
| color | text, nullable | Màu bóng bay (kiểu ICPC) |

**contest_participants**: một **đơn vị dự thi**. Đây là một dòng trên bảng xếp hạng: một người hoặc một đội. [CHỐT]

Hệ thống hỗ trợ cả ba cách, **admin của kỳ thi tự chọn**:
- **Thi cá nhân:** mỗi đơn vị có 1 thành viên.
- **Đội dùng chung một tài khoản** (kiểu DOMjudge): đơn vị có 1 thành viên, và đó là tài khoản của đội.
- **Đội gồm nhiều tài khoản cá nhân:** đơn vị có nhiều thành viên. Ai trong đội nộp cũng được tính cho đội.

| Cột | Kiểu | Ghi chú |
|---|---|---|
| contest_id | → contests | |
| name | text | Tên đội. Thi cá nhân thì để trống và hiển thị tên user |
| role | enum `contestant` / `observer` | |
| registered_at | timestamptz | |

**contest_participant_members**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| participant_id | → contest_participants | |
| contest_id | → contests | Lặp lại cột này để đặt ràng buộc unique |
| user_id | → users | **unique (contest_id, user_id)**: mỗi user chỉ thuộc một đơn vị trong mỗi kỳ thi |

> `submissions` lưu cả `user_id` (ai bấm nộp) và `participant_id` (tính điểm cho ai).

**contest_scores**: kết quả gộp theo từng (thí sinh, bài) để tính bảng xếp hạng nhanh. Cập nhật mỗi khi chấm xong một bài. Celery tính lại toàn bộ khi rejudge.
| Cột | Kiểu | Ghi chú |
|---|---|---|
| participant_id, contest_problem_id | | unique theo cặp |
| attempts | int | ICPC: số lần nộp sai trước lần AC đầu tiên |
| first_ac_at | timestamptz, nullable | ICPC |
| pending_frozen | int | ICPC: số bài nộp sau thời điểm đóng băng |
| best_points | numeric | IOI |
| subtask_best | jsonb | IOI `max_subtask`: điểm cao nhất của từng subtask |
| last_improved_at | timestamptz | Dùng để phân thứ hạng khi bằng nhau |

**clarifications**: hỏi đáp và thông báo trong kỳ thi
| Cột | Kiểu | Ghi chú |
|---|---|---|
| contest_id | → contests | |
| problem_id | → problems, nullable | Câu hỏi chung thì để trống |
| asker_id | → contest_participants, nullable | Để trống nghĩa là thông báo của ban tổ chức |
| question, answer | text | |
| is_public | bool | Câu trả lời gửi cho mọi người hay chỉ người hỏi |
| answered_by | → users, nullable | |
| created_at, answered_at | timestamptz | |

### 6.5 Luật xếp hạng [NHÁP]

- **ICPC:** xếp theo số bài giải được giảm dần, rồi tổng penalty tăng dần, rồi thời điểm AC cuối cùng sớm hơn.
  - Penalty của một bài = số phút từ lúc bắt đầu đến lần AC đầu tiên + `penalty_minutes` × số lần nộp sai trước đó.
  - Khi bảng đang đóng băng: thí sinh và khách chỉ thấy kết quả trước `freeze_time`, còn các bài nộp sau đó hiển thị số lần thử dưới dạng "đang chờ". Admin thấy đầy đủ.
- **IOI:** xếp theo tổng điểm giảm dần. Điểm mỗi bài tính theo `ioi_scoring`.

## 6.6 Lộ trình (milestone) [CHỐT]

| # | Nội dung | Trạng thái |
|---|---|---|
| M0 | Khung dự án: Docker Compose (postgres, redis, nginx), FastAPI `/api/health`, React trang trống, i18n. Dọn git: `.gitignore`, xử lý các gitlink | ✅ xong (2026-11-16) |
| M1 | Tài khoản: đăng ký, đăng nhập (session), phân quyền admin/setter/user, giao diện và trang chủ | ✅ xong (2026-11-16), xem 6.7 |
| M2 | Bài tập: tạo, sửa, hiển thị đề (Markdown + KaTeX) | ✅ xong (2026-11-17), xem 6.8 |
| M3 | Trang **"sửa testcase"**: upload zip (Celery), gom nhóm, đặt hệ số, chọn checker, sinh `init.yml` | ⏳ tiếp theo |
| M4 | Bridge, judge, nộp bài, chấm, tính điểm. **Đọc kỹ phiên bản giao thức judge (`get_judge_version`) trước khi viết bridge** | |
| M5 | wsevent: cập nhật thời gian thực, kèm polling dự phòng | |
| M6 | Kỳ thi ICPC: penalty, đóng băng bảng, hỏi đáp | |
| M7 | Kỳ thi IOI | |

## 6.7 Tài khoản và giao diện (M1) [CHỐT]

**Đăng ký và đăng nhập**
- Đăng ký **mở mặc định**, tắt bằng `REGISTRATION_OPEN=false`. Khi tắt, chỉ admin tạo tài khoản bằng CLI. **Chưa xác thực email** (để sau).
- Đăng nhập bằng **tên đăng nhập hoặc email**, không phân biệt hoa thường. Mật khẩu dài 8–128 ký tự.
- **Chống dò mật khẩu:** sai 10 lần trong 15 phút với cùng một cặp (IP, tên đăng nhập) thì trả 429. IP lấy từ header `X-Real-IP` do nginx đặt. Khi tên đăng nhập không tồn tại, vẫn chạy kiểm tra trên một hash giả để thời gian phản hồi không để lộ tài khoản nào có thật.
- **Superadmin đầu tiên** được tạo từ terminal: `./scripts/create-superadmin.sh`. Script hỏi lần lượt tên đăng nhập, email, tên hiển thị và mật khẩu, hoặc nhận tham số dòng lệnh. Bên trong, script gọi `python -m algojudge.cli create-superadmin`. Ngoài ra có `create-user --role ...` và `set-role`.

**Session** (D12)
- Cookie `aj_session`: httpOnly, SameSite=Lax, `Secure` khi bật `SESSION_COOKIE_SECURE`. Cookie chỉ chứa một token ngẫu nhiên.
- Redis lưu `session:<sha256(token)>` → user id. Vì Redis chỉ giữ hash, một bản dump của Redis không chứa token dùng được. Mỗi user có thêm tập `user_sessions:<id>` để đăng xuất khỏi mọi nơi.
- **"Ghi nhớ đăng nhập":** có tích thì cookie và phiên sống 30 ngày. Không tích thì cookie mất khi đóng trình duyệt, phiên phía server hết hạn sau 1 ngày.
- **Vai trò được đọc lại từ CSDL ở mỗi request**, nên đổi vai trò có hiệu lực ngay. Khóa tài khoản thì mọi phiên của người đó bị hủy.
- **CSRF:** nhờ SameSite=Lax và việc API chỉ nhận body JSON, form của trang khác không gửi được request thay người dùng.

**Phân quyền** (thứ bậc từ cao xuống thấp)

| Vai trò | Làm được gì |
|---|---|
| `superadmin` | Mọi việc của admin, **cộng thêm quản lý admin** (cấp hoặc thu quyền admin, khóa admin). **Chỉ tạo hoặc cấp được từ terminal** |
| `admin` | Quản lý trang, và quản lý người dùng **có vai trò thấp hơn admin** (setter, user) ở `/admin/users` |
| `setter` | Ra đề (từ M2) |
| `user` | Thí sinh |

- **Quy tắc trên web:** mỗi người chỉ sửa được tài khoản **có vai trò thấp hơn mình**, và chỉ cấp được vai trò **thấp hơn mình**. Không ai tự sửa được tài khoản của chính mình. Vì vậy **không có cách nào cấp hoặc thu quyền superadmin qua web**: dù một tài khoản admin bị lộ, người đó cũng không tự nâng lên superadmin hay khóa superadmin được.
- **Terminal là nơi có quyền cao nhất** (người có quyền vào máy chủ). `set-role` không cho hạ quyền superadmin **cuối cùng** đang hoạt động, trừ khi thêm `--force`.
- Ở API, quyền được kiểm tra bằng `require_role(...)`, và admin cùng superadmin luôn qua. Mã lỗi: `insufficient_rank` (sửa người có vai trò ngang hoặc cao hơn mình), `role_not_assignable` (cấp vai trò ngang hoặc cao hơn mình), `cannot_modify_self`.

**Lỗi API** trả về mã máy đọc được, ví dụ `{"detail": {"code": "username_taken", "field": "username"}}`. Giao diện dịch mã qua i18n (`errors.<code>`), nên API không bao giờ trả câu chữ cho người dùng.

**API**

| Endpoint | Ai gọi được |
|---|---|
| `GET /api/auth/me`, `GET /api/auth/registration` | Mọi người |
| `POST /api/auth/register`, `/login`, `/logout` | Mọi người |
| `GET /api/users/by-username/{u}` | Mọi người. Trang cá nhân, không có email |
| `GET /api/users?q=&role=&page=` | Admin, superadmin |
| `PATCH /api/users/{id}` (`role`, `is_active`) | Admin, superadmin, theo quy tắc thứ bậc ở trên |

**Giao diện**
- Mantine, màu chủ đạo indigo, có chế độ sáng/tối (theo máy và chuyển tay được).
- **Font Inter đóng gói sẵn** (`@fontsource-variable/inter`, có bộ ký tự tiếng Việt). Nếu dựa vào font hệ thống, dấu tiếng Việt có thể bị vẽ bằng font khác và trông lệch.
- Header gồm logo, menu (Trang chủ, Bài tập, Kỳ thi, Bài nộp), nút sáng/tối, và nút đăng nhập/đăng ký hoặc menu tài khoản. Trên điện thoại, menu chuyển thành ngăn kéo bên trái. Footer có link tới `/status`.
- Các trang: `/` (trang chủ), `/login`, `/register`, `/users/:username`, `/admin/users`, `/status`, 404. `/problems`, `/contests`, `/submissions` tạm hiện "Đang xây dựng".
- Sau khi đăng nhập, chuyển về trang trong `?next=`, nhưng chỉ chấp nhận đường dẫn nội bộ để tránh open redirect.

**Để sau [HOÃN]:** xác thực email, quên mật khẩu, tự đổi mật khẩu và sửa hồ sơ, ảnh đại diện, nút "đăng xuất mọi thiết bị" trên giao diện, tách nhỏ bundle JS (hiện khoảng 600 KB chưa nén).

## 6.8 Bài tập (M2) [CHỐT]

**Quyền** (cập nhật 2026-11-17, có creator/curator/tester)

| Việc | Ai làm được |
|---|---|
| Xem bài `public` | Mọi người, kể cả khách chưa đăng nhập |
| Xem bài `private` | Creator, curator, tester của bài, admin, superadmin. Người khác nhận **404** |
| Tạo bài | Setter trở lên. Bài mới luôn ở chế độ `private`, người tạo là creator |
| Sửa bài (mọi trường trừ chế độ hiển thị), người phụ trách, lời giải, ảnh | Creator/curator (phải là setter trở lên), admin |
| Công khai hoặc ẩn bài, xóa bài | **Chỉ admin và superadmin** |
| Xem lời giải | Người sửa được bài luôn thấy. Người khác thấy khi lời giải `is_public` và đã qua `publish_at` |

- Người không phải admin **không tự bỏ được quyền sửa của mình** (`cannot_remove_self`). Bài luôn phải có ít nhất một creator.

**Đề bài**
- Markdown theo chuẩn GitHub kèm LaTeX: `$...$` cho công thức trong dòng, `$$...$$` cho công thức khối. Một dòng chỉ chứa `$$...$$` cũng được tự chuyển thành công thức khối.
- **Ví dụ mẫu viết thẳng trong Markdown**, đặt trong khối ```. Mọi khối code đều có nút copy.
- **Không render HTML thô** trong đề: `<script>` hiện ra dưới dạng chữ (chống XSS).

**Ảnh trong đề**
- Upload qua nút "Chèn ảnh", dán từ clipboard, hoặc kéo-thả vào ô soạn. Tối đa 5 MB.
- Chỉ nhận PNG, JPEG, GIF, WebP, **nhận diện qua các byte đầu của file** chứ không qua tên file. SVG bị từ chối vì có thể chứa script.
- Lưu ở `data/media/problems/<code>/<sha256>.<ext>`. Tên file là hash của nội dung, nên upload lại cùng một ảnh không tạo file mới, và URL khó đoán. Không có bảng CSDL riêng cho ảnh.
- nginx phục vụ `/media/` ở chế độ chỉ đọc, kèm `X-Content-Type-Options: nosniff` và CSP `default-src 'none'`. Không liệt kê được thư mục.
- **Lưu ý:** ảnh của bài `private` vẫn xem được nếu biết URL. URL khó đoán (hash 128 bit), nhưng không được kiểm tra quyền.

**API**

| Endpoint | Ghi chú |
|---|---|
| `GET /api/problems?q=&mine=&group=&type=&sort=code\|newest\|points&page=&page_size=` | Chỉ trả bài người xem được xem. `mine`: bài mình giữ vai trò bất kỳ |
| `POST /api/problems` | Setter trở lên |
| `GET /api/problems/{code}` | Trang đề: có `creators`, `allowed_languages`, `has_solution`, `can_edit`… **Không** có danh sách curator/tester và các chế độ hiển thị |
| `GET /api/problems/{code}/settings` | Chỉ người sửa được bài. Có đủ mọi trường |
| `PATCH /api/problems/{code}` | Mọi trường. `group_id: null` để gỡ nhóm. `visibility` chỉ admin đổi |
| `PUT /api/problems/{code}/members` | `{creators, curators, testers}` (tên đăng nhập) |
| `GET`, `PUT`, `DELETE /api/problems/{code}/solution` | Lời giải |
| `DELETE /api/problems/{code}` | Admin |
| `POST /api/problems/{code}/images` | multipart, trả về `{url}` (dùng chung cho đề và lời giải) |
| `GET /api/languages[?include_disabled=true]`, `PATCH /api/languages/{key}` | Đọc: mọi người. Sửa: admin |
| `GET`, `POST /api/problem-types`, `PATCH`, `DELETE /api/problem-types/{id}` | Tương tự cho `/api/problem-groups` |

**Đề bài: cú pháp**
- Công thức: `$...$` hoặc **`~...~` (cách viết của VNOJ/DMOJ)** cho công thức trong dòng; `$$...$$` cho công thức khối (một dòng `$$...$$` cũng được). `~~gạch~~` vẫn là gạch ngang.
- **HTML an toàn**: theo bộ lọc của GitHub (`rehype-sanitize`): `<sup>`, `<sub>`, `<details>`, `<kbd>`, bảng, ảnh…; chặn `<script>`, `on*=`, `javascript:`. Thứ tự plugin: remark-math → rehype-raw → rehype-sanitize → rehype-katex (đã kiểm tra thực tế).

**Trình soạn Markdown** (`ui/src/components/editor/`), dùng cho đề bài và lời giải
- CodeMirror 6: tô màu cú pháp Markdown, tự xuống dòng, hoàn tác, tìm kiếm (Ctrl+F), giao diện sáng/tối.
- Thanh công cụ: đậm, nghiêng, gạch ngang, tiêu đề (H2–H4), chỉ số trên/dưới, công thức trong dòng/khối, code trong dòng/khối, trích dẫn, danh sách, danh sách đánh số, kẻ ngang, liên kết, tải ảnh, bảng, khối ví dụ Input/Output, **mẫu đề bài** (khung Đề bài / Dữ liệu vào / Kết quả / Giới hạn / Ví dụ / Giải thích).
- Phím tắt: Ctrl+B, Ctrl+I, Ctrl+K (liên kết), Ctrl+E (code), Ctrl+M (công thức).
- Ba chế độ: Soạn / **Song song** (mặc định trên màn hình rộng) / Xem trước. Có toàn màn hình (Esc để thoát), hộp hướng dẫn cú pháp, đếm ký tự.
- Ảnh: nút tải lên, dán, kéo-thả, chèn đúng vị trí con trỏ hoặc chỗ thả.

**Giao diện**
- `/problems`: tìm kiếm, lọc theo nhóm và dạng bài (nằm trên URL, nên chia sẻ link được), sắp xếp theo mã hoặc điểm, cột Nhóm/Điểm, badge dạng bài, "Bài của tôi".
- `/problems/:code`: đề bài bên trái, **bảng thông tin** bên phải (điểm, chế độ chấm, giới hạn, người tạo, nhóm, dạng, ngày công bố, ngôn ngữ). Có tab "Lời giải" khi người xem được xem.
- `/problems/:code/edit`: 5 tab **Đề bài · Thông tin chung · Chấm bài · Quyền & hiển thị · Lời giải** (tab nằm trên URL `?tab=`). Một nút Lưu cho 4 tab đầu. Lỗi kiểm tra thì tự nhảy tới tab có lỗi. Lời giải có nút lưu riêng. Ở M3 sẽ thêm tab **Test**.
- `/admin/catalog`: quản lý Dạng bài, Nhóm bài, Ngôn ngữ.
- Trang chủ hiện 6 bài công khai mới nhất.
- Các trang bài tập được tải khi cần (lazy).

**Để sau [HOÃN]:** bản dịch đề (nhiều ngôn ngữ), đề dạng PDF, nguồn bài (source), giấy phép, danh sách người bị cấm nộp, tác giả riêng cho lời giải, gợi ý @mention trong trình soạn, đồng bộ cuộn giữa ô soạn và xem trước, ảnh riêng tư có kiểm tra quyền.

## 7. Hoãn lại [HOÃN]

- Dành riêng nhân CPU cho judge và giới hạn RAM các container. Dễ cài khi cần: thêm `cpuset` và `mem_limit` trong Docker Compose. Lưu ý phải giới hạn cả phía site, và `mem_limit` của judge phải lớn hơn giới hạn bộ nhớ lớn nhất của bài cộng phần dư.
- Chạy nhiều máy: đồng bộ test bằng NFS, rsync hoặc MinIO; chia tải nhiều backend.
- Tổ chức, nhóm, lớp học. Virtual contest. Kiểm tra đạo code.

## 8. Thông tin đã kiểm tra từ source

| Nội dung | Căn cứ |
|---|---|
| Judge dmoj tìm bài theo `problem_storage_globs` và đọc test bằng `open()` trên thư mục cục bộ (hoặc file zip trong thư mục đó) | `VNOI-Admin/judge-server` master `2375961` (10/10/2026): `dmoj/judgeenv.py:288`, `dmoj/problem.py:282-292` |
| Nhánh master của judge **không có code S3**. Code S3 chỉ có ở nhánh chưa merge `feat/microvm-api-judge` (`dmoj/utils/s3_storage.py`) | Tìm `s3`, `boto`, `minio` trong `dmoj/`. Phần thư viện phụ thuộc không có boto3 |
| Batch: sai một test trong batch thì các test còn lại trả về `SC`. Có `dependencies` giữa các batch. Sai một test 0 điểm thì bỏ qua mọi test sau đó. **Judge chỉ gửi điểm từng test**, còn phép tính min theo batch do site/bridge làm | judge-server `dmoj/judge.py:488-563`, `dmoj/problem.py:343-355`; OJ `judge/bridge/judge_handler.py:391-412` |
| VNOJ lưu cấu hình test trong CSDL (`ProblemData`, `ProblemTestCase` với loại C/S/E) và tự sinh `init.yml`. Cấu hình lỗi thì ghi vào `feedback` và xóa `init.yml`. TL/ML không nằm trong `init.yml` | OJ `judge/models/problem_data.py:20-157`, `judge/utils/problem_data.py:38-328` |
| Client WebSocket của VNOJ tự chuyển sang long-poll khi không dùng được WebSocket | `VNOI-Admin/OJ` master `209a32e`: `resources/event.js`, `EVENT_DAEMON_POLL` trong `dmoj/settings.py:740` |

## 9. Câu hỏi đang mở

_(Chưa có.)_

Đã giải quyết:
- ~~Đội ICPC dùng tài khoản chung hay riêng?~~ → Hỗ trợ cả hai, admin kỳ thi chọn (xem `contest_participants`).
- ~~Cấu hình test gốc nằm ở đâu?~~ → Trong CSDL, backend tự sinh `init.yml` như VNOJ (xem 6.2).
- ~~Hết kỳ thi bài có tự công khai không?~~ → Không. Admin tự đổi `visibility`.

## Lịch sử thay đổi

- **2026-11-17 (6):** D16 mở rộng ra cả `data/`: Redis về UID 999 của image, `media/` UID 10001 (`api` chạy bằng UID này), thêm `data/backups/` (UID 70, gắn vào `postgres` ở `/backups`), service `data-init`. Thêm D17: `scripts/init.sh`; sửa lỗi `.env` không tới được API. Bỏ `HOST_UID`/`HOST_GID` khỏi `.env.example` vì không service nào còn dùng.
- **2026-11-17 (5):** D16 sửa lại: `pgdata/` chuyển sang user `postgres` của container (UID 70), xóa phải dùng `sudo`. Đã thử `docker compose down -v` rồi dựng lại: dữ liệu còn nguyên, 49 test qua.
- **2026-11-17 (4):** D16: chuyển PostgreSQL và Redis từ volume của Docker sang `data/postgres/` và `data/redis/` trong repo, chạy bằng UID của người dùng. Dữ liệu cũ được chép nguyên sang (đã đối chiếu số dòng), có bản dump trước khi chuyển ở `data/backups/`. README thêm mục "Dữ liệu và sao lưu".
- **2026-11-17 (3):** Bài tập theo tiêu chuẩn đầy đủ (mục 6.2 "Tiêu chuẩn một bài tập"): ngày công bố, creator/curator/tester (`problem_members` thay `problem_authors`), 3 chế độ hiển thị, dạng bài, nhóm bài, điểm, chế độ chấm, ngôn ngữ được phép (`languages` nạp sẵn từ máy chấm), lời giải. Migration `561a33c4465f`. Trang quản trị `/admin/catalog`. Trình soạn Markdown chuyên nghiệp (CodeMirror, thanh công cụ, phím tắt, song song, toàn màn hình, hướng dẫn). Đề hỗ trợ `~...~` và HTML an toàn. Trang sửa bài chia 5 tab. Trang đề có bảng thông tin.
- **2026-11-17 (2):** Sửa lỗi trang trắng khi mở qua tunnel HTTPS (ví dụ `https://8080-....vbee.lge.com`). Có ba nguyên nhân: (1) cổng HMR bị cố định là 8080, nên qua tunnel (cổng 443) WebSocket không nối được, và khi Vite cần tải lại trang thì trang lazy không tải được. Đã bỏ cổng cố định, client tự dùng host và cổng của trang. (2) Import icon từ barrel `@tabler/icons-react` làm dev server gửi một file 16,5 MB. Đã chuyển sang import từng icon qua `ui/src/icons.ts`. (3) nginx chưa nén. Đã bật gzip. Trang chủ ở chế độ dev giảm từ khoảng 30 MB xuống 3,1 MB. Thêm trang `RouteError`: lỗi khi render route hiện thông báo thay vì trang trắng, và lỗi tải code thì tự tải lại một lần.
- **2026-11-17:** Xong M2: bảng `problems` và `problem_authors` (migration `faaf0ac385e1`), quyền xem và sửa theo tác giả, chỉ admin công khai hoặc xóa bài, đề Markdown kèm KaTeX (không render HTML thô), nút copy cho khối code, upload ảnh (nhận diện qua byte đầu, không nhận SVG, lưu ở `data/media`, nginx `/media/`), các trang bài tập được tải khi cần. Thêm mục 6.8.
- **2026-11-16 (10):** Thêm vai trò `superadmin` (migration `4118966da114`). Quản lý người dùng theo thứ bậc. Quyền superadmin chỉ cấp từ terminal (`scripts/create-superadmin.sh`). Bảo vệ superadmin cuối cùng.
- **2026-11-16 (9):** Xong M1: bảng `users` (migration đầu tiên), argon2id, session trong Redis, phân quyền, CLI tạo admin, giao diện (layout, trang chủ, đăng nhập/đăng ký, trang cá nhân, quản lý người dùng), font Inter đóng gói sẵn. Service `api` tự chạy `alembic upgrade head` khi khởi động, và chạy bằng UID của người dùng. Thêm mục 6.7.
- **2026-11-16 (8):** Đổi cấu trúc thư mục: `backend/` → `site/` (package `app` → `algojudge`), `frontend/` → `ui/`. `judge-server/` giữ nguyên tên. Service trong Compose: `api`, `ui`.
- **2026-11-16 (7):** Xong M0. Phiên bản đang dùng: Python 3.12, FastAPI 0.163, SQLAlchemy 2.1, PostgreSQL 17, Redis 7, nginx 1.29; React 19, Vite 8, TypeScript 7, Mantine 9, i18next 27. Nginx mở cổng 8080. Test backend dùng `httpx2`, vì Starlette bản mới đã bỏ dùng `httpx` cho test client.
- **2026-11-16 (6):** D1 đổi: đưa source judge-server vào repo, có thể sửa sau này (ghi rõ bản gốc). `reference/` vào `.gitignore`.
- **2026-11-16 (5):** Chốt D10–D15 (vị trí code, công cụ backend, session cookie, Mantine, tiếng Việt kèm i18n, cổng). Thêm lộ trình M0–M7.
- **2026-11-16 (4):** Chốt: không dùng `batched` của dmoj, subtask là khái niệm riêng của site. Trang "sửa testcase" làm trước phần chạy chấm và tính điểm.
- **2026-11-16 (3):** Cấu hình test làm giống VNOJ (CSDL → sinh `init.yml`). Ghi đề xuất của người dùng về cách tính điểm: loại 1 ICPC (short-circuit), loại 2 nhóm có hệ số tính theo tỉ lệ. Ghi ràng buộc: nhóm tính theo tỉ lệ không dùng được `batched` của dmoj.
- **2026-11-16 (2):** Chốt ba câu hỏi mở. Thêm phần giải thích "cấu hình test" và bảng `problem_data`. Đơn vị dự thi hỗ trợ cá nhân, đội dùng chung tài khoản, và đội nhiều tài khoản (`contest_participant_members`). `visibility` của bài do admin đổi tay. Ghi thêm thông tin về batch đã kiểm tra từ source.
- **2026-11-16:** Tạo file. Ghi các quyết định D1–D9, kiến trúc một máy, nguyên tắc thiết kế, bản nháp mô hình dữ liệu.
