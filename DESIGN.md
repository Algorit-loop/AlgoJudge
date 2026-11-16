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
| D10 | Code đặt **ngay trong repo AlgoJudge**: `backend/`, `frontend/`, `wsevent/`, `bridge/`, `judge-server/`, `deploy/` ở thư mục gốc. `reference/` chỉ để tham khảo, **nằm trong `.gitignore`** | Một repo duy nhất | 2026-11-16 |
| D11 | Công cụ backend: Python 3.12, FastAPI, SQLAlchemy 2 (async), Alembic, Pydantic v2, quản lý gói bằng `uv` | Bộ công cụ chuẩn cho FastAPI | 2026-11-16 |
| D12 | Đăng nhập bằng **session trong cookie httpOnly**, phiên lưu ở Redis. **Không dùng JWT** | Web và API cùng một tên miền qua nginx. Đăng xuất là hủy phiên ngay. JavaScript không đọc được cookie | 2026-11-16 |
| D13 | Frontend: Vite, React, TypeScript, **Mantine**, React Router, TanStack Query. Đề bài render Markdown kèm KaTeX. Ô soạn code dùng CodeMirror | Mantine có đủ component cho trang quản trị, dark mode có sẵn | 2026-11-16 |
| D14 | Giao diện **tiếng Việt, chuẩn bị sẵn i18n**: mọi chuỗi đi qua thư viện i18n | Sau này thêm tiếng Anh không phải sửa code | 2026-11-16 |
| D15 | wsevent là một service Python nhỏ. Ra ngoài máy chỉ mở cổng của nginx. Bridge 9999 chỉ mở trong mạng nội bộ Docker | Trên máy đã có `bkdnoj_bridged` dùng 9998–9999 và `bkdnoj_nginx` dùng 8888 | 2026-11-16 |

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

## 6. Mô hình dữ liệu [NHÁP — đang thảo luận]

Quy ước: mọi bảng có `id BIGSERIAL` trừ khi ghi khác. Thời gian lưu dạng `TIMESTAMPTZ`.

### 6.1 Người dùng và ngôn ngữ

**users**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| username | text, unique | |
| email | text, unique | |
| password_hash | text | argon2/bcrypt |
| display_name | text | |
| role | enum `admin` / `setter` / `user` | Phân quyền MVP |
| is_active | bool | |
| created_at | timestamptz | |

**languages**: danh sách ngôn ngữ, khớp với tên executor của dmoj
| Cột | Kiểu | Ghi chú |
|---|---|---|
| key | text, **PK** | Tên executor của dmoj, ví dụ `CPP17`, `PY3` |
| name | text | Tên hiển thị |
| ext | text | Đuôi file |
| enabled | bool | Admin bật/tắt |

### 6.2 Bài tập và test

**problems**
| Cột | Kiểu | Ghi chú |
|---|---|---|
| code | text, unique | Mã bài, **đồng thời là tên thư mục** `problems/<code>/` |
| title | text | |
| statement_md | text | Đề bài dạng Markdown, có LaTeX |
| time_limit_ms | int | |
| memory_limit_kb | int | |
| visibility | enum `public` / `private` | **Admin tự đổi**, không có gì tự động. Hết kỳ thi, bài vẫn giữ nguyên trạng thái cũ cho đến khi admin công khai |
| author_id | → users | |
| data_version | text | Hash của bộ test hiện tại, đổi mỗi khi upload test mới |
| created_at, updated_at | timestamptz | |

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
| M1 | Tài khoản: đăng ký, đăng nhập (session), phân quyền admin/setter/user | ⏳ tiếp theo |
| M2 | Bài tập: tạo, sửa, hiển thị đề (Markdown + KaTeX) | |
| M3 | Trang **"sửa testcase"**: upload zip (Celery), gom nhóm, đặt hệ số, chọn checker, sinh `init.yml` | |
| M4 | Bridge, judge, nộp bài, chấm, tính điểm. **Đọc kỹ phiên bản giao thức judge (`get_judge_version`) trước khi viết bridge** | |
| M5 | wsevent: cập nhật thời gian thực, kèm polling dự phòng | |
| M6 | Kỳ thi ICPC: penalty, đóng băng bảng, hỏi đáp | |
| M7 | Kỳ thi IOI | |

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

- **2026-11-16 (7):** Xong M0. Phiên bản đang dùng: Python 3.12, FastAPI 0.163, SQLAlchemy 2.1, PostgreSQL 17, Redis 7, nginx 1.29; React 19, Vite 8, TypeScript 7, Mantine 9, i18next 27. Nginx mở cổng 8080. Test backend dùng `httpx2`, vì Starlette bản mới đã bỏ dùng `httpx` cho test client.
- **2026-11-16 (6):** D1 đổi: đưa source judge-server vào repo, có thể sửa sau này (ghi rõ bản gốc). `reference/` vào `.gitignore`.
- **2026-11-16 (5):** Chốt D10–D15 (vị trí code, công cụ backend, session cookie, Mantine, tiếng Việt kèm i18n, cổng). Thêm lộ trình M0–M7.
- **2026-11-16 (4):** Chốt: không dùng `batched` của dmoj, subtask là khái niệm riêng của site. Trang "sửa testcase" làm trước phần chạy chấm và tính điểm.
- **2026-11-16 (3):** Cấu hình test làm giống VNOJ (CSDL → sinh `init.yml`). Ghi đề xuất của người dùng về cách tính điểm: loại 1 ICPC (short-circuit), loại 2 nhóm có hệ số tính theo tỉ lệ. Ghi ràng buộc: nhóm tính theo tỉ lệ không dùng được `batched` của dmoj.
- **2026-11-16 (2):** Chốt ba câu hỏi mở. Thêm phần giải thích "cấu hình test" và bảng `problem_data`. Đơn vị dự thi hỗ trợ cá nhân, đội dùng chung tài khoản, và đội nhiều tài khoản (`contest_participant_members`). `visibility` của bài do admin đổi tay. Ghi thêm thông tin về batch đã kiểm tra từ source.
- **2026-11-16:** Tạo file. Ghi các quyết định D1–D9, kiến trúc một máy, nguyên tắc thiết kế, bản nháp mô hình dữ liệu.
