# Chức năng: Nộp bài và chấm

Trạng thái: nháp
Milestone: M4 (cập nhật thời gian thực qua WebSocket thuộc M5)

> Bản này là **đề xuất**, chưa có dòng mã nào. Những gì nói về hệ thống khác đều đọc từ mã nguồn, có ghi file và dòng:
> - Máy chấm của dự án: `judge-server/` (bản gốc `VNOI-Admin/judge-server` `2375961`).
> - VNOJ: `reference/vnoj-src/site`, commit `209a32e` (04/11/2026).
> - QDUOJ, DOMjudge, Hydro: `reference/qduoj-src`, `reference/domjudge-src`, `reference/hydro-src`.
>
> Chỗ nào là số tôi đề xuất chứ chưa ai chốt thì ghi **(đề xuất)**.

## 1. Mô tả

- Người dùng gửi mã nguồn cho một bài. Hệ thống biên dịch, chạy trên từng test trong sandbox, rồi trả kết quả từng test và điểm.
- Ai dùng: người đã đăng nhập và xem được bài.
- Không nằm trong bản này: chấm lại (rejudge), nộp trong kỳ thi (M6, M7), trang danh sách bài nộp có bộ lọc đầy đủ. Bản này chỉ định nghĩa đủ để một bài nộp đi từ nút "Nộp" tới kết quả cuối.
- Phụ thuộc: M3 (bài phải có test và `init.yml` hợp lệ).

## 2. Vị trí

- Nút **"Nộp bài"** ở bảng thông tin bên phải trang `/problems/:code`.
- Trang nộp: `/problems/:code/submit`. Gồm ô chọn ngôn ngữ, ô soạn mã (CodeMirror, đã có sẵn từ M2) và nút chọn file.
- Trang kết quả: `/submissions/:id`. Nộp xong được chuyển thẳng tới đây.
- Liên quan: cấu hình test (M3), ngôn ngữ được phép của bài (`problem_languages`), ba chế độ hiển thị của bài (`DESIGN.md` §6.2), trang `/status`.

## 3. Luồng chạy

### Luồng chính

```
Trình duyệt        API              PostgreSQL       Redis        bridge          judge
    │ POST nộp bài  │                    │              │            │               │
    ├──────────────►│ kiểm tra (mục 7)   │              │            │               │
    │               ├─ ghi QUEUED ──────►│              │            │               │
    │               ├─ báo có bài mới ──────────────────►───────────►│               │
    │◄── 201 {id} ──┤                    │              │            ├─ submission-request ─►│
    │                                    │              │            │◄─ acknowledged ───────┤
    │                                    │◄── COMPILING ─────────────┤               │
    │                                    │              │            │◄─ grading-begin ──────┤
    │                                    │◄── GRADING ───────────────┤               │
    │                                    │              │            │◄─ test-case-status ───┤ (gộp mỗi 0,25 giây)
    │                                    │◄── ghi từng test ─────────┤               │
    │                                    │              │            │◄─ grading-end ────────┤
    │                                    │◄── DONE + điểm ───────────┤               │
    │ GET /submissions/{id} (hỏi lại mỗi 1,5 giây cho tới khi xong)  │               │
```

1. Người dùng chọn ngôn ngữ, dán mã hoặc chọn file, bấm "Nộp".
2. API kiểm tra theo thứ tự ở mục 7. Sai ở đâu trả lỗi ở đó, không ghi gì.
3. API ghi `submissions` (trạng thái `QUEUED`) và `submission_sources` trong **một transaction**. Commit xong mới báo cho bridge qua Redis.
4. API trả `201 {id}`. Giao diện chuyển sang `/submissions/:id`.
5. Bridge chọn một judge đang rảnh và có ngôn ngữ đó, gửi gói `submission-request` gồm mã bài, ngôn ngữ, mã nguồn, giới hạn thời gian, giới hạn bộ nhớ và cờ `short-circuit`.
6. Judge trả `submission-acknowledged`. Bridge đổi trạng thái thành `COMPILING`.
7. Judge biên dịch xong, gửi `grading-begin`. Bridge đổi thành `GRADING`.
8. Judge chạy từng test và gửi `test-case-status`. Bridge ghi vào `submission_testcases`.
9. Judge gửi `grading-end`. Bridge tính điểm, ghi `result`, `points`, `max_time_ms`, `max_memory_kb`, đổi thành `DONE`.
10. Trong lúc đó giao diện gọi `GET /api/submissions/{id}` mỗi 1,5 giây **(đề xuất)** và dừng khi trạng thái là `DONE` hoặc `ABORTED`. Sang M5, WebSocket báo "có thay đổi" và việc hỏi lại chỉ còn là dự phòng.

### Luồng phụ và luồng lỗi

| Tình huống | Gói tin từ judge | Kết quả lưu |
|---|---|---|
| Lỗi biên dịch | `compile-error` kèm log | `DONE`, `result = CE`, lưu `compile_log` |
| Biên dịch được nhưng có cảnh báo | `compile-message` | Lưu `compile_log`, chấm tiếp |
| Lỗi phía hệ thống (checker hỏng, thiếu file test) | `internal-error` kèm thông báo | `DONE`, `result = IE`. Thông báo chỉ người sửa được bài và admin thấy |
| Người nộp hoặc admin bấm hủy | Bridge gửi `terminate-submission`, judge trả `submission-terminated` | `ABORTED` |
| Chưa có judge nào kết nối | — | Bài nằm ở `QUEUED`. Trang kết quả ghi rõ "đang chờ máy chấm" |
| Judge không trả `acknowledged` trong 20 giây | — | Bridge ngắt kết nối judge đó, đưa bài về hàng đợi |
| Judge chết giữa lúc chấm | Kết nối đứt | Xem dưới |
| Bridge khởi động lại | — | Xem dưới |

**Judge chết giữa lúc chấm.** Bridge xóa các dòng `submission_testcases` đã ghi dở, đưa bài về `QUEUED` và tăng `dispatch_count`. Tới lần giao thứ 3 **(đề xuất)** mà vẫn chết thì ghi `IE` và dừng, vì có khả năng chính bài nộp này làm sập judge.

**Bridge khởi động lại.** Mọi kết nối judge đều đứt. Khi lên lại, bridge quét các bài `QUEUED`, `COMPILING`, `GRADING`, đưa hai loại sau về `QUEUED`, rồi giao lại theo thứ tự `id`. Hàng đợi vì vậy không mất, vì nó chính là các dòng trong PostgreSQL.

### Vì sao chọn luồng này

**Ghi CSDL trước, báo bridge sau.** Nếu báo trước mà ghi sau, bridge có thể tìm một bài chưa tồn tại. Nếu báo qua Redis thất bại sau khi đã commit, bài vẫn nằm ở `QUEUED` và lần quét định kỳ của bridge sẽ nhặt lại. Không có thứ tự nào làm mất bài.

**Đưa bài về hàng đợi khi judge chết, thay vì ghi IE ngay.** VNOJ ghi IE ngay (`judge/bridge/judge_handler.py:101-103`), người dùng phải nộp lại hoặc chờ admin chấm lại. Phía judge, khi đứt kết nối nó tự thoát để Docker khởi động lại (`judge-server/dmoj/packet.py:159-169, 254-256`), tức là việc judge biến mất rồi quay lại là chuyện được tính trước. Với hệ thống một máy, khởi động lại judge khi cập nhật là việc thường gặp, nên tự chấm lại hợp lý hơn. Giới hạn 3 lần giao để một bài nộp độc không làm judge chết lặp vô hạn.

**So sánh cách giao bài cho máy chấm ở các hệ thống khác:**

| Hệ thống | Cách giao bài | Hàng đợi nằm ở đâu | Kết quả từng test theo thời gian thực |
|---|---|---|---|
| AlgoJudge (đề xuất) | Judge giữ kết nối TCP tới bridge, bridge đẩy bài xuống | PostgreSQL (các dòng `QUEUED`) | Có |
| VNOJ / DMOJ | Như trên | Bộ nhớ của bridge, 4 mức ưu tiên (`judge/bridge/judge_list.py:22-48`, `judge/judge_priority.py`) | Có |
| QDUOJ | Backend gọi HTTP `POST /judge` tới máy chấm và chờ **toàn bộ** kết quả. Hết máy rảnh thì đẩy vào danh sách chờ trong Redis (`backend/judge/dispatcher.py:155-161`) | Redis + dramatiq | Không, chỉ có kết quả cuối |
| DOMjudge | Máy chấm tự hỏi việc: `POST judgehosts/fetch-work`, không có việc thì chờ lâu dần (`judge/judgedaemon.main.php:452-455, 776`) | CSDL | Theo từng lần chạy test |
| Hydro | Máy chấm nối WebSocket tới `judge/conn` (`packages/hydrojudge/src/hosts/hydro.ts:140`) | Chưa đọc | Chưa đọc |

Ta không tự do chọn kiểu giao bài: đã dùng máy chấm dmoj (quyết định D1) thì phải nói giao thức của nó, tức là kiểu đẩy qua TCP. Phần ta tự quyết là hàng đợi nằm ở đâu, và ta chọn PostgreSQL thay cho bộ nhớ.

Nhược điểm của lựa chọn này: bridge phải tự viết lại bằng Python async thay vì dùng bridge của VNOJ (vốn gắn chặt với Django ORM), và mỗi lần giao bài tốn thêm truy vấn CSDL.

### Một việc phải quyết trước khi viết bridge: phiên bản giao thức

- Judge mặc định báo `version = 1` nếu cấu hình không đặt `judge_version` (`judge-server/dmoj/judgeenv.py:284-285`).
- Bridge của VNOJ **từ chối** phiên bản 1 (`judge/bridge/judge_handler.py:164-167`).
- Ở phiên bản khác 1, judge không quét và không gửi danh sách bài nó có (`judge-server/dmoj/judgeenv.py:321-323`). Bridge VNOJ chọn judge theo `storages` và ngôn ngữ (`judge_handler.py:184-186`).

CHƯA QUYẾT: dùng phiên bản 1 hay 2. Đề xuất **phiên bản 2**: mọi judge trên cùng một máy đều gắn chung thư mục `problems/`, nên bridge không cần biết judge nào có bài nào, và judge khởi động nhanh hơn vì không quét thư mục. Đổi lại, bài chưa có `init.yml` phải bị chặn ở API (mục 7), vì bridge không còn tự biết.

## 4. Dữ liệu

Ba bảng `submissions`, `submission_sources`, `submission_testcases` đã có bản nháp ở `DESIGN.md` §6.3. Bản này đề xuất thêm:

| Thay đổi | Lý do |
|---|---|
| `submissions.dispatch_count smallint`, mặc định 0 | Đếm số lần giao cho judge, để dừng ở lần thứ 3 |
| `submissions.error text`, nullable | Thông báo của `internal-error`. Tách khỏi `compile_log` vì chỉ người sửa bài và admin được xem |
| `submissions.data_version text` | Bản test mà bài này được chấm. Khi test đổi, biết ngay bài nộp nào cần chấm lại |
| Index `(user_id, id DESC)` và `(problem_id, id DESC)` | Trang "bài nộp của tôi" và "bài nộp của bài này" |
| Index một phần trên `status` với điều kiện `status IN ('QUEUED','COMPILING','GRADING')` | Dùng cho hai truy vấn chạy liên tục: đếm bài đang chờ của một người (mục 7) và lần quét của bridge. Index này rất nhỏ vì hầu hết bài nộp đã `DONE` |
| `submission_testcases`: khóa chính `(submission_id, position)` | Ghi lại cùng một test hai lần (khi giao lại) không tạo dòng trùng |

Ánh xạ kết quả: judge gửi cờ `status` dạng bit cho từng test. Bridge đổi thành một trong `AC / WA / TLE / MLE / OLE / RTE / IR / SC`. Kết quả của cả bài nộp là kết quả **nặng nhất** trong các test. CHƯA QUYẾT: thứ tự nặng nhẹ cụ thể, sẽ chốt cùng phần tính điểm.

## 5. API

| Method | Endpoint | Quyền | Request | Response | Lỗi |
|---|---|---|---|---|---|
| POST | `/api/problems/{code}/submissions` | Đã đăng nhập, xem được bài | `{language, source}` | 201 `{id}` | 401, 404 `problem_not_found`, 422 `language_not_allowed`, 422 `source_empty`, 422 `source_invalid`, 413 `source_too_large`, 409 `problem_not_judgeable`, 429 `too_many_pending` |
| GET | `/api/submissions/{id}` | Theo quyền xem bài và chế độ hiển thị | — | Trạng thái, kết quả, điểm, thời gian, bộ nhớ, `compile_log`, danh sách test (nếu được xem) | 404 |
| GET | `/api/submissions/{id}/source` | Theo `source_visibility` của bài | — | `{source}` | 404 |
| GET | `/api/submissions?problem=&user=&page=` | Chỉ trả bài nộp người gọi được xem | — | Danh sách, không có mã nguồn | — |
| POST | `/api/submissions/{id}/abort` | Người nộp, người sửa được bài, admin | — | 202 | 404, 409 `already_finished` |

- Không có quyền xem thì trả **404**, không trả 403, giống cách M2 xử lý bài riêng tư. Trả 403 là xác nhận rằng bài nộp đó tồn tại.
- Chọn file trên giao diện chỉ là đọc file vào ô soạn mã. API chỉ có một đường nhận mã nguồn là trường `source`.

## 6. Hiệu suất

**Điểm nghẽn là judge, không phải API.** Mỗi judge chấm một bài tại một thời điểm (`judge-server/dmoj/packet.py`: chỉ có một `current_submission`). Số bài chấm được mỗi phút là:

> số judge × 60 / thời gian chấm trung bình một bài (giây)

Ví dụ với 4 judge và trung bình 5 giây một bài: 48 bài mỗi phút. Đây là phép tính minh họa, chưa đo. Số judge chạy được phụ thuộc số nhân CPU của máy, vì chạy nhiều judge hơn số nhân làm sai thời gian chạy của bài.

| Chỗ | Tải | Biện pháp |
|---|---|---|
| Hàng đợi chấm | Đầu và cuối kỳ thi, bài dồn về nhanh hơn tốc độ chấm | Mỗi người tối đa 2 bài đang chờ (mục 7). Trang kết quả hiện vị trí trong hàng đợi để người dùng không nộp lại vì sốt ruột |
| Ghi kết quả test | Bài 100 test tạo 100 dòng | Judge đã gộp kết quả mỗi 0,25 giây (`packet.py:232`). Bridge ghi mỗi gói bằng một lệnh INSERT nhiều dòng |
| Giao diện hỏi lại | Mỗi trang kết quả đang mở gọi API mỗi 1,5 giây | Chỉ hỏi khi bài chưa xong. Truy vấn theo khóa chính. M5 thay bằng WebSocket |
| Danh sách bài nộp | Bảng lớn nhất hệ thống | Mã nguồn nằm ở bảng riêng nên dòng `submissions` nhỏ. Phân trang, có index theo người và theo bài |
| Mã nguồn | Tối đa 64 KB mỗi bài nộp | Không tải mã nguồn trong danh sách |

CHƯA QUYẾT: trang danh sách dùng phân trang theo số trang (đơn giản, chậm dần ở trang sâu) hay theo mốc `id` (nhanh đều, không nhảy tới trang bất kỳ được).

## 7. Các case phát sinh từ người dùng

API kiểm tra theo đúng thứ tự trong bảng. Thứ tự này có chủ ý: việc rẻ làm trước, và không để lộ thông tin về bài mà người gọi không được xem.

| # | Case | Hậu quả nếu không xử lý | Cách xử lý |
|---|---|---|---|
| 1 | Chưa đăng nhập, hoặc phiên hết hạn trong lúc đang viết mã | Mất bài đang viết | 401. Giao diện lưu nháp vào trình duyệt theo từng bài, đăng nhập lại là còn nguyên |
| 2 | Nộp vào bài riêng tư mà mình không có quyền xem | Lộ việc bài tồn tại, chấm trộm đề chưa công bố | 404, như trang đề |
| 3 | Mã nguồn rỗng hoặc chỉ có khoảng trắng | Tốn một lượt chấm để nhận CE | 422 `source_empty` |
| 4 | Mã nguồn quá lớn | Phình CSDL, gói tin tới judge lớn | Giới hạn 65.536 byte **(đề xuất, bằng VNOJ: `judge/models/submission.py:308`)**. Phải kiểm tra ở API: nginx hiện cho gửi tới 20 MB (`deploy/nginx/dev.conf:25`) |
| 5 | Mã nguồn chứa byte NUL hoặc không phải UTF-8 | PostgreSQL từ chối ký tự NUL trong cột `text`, request chết với lỗi 500 | 422 `source_invalid` |
| 6 | Chọn ngôn ngữ bài không cho phép, hoặc ngôn ngữ vừa bị admin tắt | Chấm bằng ngôn ngữ ngoài ý người ra đề | 422 `language_not_allowed`. Kiểm tra ở API, không tin danh sách trên giao diện |
| 7 | Bài chưa có test hoặc cấu hình test đang lỗi | Bài nộp nằm chờ mãi hoặc nhận IE khó hiểu | 409 `problem_not_judgeable`. Nút "Nộp bài" bị tắt kèm lời giải thích |
| 8 | Nộp liên tục | Một người chiếm hết máy chấm | Mỗi người tối đa **2 bài đang chờ hoặc đang chấm** (đề xuất, bằng `DMOJ_SUBMISSION_LIMIT` của VNOJ: `dmoj/settings.py:253`, `judge/views/problem.py:354-359`). Quá thì 429 `too_many_pending` |
| 9 | Bấm "Nộp" hai lần liên tiếp | Hai bài nộp giống hệt nhau | Giao diện khóa nút từ lúc bấm tới lúc có phản hồi. Case 8 chặn phần còn lại |
| 10 | Đổi `id` trên URL để xem mã nguồn người khác | Lộ bài làm | Mọi endpoint bài nộp kiểm tra quyền theo `source_visibility` của bài. Không được xem thì 404 |
| 11 | Mã độc: fork bomb, đọc file hệ thống, mở kết nối mạng | Sập hoặc lộ dữ liệu máy chấm | Sandbox của judge (`judge-server/dmoj/cptbox/`) chặn theo lời gọi hệ thống. Thư mục test gắn chỉ đọc. Phần này không viết lại, chỉ kiểm tra bằng bộ test tấn công ở mục 8 |
| 12 | In ra hàng trăm MB | Đầy bộ nhớ hoặc ổ đĩa | Judge trả `OLE`. Giới hạn đặt qua `output_limit_length` của bài (M3) |
| 13 | Checker hoặc chương trình trả thông điệp rất dài | Phình bảng `submission_testcases` | Bridge cắt `feedback` còn 50 ký tự **(đề xuất, bằng VNOJ: `judge/models/submission.py:327`)** |
| 14 | Test của bài bị sửa trong lúc bài nộp đang chờ | Không rõ bài được chấm theo bản test nào | Bridge ghi `data_version` lúc giao bài |
| 15 | Bài bị xóa trong lúc bài nộp đang chờ | Bridge giao một bài không còn tồn tại | Bridge đọc lại bài từ CSDL ngay trước khi giao. Không còn thì bỏ qua, như VNOJ (`judge/bridge/judge_list.py:75-80`) |
| 16 | Bấm hủy đúng lúc bài vừa chấm xong | Kết quả đã có bị ghi đè thành "đã hủy" | Chỉ đổi sang `ABORTED` khi trạng thái hiện tại chưa phải `DONE` (điều kiện nằm ngay trong câu UPDATE). Judge cũng tự bỏ qua lệnh hủy đến muộn (`judge-server/dmoj/judge.py:265-269`) |

Giới hạn "2 bài đang chờ" được chọn thay cho kiểu "1 bài mỗi 10 giây" vì nó tự điều chỉnh theo tải: khi máy chấm rảnh, người dùng nộp liên tục được; khi máy chấm bận, không ai xếp được quá 2 bài vào hàng.

## 8. Tiêu chí hoàn thành

- [ ] Nộp một bài C++ đúng: trạng thái đi qua `QUEUED → COMPILING → GRADING → DONE`, kết quả `AC`, đủ số test
- [ ] Mỗi loại kết quả có một bài nộp mẫu trong bộ test: `WA`, `TLE`, `MLE`, `RTE`, `OLE`, `CE`
- [ ] Bài chấm kiểu `icpc`: sai test đầu tiên thì các test sau là `SC`
- [ ] Từng case 1–10 và 16 ở mục 7 có test tự động
- [ ] Bộ bài nộp tấn công (fork bomb, đọc `/etc/passwd`, mở socket, cấp phát vô hạn) đều bị chặn và judge vẫn sống
- [ ] Tắt judge giữa lúc chấm: bài tự được chấm lại khi judge lên, không cần ai can thiệp
- [ ] Khởi động lại bridge khi đang có 10 bài trong hàng: không mất bài nào, không bài nào bị chấm hai lần thành hai kết quả
- [ ] Không có judge nào: nộp vẫn được nhận, trang kết quả ghi "đang chờ máy chấm"
- [ ] Người không có quyền nhận 404 ở mọi endpoint bài nộp
- [ ] Đo số bài chấm được mỗi phút trên máy thật với 1, 2, 4 judge và ghi lại vào đây
