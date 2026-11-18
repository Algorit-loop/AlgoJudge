# 04. Kỳ thi và rating

Nguồn: `VNOI-Admin/OJ` commit `209a32e` (04/11/2026), thư mục `reference/vnoj-src/site/`. Phần kỳ thi nằm chủ yếu ở `judge/models/contest.py`, `judge/contest_format/` (7 thể thức), `judge/views/contests.py`, `judge/admin/contest.py`, `judge/forms.py` và `templates/contest/`. Rating nằm ở `judge/ratings.py`.

## Bảng quyết định

| Mã | Chức năng | Quyết định | Ghi chú |
|---|---|---|---|
| KT-01 | Khung thể thức và thứ tự xếp hạng chung | | |
| KT-02 | Thể thức Default | | |
| KT-03 | Thể thức ICPC | | |
| KT-04 | Thể thức IOI (từ 2016, theo subtask) | | |
| KT-05 | Thể thức IOI pre-2016 | | |
| KT-06 | Thể thức AtCoder | | |
| KT-07 | Thể thức ECOO | | |
| KT-08 | Thể thức VNOJ | | |
| KT-09 | Đóng băng bảng xếp hạng | | |
| KT-10 | Nhãn bài tự viết bằng Lua | | |
| KT-11 | Tạo kỳ thi trên site | | |
| KT-12 | Sửa và xóa kỳ thi trên site | | |
| KT-13 | Trang quản trị kỳ thi (Django admin) | | |
| KT-14 | Bài trong kỳ thi (ContestProblem) | | |
| KT-15 | Vai trò tác giả, người phụ trách, người thử | | |
| KT-16 | Hiển thị công khai và kỳ thi riêng tư | | |
| KT-17 | Mô tả, điều lệ, ảnh, khối tóm tắt luật | | |
| KT-18 | Ẩn tag và tác giả của bài | | |
| KT-19 | Thẻ kỳ thi (ContestTag) | | |
| KT-20 | Nhân bản kỳ thi | | |
| KT-21 | Chỉ chấm pretest trong lúc thi | | |
| KT-22 | Khóa chấm lại sau một thời điểm | | |
| KT-23 | Cấm máy chấm cho kỳ thi | | |
| KT-24 | Trang danh sách kỳ thi | | |
| KT-25 | Lịch tháng và xuất iCal | | |
| KT-26 | Đăng ký trước | | |
| KT-27 | Vào thi, rời thi, một kỳ thi một lúc | | |
| KT-28 | Cửa sổ thời gian cá nhân | | |
| KT-29 | Mã truy cập và đồng ý điều lệ | | |
| KT-30 | Theo dõi kỳ thi (spectate) | | |
| KT-31 | Thi ảo (virtual) | | |
| KT-32 | Danh sách người bị cấm thi | | |
| KT-33 | Trang kỳ thi, danh sách bài, xem mọi đề một trang | | |
| KT-34 | Hành vi trang bài khi đang thi | | |
| KT-35 | Giới hạn số lần nộp mỗi bài | | |
| KT-36 | Thông báo kỳ thi và đẩy thông báo | | |
| KT-37 | Làm rõ đề (clarification) và khóa bình luận | | |
| KT-38 | Bình luận dưới kỳ thi | | |
| KT-39 | Danh sách bài nộp theo kỳ thi | | |
| KT-40 | Bài nộp tốt nhất của từng bài trong kỳ thi | | |
| KT-41 | Trang bảng xếp hạng | | |
| KT-42 | Chế độ hiển thị bảng xếp hạng | | |
| KT-43 | Cache bảng xếp hạng | | |
| KT-44 | Bảng xếp hạng công khai bằng mã | | |
| KT-45 | Bảng xếp hạng chính thức nhập từ CSV | | |
| KT-46 | Truất quyền thi và tự khóa tài khoản gian lận | | |
| KT-47 | Phát lại bảng xếp hạng (replay) | | |
| KT-48 | Trang thống kê kỳ thi | | |
| KT-49 | Tải dữ liệu bài nộp của kỳ thi | | |
| KT-50 | Kiểm tra đạo văn bằng MOSS | | |
| KT-51 | Trang bóng bay (balloons) | | |
| KT-52 | Công khai bài và gán nguồn bài sau kỳ thi | | |
| KT-53 | Chấm lại, tính lại điểm theo kỳ thi | | |
| KT-54 | Thuật toán rating | | |
| KT-55 | Điều kiện được tính rating | | |
| KT-56 | Chạy tính rating | | |
| KT-57 | Hiển thị rating và hạng hiển thị | | |
| KT-58 | API đồng bộ kỳ thi (v2 sync) | | |
| KT-59 | Chế độ kỳ thi chính thức | | |
| KT-60 | Kỳ thi của tổ chức | | |

## Chi tiết

## Thể thức

### KT-01. Khung thể thức và thứ tự xếp hạng chung
- **Làm gì:** Mỗi kỳ thi chọn một "thể thức" (module tính điểm). Thể thức quyết định cách tính điểm, thời gian phạt, cách phá hòa và nhãn bài.
- **Cách VNOJ làm:**
  - Trường `format_name` (mặc định `default`) chọn 1 trong 7 thể thức: `default`, `icpc`, `ioi16` (tên hiện "IOI"), `ioi` (tên hiện "IOI (pre-2016)"), `atcoder`, `ecoo`, `vnoj`.
  - Trường `format_config` là một đối tượng JSON tùy chọn. Mỗi thể thức tự kiểm tra: khóa lạ, sai kiểu hoặc giá trị âm đều bị từ chối khi lưu.
  - Mỗi lượt tham gia (`ContestParticipation`) lưu 3 số: `score` (điểm), `cumtime` (thời gian cộng dồn, tính cả phạt), `tiebreaker` (trường phá hòa phụ). `format_data` (JSON) lưu chi tiết từng bài để vẽ bảng.
  - Mỗi khi một bài nộp trong kỳ thi được chấm xong, điểm của bài nộp được quy đổi theo điểm bài trong kỳ thi rồi tính lại toàn bộ lượt tham gia (`Submission.update_contest`). Điểm bài nộp = tỉ lệ test đúng × `ContestProblem.points`, làm tròn 3 chữ số. Nếu bài không cho điểm thành phần thì chưa đủ điểm là 0.
  - Bảng xếp hạng sắp theo: bị truất quyền xếp cuối, rồi `score` giảm dần, `cumtime` tăng dần, `tiebreaker` tăng dần, cuối cùng số bài nộp giảm dần.
  - Hạng được đánh kiểu "1, 1, 3": người bằng nhau cả 4 giá trị (truất quyền, điểm, cumtime, tiebreaker) cùng hạng. Số bài nộp chỉ đổi thứ tự hiển thị, không đổi hạng.
  - `points_precision` (mặc định 3, từ 0 đến 10) là số chữ số thập phân khi làm tròn tổng điểm.
  - Nhãn bài mặc định: ICPC dùng chữ cái A, B, …, Z, AA, AB…; 6 thể thức còn lại dùng số 1, 2, 3…
  - Mỗi thể thức có một đoạn mô tả luật ngắn (`get_short_form_display`) để hiện trên trang kỳ thi (xem KT-17).
  - Đổi thể thức hoặc cấu hình thì toàn bộ lượt tham gia được tính lại bằng tác vụ nền `rescore_contest`.
- **Ai dùng được:** Người sửa được kỳ thi chọn thể thức. Form trên site không có ô `format_config`; chỉ trang admin có.
- **Mã nguồn:** `judge/models/contest.py:177-182`, `judge/contest_format/base.py:12-94`, `judge/contest_format/registry.py:1-14`, `judge/models/submission.py:173-189`, `judge/views/contests.py:840-849`, `judge/views/contests.py:936-947`, `judge/tasks/contest.py:24-36`

### KT-02. Thể thức Default
- **Làm gì:** Cộng điểm cao nhất của từng bài. Phá hòa bằng thời gian.
- **Cách VNOJ làm:**
  - Điểm mỗi bài là điểm cao nhất trong các bài nộp của bài đó.
  - `cumtime` = tổng (tính bằng giây) thời điểm bài nộp **cuối cùng** của mỗi bài có điểm khác 0, tính từ lúc bắt đầu của lượt thi.
  - `tiebreaker` luôn bằng 0. Không có phạt.
  - `format_config` phải để trống hoặc là `{}`.
  - Không hỗ trợ đóng băng.
- **Ai dùng được:** Người sửa kỳ thi.
- **Mã nguồn:** `judge/contest_format/default.py:9-50`

### KT-03. Thể thức ICPC
- **Làm gì:** Kiểu ACM-ICPC: điểm (thường mỗi bài 1 điểm), phạt theo số lần nộp sai, có đóng băng.
- **Cách VNOJ làm:**
  - Cấu hình: `penalty` (số phút phạt mỗi lần nộp sai), mặc định 20, phải ≥ 0.
  - Điểm mỗi bài là điểm cao nhất. Thời gian của bài là lúc nộp **lần đầu** đạt điểm cao nhất đó, tính bằng phút (làm tròn xuống).
  - Số lần thử chỉ đếm bài nộp đã có kết quả, bỏ qua lỗi biên dịch (CE) và lỗi hệ thống (IE). Phạt = (số lần thử đến lần đạt điểm cao nhất − 1) × `penalty`. Bài chưa có điểm không bị phạt nhưng vẫn hiện số lần thử.
  - `cumtime` = tổng thời gian (phút) các bài có điểm + tổng phạt.
  - `tiebreaker` = thời điểm (phút) bài có điểm muộn nhất. Nhỏ hơn thì xếp trên.
  - Có hỗ trợ đóng băng (`supports_frozen = True`). Song song với bộ số thật, hệ thống tính `frozen_score`, `frozen_cumtime`, `frozen_tiebreaker` chỉ từ những bài đạt điểm trước mốc đóng băng. Mỗi bài có cờ `is_frozen` khi kết quả tốt nhất nằm sau mốc.
  - Khi bảng đang đóng băng, dữ liệu gửi cho trình duyệt dùng `frozen_points` và `frozen_tries` (tổng số lần thử, kể cả sau mốc), kèm cờ `is_frozen`. Ô bài hiện màu "đang chờ".
  - Bảng hiện thêm cột "Penalty". Ô bài hiện số phút, giờ:phút:giây và số lần thử. Trang kỳ thi ICPC ẩn cột điểm bài.
  - Có trang bóng bay riêng cho thể thức này (KT-51).
  - Bảng ICPC không có nút tải CSV.
- **Ai dùng được:** Người sửa kỳ thi; `penalty` chỉ sửa được trong admin.
- **Mã nguồn:** `judge/contest_format/icpc.py:11-182`, `resources/contest-ranking.js:227-262`, `templates/contest/contest.html:222-224`, `templates/contest/ranking.html:553-555`

### KT-04. Thể thức IOI (từ 2016, theo subtask)
- **Làm gì:** Kiểu IOI mới: điểm mỗi subtask (nhóm test) lấy cao nhất qua mọi lần nộp, rồi cộng lại.
- **Cách VNOJ làm:**
  - Mã thể thức là `ioi16`, tên hiển thị "IOI".
  - Với mỗi bài và mỗi nhóm test (batch), điểm nhóm của một bài nộp = điểm nhỏ nhất trong các test của nhóm. Lấy giá trị lớn nhất qua mọi bài nộp đã chấm xong (`status = 'D'`). Điểm bài = tổng điểm các nhóm.
  - Câu SQL đọc trực tiếp `points` của từng test trong bảng `judge_submissiontestcase`; tôi không thấy bước quy đổi theo `ContestProblem.points` trong thể thức này (chưa kiểm tra kết quả thực tế khi điểm bài trong kỳ thi khác điểm gốc).
  - Cấu hình: `cumtime` (mặc định `false`). Nếu bật, thời gian của bài = thời điểm muộn nhất trong các lần đạt điểm cao nhất của từng nhóm; `cumtime` = tổng các thời gian đó (giây) của bài có điểm. Nếu tắt, không phá hòa.
  - `tiebreaker` luôn bằng 0. Không hỗ trợ đóng băng.
  - Thể thức này không cho phát lại bảng xếp hạng (KT-47).
- **Ai dùng được:** Người sửa kỳ thi.
- **Mã nguồn:** `judge/contest_format/ioi.py:9-102`, `judge/models/contest.py:225-226`

### KT-05. Thể thức IOI pre-2016
- **Làm gì:** Kiểu IOI cũ: lấy bài nộp điểm cao nhất của mỗi bài (không gộp theo subtask).
- **Cách VNOJ làm:**
  - Mã thể thức là `ioi`. Điểm bài = điểm cao nhất trong các bài nộp. Thời gian bài = lần nộp sớm nhất đạt điểm đó.
  - Cấu hình: `cumtime` (mặc định `false`) và `last_score_altering` (mặc định `false`).
  - `cumtime = true`: `cumtime` = tổng thời gian (giây) các bài có điểm.
  - `last_score_altering = true`: `tiebreaker` = thời điểm muộn nhất làm thay đổi điểm. Nếu chỉ bật cờ này, `cumtime` cũng nhận giá trị đó.
  - Cả hai tắt: không phá hòa. Bảng không hiện thời gian và không tô "giải đầu tiên".
  - Không hỗ trợ đóng băng.
- **Ai dùng được:** Người sửa kỳ thi.
- **Mã nguồn:** `judge/contest_format/legacy_ioi.py:9-83`, `resources/contest-ranking.js:99-101`, `resources/contest-ranking.js:264-282`

### KT-06. Thể thức AtCoder
- **Làm gì:** Kiểu AtCoder: cộng điểm, phá hòa bằng thời điểm đạt điểm cuối cùng cộng phạt.
- **Cách VNOJ làm:**
  - Cấu hình: `penalty` (phút), mặc định 5, phải ≥ 0.
  - Điểm bài = điểm cao nhất. Thời gian bài = lần nộp sớm nhất đạt điểm đó (giây).
  - Phạt = số lần nộp trước lần đạt điểm cao nhất (bỏ CE, IE) × `penalty` × 60 giây.
  - `cumtime` = thời gian **lớn nhất** trong các bài có điểm + tổng phạt. `tiebreaker` = 0.
  - Ô bài hiện số lần sai (`penalty`). Không hỗ trợ đóng băng.
- **Ai dùng được:** Người sửa kỳ thi.
- **Mã nguồn:** `judge/contest_format/atcoder.py:10-103`, `resources/contest-ranking.js:287-294`

### KT-07. Thể thức ECOO
- **Làm gì:** Kiểu ECOO: lấy bài nộp **cuối cùng** của mỗi bài, có điểm thưởng.
- **Cách VNOJ làm:**
  - Điểm bài = điểm của bài nộp cuối cùng không phải CE/IE.
  - Cấu hình và mặc định: `cumtime` = `false`, `first_ac_bonus` = 10, `time_bonus` = 5 (đều ≥ 0).
  - Thưởng giải ngay lần đầu: nếu bài chỉ có đúng 1 lần nộp (không tính CE/IE) và đạt đủ điểm bài thì cộng `first_ac_bonus`.
  - Thưởng thời gian: cứ mỗi `time_bonus` phút còn lại tính đến cuối cửa sổ thi của người đó thì cộng 1 điểm. Đặt 0 để tắt.
  - `cumtime = true`: phá hòa bằng tổng thời điểm nộp cuối của **mọi** bài (kể cả bài 0 điểm). Mặc định không phá hòa.
  - Ô bài hiện thêm "+bonus". Không hỗ trợ đóng băng.
- **Ai dùng được:** Người sửa kỳ thi.
- **Mã nguồn:** `judge/contest_format/ecoo.py:9-114`, `resources/contest-ranking.js:325-337`

### KT-08. Thể thức VNOJ
- **Làm gì:** Thể thức riêng của VNOJ: cộng điểm cao nhất, phạt theo lần nộp sai, có đóng băng và đếm bài chờ.
- **Cách VNOJ làm:**
  - Cấu hình: `penalty` (phút, mặc định 5, ≥ 0) và `LSO` ("last submission only", mặc định `false`).
  - Điểm bài = điểm cao nhất. Thời gian bài = lần nộp sớm nhất đạt điểm đó (giây).
  - Phạt = số lần nộp trước lần đạt điểm cao nhất (bỏ CE, IE) × `penalty` × 60 giây. Bài 0 điểm hiện số lần nộp nhưng không bị phạt.
  - `LSO = false`: `cumtime` = tổng thời gian các bài có điểm + phạt. `LSO = true`: dùng thời gian lớn nhất thay cho tổng.
  - `tiebreaker` = thời điểm muộn nhất đạt điểm.
  - Có hỗ trợ đóng băng. Khi `frozen_last_minutes` khác 0, hệ thống tính thêm một bộ số chỉ từ các bài nộp trước mốc đóng băng (`frozen_*`). Mỗi bài lưu `pending` = số bài nộp từ mốc đóng băng trở đi.
  - Khi bảng đóng băng, ô bài có bài chờ hiện điểm trước mốc kèm dấu "?" và số bài chờ trong ngoặc vuông. Nếu người đó đã đạt đủ điểm trước mốc thì hiện kết quả thật.
- **Ai dùng được:** Người sửa kỳ thi.
- **Mã nguồn:** `judge/contest_format/vnoj.py:41-209`, `resources/contest-ranking.js:296-323`

### KT-09. Đóng băng bảng xếp hạng
- **Làm gì:** Đóng băng bảng xếp hạng (ẩn kết quả các bài nộp trong N phút cuối) để giữ hồi hộp đến lúc công bố.
- **Cách VNOJ làm:**
  - Trường `frozen_last_minutes` (mặc định 0 = không đóng băng). Mốc đóng băng = `end_time` − N phút.
  - Chỉ ICPC và VNOJ hỗ trợ. Form trên site tự đặt về 0 nếu thể thức không hỗ trợ, và báo lỗi nếu số âm.
  - Bảng **vẫn đóng băng sau khi kỳ thi kết thúc**. Muốn công bố kết quả thật thì đặt lại `frozen_last_minutes = 0`; hệ thống tính lại toàn bộ điểm.
  - Người sửa được kỳ thi luôn thấy bảng thật. Người khác thấy bảng dựng từ các trường `frozen_*`, kèm thông báo "bảng đã đóng băng khi còn N phút".
  - Khi đang đóng băng, người không sửa được kỳ thi không xem được danh sách bài nộp của người khác (KT-39) và không có trang thống kê.
  - API đồng bộ (KT-58) trả số liệu đóng băng khi đang đóng băng.
  - Kỳ thi có `frozen_last_minutes` khác 0 không phát lại được (KT-47).
- **Ai dùng được:** Người sửa kỳ thi đặt giá trị trên site hoặc admin.
- **Mã nguồn:** `judge/models/contest.py:98-100`, `judge/models/contest.py:375-378`, `judge/models/contest.py:440-447`, `judge/forms.py:840-846`, `judge/forms.py:906-907`, `judge/views/contests.py:1033-1035`, `templates/contest/ranking.html:563-572`

### KT-10. Nhãn bài tự viết bằng Lua
- **Làm gì:** Thay nhãn bài mặc định (1, 2… hoặc A, B…) bằng nhãn do một hàm Lua sinh ra.
- **Cách VNOJ làm:**
  - Trường `problem_label_script`: một hàm Lua nhận chỉ số bài (bắt đầu từ 0) và trả về chuỗi.
  - Lua chạy trong môi trường bị khóa: không truy cập thuộc tính đối tượng, không có hàm dựng sẵn, không có `eval`.
  - Khi lưu, hệ thống thử gọi hàm với chỉ số 0. Lỗi hoặc kết quả không phải chuỗi thì không cho lưu.
- **Ai dùng được:** Chỉ trong admin, cần quyền `judge.contest_problem_label`; không có quyền thì trường chỉ đọc.
- **Mã nguồn:** `judge/models/contest.py:183-186`, `judge/models/contest.py:236-244`, `judge/models/contest.py:262-270`, `judge/admin/contest.py:211-212`

## Tạo và cấu hình

### KT-11. Tạo kỳ thi trên site
- **Làm gì:** Form trên site để tạo kỳ thi kèm danh sách bài.
- **Cách VNOJ làm:**
  - Trang `contest_new` (`/contests/new`). Người tạo tự thành tác giả.
  - Các trường trên form: `key`, `name`, `start_time`, `end_time`, `is_visible`, `use_clarifications`, `hide_problem_tags`, `hide_problem_authors`, `show_short_display`, `scoreboard_visibility`, `format_name`, `frozen_last_minutes`, `push_announcements`, `disallow_virtual`, `description` (trình soạn Markdown có xem trước), `tags`, `access_code`, `is_private`, `private_contestants`.
  - `push_announcements` và `disallow_virtual` chỉ hiện cho superuser.
  - `key`: tối đa 32 ký tự, chỉ `a-z`, `0-9`, `_`, không trùng. `name` tối đa 100 ký tự.
  - Thời lượng tối đa `VNOJ_CONTEST_DURATION_LIMIT` = 14 ngày, trừ khi có quyền `judge.long_contest_duration`.
  - Kiểm tra thời gian: bắt đầu phải trước kết thúc; cửa sổ đăng ký phải mở trước khi đóng, mở trước giờ bắt đầu, đóng trước giờ kết thúc.
  - Phần bài: mỗi dòng gồm bài, điểm, thứ tự, số lần nộp tối đa. Thứ tự không được trùng. Số bài tối đa `MAX_CONTEST_PROBLEMS_COUNT` (mặc định `None` = không giới hạn). Chỉ chọn được bài mà người tạo xem được (`Problem.get_visible_problems`, kể cả bài đã xóa mềm).
  - Ô `private_contestants` cho dán một danh sách tên đăng nhập.
  - Khi bật `VNOJ_OFFICIAL_CONTEST_MODE`, kỳ thi mới luôn có `push_announcements = True` và `disallow_virtual = True`.
  - Sau khi tạo, tác vụ nền `on_new_contest` gửi tin vào webhook Discord nếu `DISCORD_WEBHOOK['on_new_contest']` được cấu hình (tên, 100 ký tự đầu mô tả, giờ bắt đầu, kết thúc, thời lượng, tổ chức).
  - Lịch sử sửa được ghi bằng django-reversion ("Created on site").
- **Ai dùng được:** Quyền Django `judge.add_contest`. Nút "Add new contest" chỉ hiện khi có quyền này.
- **Mã nguồn:** `judge/views/contests.py:1493-1551`, `judge/forms.py:720-773`, `judge/forms.py:812-912`, `judge/models/contest.py:246-260`, `judge/tasks/webhook.py:135-156`, `dmoj/settings.py:117-119`, `dmoj/settings.py:186`, trang `contest_new`

### KT-12. Sửa và xóa kỳ thi trên site
- **Làm gì:** Sửa kỳ thi bằng cùng form như lúc tạo; xóa kỳ thi.
- **Cách VNOJ làm:**
  - Trang `contest_edit` dùng cùng form và cùng phần bài như KT-11. Có thể xóa dòng bài.
  - Đổi `frozen_last_minutes` hoặc `format_name` thì tự tính lại toàn bộ điểm sau khi lưu.
  - Form trên site không kiểm tra quyền riêng cho `is_visible`, `is_private`, `access_code` (khác admin, xem KT-13).
  - Với kỳ thi của tổ chức, ô `tags` bị bỏ và ô thí sinh riêng chỉ tìm trong thành viên tổ chức.
  - Xóa: POST tới `contest_delete` (nút ở cuối trang sửa). Kỳ thi đã có rating thì không xóa được.
- **Ai dùng được:** Người có `is_editable_by` (xem KT-15).
- **Mã nguồn:** `judge/views/contests.py:1554-1630`, `templates/contest/edit.html:466`, trang `contest_edit`, `contest_delete`

### KT-13. Trang quản trị kỳ thi (Django admin)
- **Làm gì:** Giao diện admin đầy đủ mọi trường, chia nhóm, có thao tác hàng loạt.
- **Cách VNOJ làm:**
  - Nhóm trường: chung (`key`, `name`, `authors`, `curators`, `testers`); Settings (`is_visible`, `use_clarifications`, `push_announcements`, `disallow_virtual`, `hide_problem_tags`, `hide_problem_authors`, `show_short_display`, `run_pretests_only`, `locked_after`, `scoreboard_visibility`, `ranking_access_code`, `scoreboard_cache_timeout`, `show_submission_list`, `points_precision`, `banned_judges`); Scheduling (`start_time`, `end_time`, `registration_start`, `registration_end`, `time_limit`); Details (`description`, `terms`, `og_image`, `logo_override_image`, `tags`, `summary`); Format (`format_name`, `frozen_last_minutes`, `format_config`, `problem_label_script`); Rating (`is_rated`, `rate_all`, `rate_disqualified`, `rating_floor`, `rating_ceiling`, `rate_exclude`); Access (`access_code`, `is_private`, `private_contestants`, `is_organization_private`, `organization`, `view_contest_scoreboard`); Justice (`banned_users`); Ranking (`csv_ranking`).
  - Bảng con: danh sách bài (kéo thả để sắp thứ tự, nút Rejudge và Rescore từng bài) và thông báo (nút Resend).
  - Trường chỉ đọc theo quyền: thiếu `judge.contest_rating` thì khóa `is_rated`, `rate_all`, `rate_exclude`; thiếu `judge.lock_contest` thì khóa `locked_after`; thiếu `judge.contest_access_code` thì khóa `access_code`; thiếu `judge.create_private_contest` thì khóa `is_private`, `private_contestants`, `is_organization_private`, `organization`, và nếu thiếu thêm `judge.change_contest_visibility` thì khóa cả `is_visible`; thiếu `judge.contest_problem_label` thì khóa `problem_label_script`.
  - Khi lưu: người không có `change_contest_visibility` chỉ được bật `is_visible` cho kỳ thi riêng tư hoặc của tổ chức, và phải có `create_private_contest`.
  - Đổi `frozen_last_minutes`, `format_config`, `format_name` hoặc danh sách bài thì tự tính lại điểm.
  - `rate_exclude` chỉ cho chọn người đã tham gia kỳ thi. Thêm người vào `banned_users` thì họ bị đẩy khỏi kỳ thi đang ở.
  - Thao tác hàng loạt: đánh dấu hiện/ẩn (cần `change_contest_visibility` hoặc `create_private_contest`; nếu chỉ có quyền sau thì chỉ áp cho kỳ thi riêng tư), khóa/mở khóa chấm lại (cần `lock_contest`). Không có xóa hàng loạt.
  - Danh sách admin chỉ hiện kỳ thi mình là tác giả hoặc người phụ trách, trừ khi có `judge.edit_all_contest`.
  - Admin lượt tham gia (`ContestParticipation`): sửa `contest`, `user`, `real_start`, `virtual`, `is_disqualified`; thao tác "Recalculate results".
  - Nút "Rate", "Rate all", "Invalidate Replay" xem KT-56 và KT-47.
- **Ai dùng được:** Nhân viên (`is_staff`) có `judge.edit_own_contest` (và là người sửa được kỳ thi đó) hoặc `judge.edit_all_contest`. Tab "Admin" trên trang danh sách chỉ hiện cho nhóm này.
- **Mã nguồn:** `judge/admin/contest.py:109-432`, `templates/contest/contest-list-tabs.html:33-35`

### KT-14. Bài trong kỳ thi (ContestProblem)
- **Làm gì:** Gắn bài có sẵn vào kỳ thi với điểm và luật riêng cho kỳ thi.
- **Cách VNOJ làm:**
  - `points`: điểm tối đa của bài trong kỳ thi (số nguyên), độc lập với điểm gốc của bài.
  - `partial` (mặc định bật): cho điểm thành phần. Chỉ có hiệu lực khi bản thân bài cũng cho điểm thành phần.
  - `is_pretested` (mặc định tắt): bài dùng pretest (xem KT-21).
  - `order`: thứ tự, quyết định nhãn bài.
  - `output_prefix_override` (mặc định 0): có trong admin, nhưng tôi không tìm thấy chỗ nào trong site đọc trường này (chưa kiểm tra phía máy chấm).
  - `max_submissions`: số lần nộp tối đa, để trống là không giới hạn, nếu nhập phải ≥ 1 (KT-35).
  - Mỗi bài chỉ xuất hiện một lần trong một kỳ thi.
  - Form trên site chỉ có `problem`, `points`, `order`, `max_submissions`. `partial`, `is_pretested`, `output_prefix_override` chỉ sửa trong admin.
  - Các trường của bản thân bài: xem 02.
- **Ai dùng được:** Người sửa kỳ thi.
- **Mã nguồn:** `judge/models/contest.py:771-790`, `judge/forms.py:720-736`, `judge/admin/contest.py:65-86`

### KT-15. Vai trò tác giả, người phụ trách, người thử
- **Làm gì:** Phân quyền theo từng kỳ thi.
- **Cách VNOJ làm:**
  - `authors` (tác giả): sửa được kỳ thi, được liệt kê công khai là tác giả.
  - `curators` (người phụ trách): sửa được như tác giả nhưng không được liệt kê.
  - `testers` (người thử): xem được kỳ thi kể cả khi ẩn, không sửa được.
  - "Sửa được" (`is_editable_by`) = có `judge.edit_all_contest`, **hoặc** có `judge.edit_own_contest` **và** là tác giả/người phụ trách. Là tác giả mà thiếu `edit_own_contest` thì vẫn không sửa được.
  - "Truy cập được" (`access_check`) xem KT-16. Tác giả, người phụ trách, người thử luôn truy cập được.
  - Tác giả, người phụ trách, người thử không đăng ký hay thi chính thức được; bấm vào thi thì thành người theo dõi (KT-30).
  - Tác giả/người phụ trách xem được mã nguồn mọi bài nộp trong kỳ thi của mình.
  - Khi thí sinh đang thi mở ticket hỏi về một bài của kỳ thi, ticket được giao cho tác giả và người phụ trách của kỳ thi.
- **Ai dùng được:** Gán trong admin; người tạo trên site tự thành tác giả.
- **Mã nguồn:** `judge/models/contest.py:80-87`, `judge/models/contest.py:405-416`, `judge/models/contest.py:518-527`, `judge/models/submission.py:167-169`, `judge/views/ticket.py:118-123`

### KT-16. Hiển thị công khai và kỳ thi riêng tư
- **Làm gì:** Quyết định ai thấy được kỳ thi.
- **Cách VNOJ làm:**
  - `is_visible` (mặc định tắt): kỳ thi có xuất hiện không. Với kỳ thi riêng tư, cờ này vẫn phải bật thì thành viên được phép mới thấy.
  - `is_private` + `private_contestants`: chỉ những người trong danh sách thấy.
  - `is_organization_private` + `organization`: chỉ thành viên tổ chức đó thấy.
  - Bật cả hai: phải vừa là thành viên tổ chức vừa có tên trong danh sách.
  - Thứ tự kiểm tra: khách chưa đăng nhập chỉ thấy kỳ thi công khai (hiện, không riêng tư) → kỳ thi công khai cho mọi người → người có `judge.see_private_contest` hoặc `judge.edit_all_contest` → tác giả/người phụ trách → người thử → nếu không hiện thì chặn → nếu không riêng tư thì cho → người trong `view_contest_scoreboard` được vào → cuối cùng xét tổ chức/danh sách.
  - Kỳ thi ẩn trả 404 "No such contest". Kỳ thi riêng tư trả trang 403 riêng (`contest/private.html`) nói rõ bị chặn vì riêng tư hay vì tổ chức.
  - Người đang thi một kỳ thi luôn vào được trang kỳ thi đó.
  - Danh sách kỳ thi có nhãn "hidden", "private", tên tổ chức có khóa, "rated".
- **Ai dùng được:** Người sửa kỳ thi đặt; trong admin bị giới hạn theo quyền (KT-13).
- **Mã nguồn:** `judge/models/contest.py:101-104`, `judge/models/contest.py:137-140`, `judge/models/contest.py:156-159`, `judge/models/contest.py:455-592`, `judge/views/contests.py:245-279`, `templates/contest/list.html:82-104`

### KT-17. Mô tả, điều lệ, ảnh, khối tóm tắt luật
- **Làm gì:** Nội dung giới thiệu kỳ thi và các thông tin hiển thị kèm.
- **Cách VNOJ làm:**
  - `description`: Markdown, có công thức. Phần hiển thị được cache 3600 giây theo kỳ thi và bộ hiển thị công thức; lưu kỳ thi thì xóa cache.
  - `terms`: điều lệ (Markdown), thí sinh phải tích đồng ý trước khi vào thi (KT-29). Chỉ sửa trong admin.
  - `summary`: văn bản thường, dùng cho thẻ meta mô tả (chia sẻ mạng xã hội). Bỏ trống thì tự sinh từ mô tả.
  - `og_image`: ảnh OpenGraph (tối đa 150 ký tự). Bỏ trống thì tự lấy từ mô tả.
  - `logo_override_image`: ảnh thay logo site khi người dùng ở trong kỳ thi. Bỏ trống thì dùng logo thay thế của tổ chức (nếu có).
  - `show_short_display` (mặc định tắt): hiện khối tóm tắt trên trang kỳ thi gồm: tác giả, người thử (trừ khi ẩn tác giả), kỳ thi có tính rating không và cho ai (theo `rate_all`, sàn, trần), có điểm thành phần không, có pretest không, có giới hạn số lần nộp không, tên thể thức và các dòng luật của thể thức, chế độ hiển thị bảng xếp hạng, có cần mã truy cập không.
  - Trang kỳ thi luôn hiện đồng hồ đếm ngược (đến giờ bắt đầu, đến hết giờ, thời gian còn lại của cá nhân, đang thi ảo, đang theo dõi) và dòng mô tả khung giờ.
  - Có nút chia sẻ Facebook và Twitter.
- **Ai dùng được:** Người sửa kỳ thi.
- **Mã nguồn:** `judge/models/contest.py:88-89`, `judge/models/contest.py:152-169`, `judge/views/contests.py:232-240`, `judge/signals.py:84-91`, `templates/contest/contest.html:45-188`, `templates/contest/contest.html:358-368`

### KT-18. Ẩn tag và tác giả của bài
- **Làm gì:** Không lộ dạng bài và người ra đề trong lúc thi.
- **Cách VNOJ làm:**
  - `hide_problem_tags` (mặc định bật): trang bài không hiện tag khi người dùng đang ở trong kỳ thi chứa bài đó.
  - `hide_problem_authors` (mặc định bật): trang bài không hiện tác giả trong kỳ thi; khối tóm tắt cũng không hiện tác giả và người thử của kỳ thi.
- **Ai dùng được:** Người sửa kỳ thi.
- **Mã nguồn:** `judge/models/contest.py:141-146`, `templates/problem/problem.html:339`, `templates/problem/problem.html:371`, `templates/contest/contest.html:90`, `templates/contest/contest.html:101`

### KT-19. Thẻ kỳ thi (ContestTag)
- **Làm gì:** Gắn nhãn màu cho kỳ thi để phân loại và lọc.
- **Cách VNOJ làm:**
  - Thẻ có `name` (tối đa 50 ký tự, không trùng), `color` (mã hex 3 hoặc 6 chữ số), `description` (Markdown). Màu chữ đen/trắng tự chọn theo độ sáng nền.
  - Mỗi kỳ thi gắn nhiều thẻ. Danh sách kỳ thi hiện 2 thẻ đầu, phần còn lại gộp thành "+N".
  - Bấm thẻ thì lọc danh sách kỳ thi đã qua theo thẻ. Có trang thẻ `contest_tag` (và bản AJAX `contest_tag_ajax`) hiện mô tả thẻ.
  - Thẻ được tạo trong admin; trong admin thẻ có thể chọn luôn các kỳ thi.
- **Ai dùng được:** Tạo thẻ: admin. Gắn thẻ: người sửa kỳ thi (trừ kỳ thi tổ chức trên site).
- **Mã nguồn:** `judge/models/contest.py:35-60`, `judge/admin/contest.py:31-57`, `judge/views/contests.py:1480-1490`, `templates/contest/list.html:108-125`, trang `contest_tag`, `contest_tag_ajax`

### KT-20. Nhân bản kỳ thi
- **Làm gì:** Tạo kỳ thi mới từ một kỳ thi có sẵn.
- **Cách VNOJ làm:**
  - Trang `contest_clone`: nhập `key` mới và chọn "Copy problems" (mặc định có).
  - Bản sao giữ mọi trường thường, thẻ, tổ chức, danh sách thí sinh riêng, danh sách `view_contest_scoreboard`.
  - Bản sao bị đặt lại: `is_visible = False`, `user_count = 0`, `virtual_count = 0`, `locked_after = None`. Người nhân bản là tác giả duy nhất. Người phụ trách, người thử, người bị cấm, `rate_exclude`, `banned_judges`, thông báo không được chép.
  - Xong thì chuyển sang trang sửa của bản mới.
- **Ai dùng được:** Có `judge.clone_contest` và sửa được kỳ thi gốc.
- **Mã nguồn:** `judge/views/contests.py:421-467`, `judge/forms.py:709-717`, trang `contest_clone`

### KT-21. Chỉ chấm pretest trong lúc thi
- **Làm gì:** Kiểu Codeforces: trong lúc thi chỉ chấm một phần test (pretest), sau thi chấm lại đủ.
- **Cách VNOJ làm:**
  - Bài nộp chỉ chạy pretest khi cả `Contest.run_pretests_only` (mặc định tắt) và `ContestProblem.is_pretested` đều bật.
  - Quy trình dự kiến (theo chú thích trường): bật trong lúc thi, tắt trước khi chấm lại toàn bộ sau khi kết thúc.
  - Bảng xếp hạng nhận cờ `is_pretested` từng bài và `run_pretests_only` của kỳ thi để đánh dấu ô.
  - Cách đánh dấu test là pretest và cách máy chấm chạy: xem 03.
- **Ai dùng được:** Chỉ trong admin, người sửa kỳ thi.
- **Mã nguồn:** `judge/models/contest.py:147-151`, `judge/judgeapi.py:64-65`, `judge/views/contests.py:974-1002`

### KT-22. Khóa chấm lại sau một thời điểm
- **Làm gì:** Chốt kết quả: bài nộp trong kỳ thi không bị chấm lại sau một mốc.
- **Cách VNOJ làm:**
  - Trường `locked_after`. Khi đặt, mọi bài nộp của lượt thi chính thức (`virtual = 0`) được ghi cùng mốc. Bài nộp mới của lượt thi chính thức cũng mang mốc này.
  - Bài nộp đã qua mốc thì lệnh chấm lại bị bỏ qua, trừ khi gọi với `force_judge`.
  - Admin có thao tác "Lock contest submissions" (đặt mốc = bây giờ) và "Unlock" (xóa mốc).
- **Ai dùng được:** Quyền `judge.lock_contest`.
- **Mã nguồn:** `judge/models/contest.py:187-189`, `judge/admin/contest.py:270-302`, `judge/models/submission.py:126-137`, `judge/views/problem.py:411-412`

### KT-23. Cấm máy chấm cho kỳ thi
- **Làm gì:** Không cho một số máy chấm chấm bài của kỳ thi (ví dụ máy yếu).
- **Cách VNOJ làm:**
  - Trường `banned_judges` (nhiều máy chấm). Áp cho bài nộp của lượt thi chính thức và lượt theo dõi; bài thi ảo không bị áp.
  - Danh sách tên máy bị cấm được gửi kèm yêu cầu chấm; bộ điều phối bỏ qua các máy đó.
- **Ai dùng được:** Chỉ trong admin, người sửa kỳ thi.
- **Mã nguồn:** `judge/models/contest.py:175-176`, `judge/judgeapi.py:84-102`, `judge/bridge/judge_list.py:70-71`, `judge/bridge/judge_list.py:196-208`

### KT-24. Trang danh sách kỳ thi
- **Làm gì:** Liệt kê kỳ thi theo trạng thái.
- **Cách VNOJ làm:**
  - Trang `contest_list` (`/contests/`), chia các mục: "Active contests" (lượt thi chính thức của mình chưa hết giờ), "Ongoing contests", "Upcoming contests" (sắp theo giờ bắt đầu), "Past contests" (sắp theo giờ kết thúc mới nhất, 20 kỳ thi mỗi trang).
  - Mục đã qua có ô tìm theo `key` hoặc tên và bộ lọc thẻ.
  - Ô "Hide private contests" ẩn kỳ thi của tổ chức; lựa chọn được nhớ trong phiên.
  - Mỗi dòng: tên, nhãn (hidden/private/tổ chức/rated), khung giờ hoặc thời lượng cửa sổ, thẻ, số người thi (bấm sang bảng xếp hạng nếu được xem) và số lượt thi ảo, nút Join/Spectate/Register/Virtual join tùy trạng thái.
  - Kỳ thi cần đăng ký hiện "Registration opens in…", "Registration closed", "Already registered" và số người đã đăng ký.
  - Bấm Join lần đầu hiện hộp xác nhận "đồng hồ sẽ chạy và không dừng được" (tắt trong chế độ kỳ thi chính thức).
- **Ai dùng được:** Mọi người; danh sách lọc theo quyền xem (KT-16).
- **Mã nguồn:** `judge/views/contests.py:75-165`, `templates/contest/list.html`, `templates/contest/contest-list-tabs.html`, trang `contest_list`

### KT-25. Lịch tháng và xuất iCal
- **Làm gì:** Xem kỳ thi trên lịch và đưa vào ứng dụng lịch.
- **Cách VNOJ làm:**
  - Trang `contest_calendar` (`/contests/<năm>/<tháng>/`): lịch tháng, tuần bắt đầu Chủ nhật. Kỳ thi trong một ngày hiện ở ngày đó; kỳ thi nhiều ngày hiện ở ngày bắt đầu và ngày kết thúc.
  - Chỉ đi lùi tới tháng có kỳ thi sớm nhất và đi tới tháng có kỳ thi muộn nhất (hoặc tháng hiện tại). Ngoài khoảng đó trả 404.
  - `contest_ical` (`/contests.ics`): file iCalendar gồm mọi kỳ thi người xem thấy được; mỗi sự kiện có tên, link, giờ bắt đầu và kết thúc (UTC).
- **Ai dùng được:** Mọi người, lọc theo quyền xem.
- **Mã nguồn:** `judge/views/contests.py:655-758`, trang `contest_calendar`, `contest_ical`

## Tham gia

### KT-26. Đăng ký trước
- **Làm gì:** Bắt thí sinh đăng ký trong một khoảng thời gian trước khi được thi.
- **Cách VNOJ làm:**
  - Kỳ thi "cần đăng ký" khi có `registration_start` hoặc `registration_end`.
  - Trang `contest_register`: chỉ đăng ký được khi đang trong cửa sổ đăng ký và kỳ thi chưa kết thúc. Phải qua bước điều lệ và mã truy cập nếu có (KT-29).
  - Đăng ký tạo một lượt tham gia chính thức với giờ bắt đầu giả là 01/01/1970 để đánh dấu "đã đăng ký, chưa vào". Lần vào thi đầu tiên mới ghi giờ thật.
  - Lúc vào thi: nếu chưa đăng ký mà cửa sổ đăng ký đã đóng thì bị từ chối "Not registered". Nếu cửa sổ đăng ký vẫn mở trong lúc thi thì vào được không cần đăng ký trước.
  - Tác giả, người phụ trách, người thử không đăng ký được.
- **Ai dùng được:** Người dùng đã đăng nhập, không bị cấm thi.
- **Mã nguồn:** `judge/models/contest.py:93-96`, `judge/models/contest.py:357-369`, `judge/models/contest.py:712-714`, `judge/views/contests.py:500-548`, `judge/views/contests.py:609-621`, trang `contest_register`

### KT-27. Vào thi, rời thi, một kỳ thi một lúc
- **Làm gì:** Thí sinh bấm vào thi để bắt đầu, có thể rời ra rồi quay lại.
- **Cách VNOJ làm:**
  - Trang `contest_join` (POST). Chỉ vào được khi kỳ thi đã bắt đầu.
  - Mỗi người chỉ ở trong **một** kỳ thi tại một thời điểm (`Profile.current_contest`). Vào kỳ thi khác thì rời kỳ thi cũ (có hộp xác nhận).
  - Lượt chính thức của mỗi người là duy nhất (`virtual = 0`); vào lại thì dùng lại lượt cũ.
  - `contest_leave` (POST): rời kỳ thi. Đồng hồ cá nhân không dừng.
  - Mỗi lần tải trang, hệ thống tự đẩy người dùng ra khỏi kỳ thi nếu lượt đã hết giờ hoặc họ không còn quyền truy cập.
  - Lượt chính thức đã hết giờ mà kỳ thi chưa kết thúc: bấm vào lại thì thành lượt theo dõi (KT-30).
  - Khi đang ở trong kỳ thi, mọi trang có thanh trên cùng hiện tên kỳ thi, thời gian còn lại (hoặc "spectating"/"virtual") và link "Go to Rankings".
  - Mỗi lần vào thi hoặc đăng ký thì cập nhật `user_count` (lượt chính thức) và `virtual_count` (lượt ảo).
- **Ai dùng được:** Người dùng đã đăng nhập, không bị cấm thi (superuser bỏ qua danh sách cấm).
- **Mã nguồn:** `judge/views/contests.py:551-652`, `judge/models/profile.py:470-490`, `judge/middleware.py:131-145`, `judge/models/contest.py:433-436`, `templates/base.html:370-390`, trang `contest_join`, `contest_leave`

### KT-28. Cửa sổ thời gian cá nhân
- **Làm gì:** Kỳ thi mở trong một khoảng dài, mỗi người chỉ có N giờ tính từ lúc tự bấm vào thi (kiểu USACO).
- **Cách VNOJ làm:**
  - Trường `time_limit` (kiểu khoảng thời gian, để trống = không dùng).
  - Không dùng `time_limit`: mọi người bắt đầu tính giờ từ `start_time` và kết thúc ở `end_time`.
  - Có `time_limit`: giờ bắt đầu = lúc người đó vào thi; giờ kết thúc = sớm hơn trong hai mốc (vào thi + `time_limit`, `end_time`).
  - Thời gian trong bảng điểm tính từ giờ bắt đầu của từng người.
  - Trang kỳ thi hiện "<time_limit> window between <start> and <end>".
- **Ai dùng được:** Chỉ đặt trong admin.
- **Mã nguồn:** `judge/models/contest.py:97`, `judge/models/contest.py:716-734`, `templates/contest/contest.html:76-83`

### KT-29. Mã truy cập và đồng ý điều lệ
- **Làm gì:** Bước chặn trước khi vào thi hoặc đăng ký.
- **Cách VNOJ làm:**
  - `access_code` (tối đa 255 ký tự, để trống = tắt): phải nhập đúng mới vào thi/đăng ký. Sai thì báo "Wrong access code".
  - `terms`: nếu có, phải tích "I agree to the terms and conditions".
  - Hai bước dùng chung một trang (`contest/access_code.html`), hiện khi bấm Join hoặc Register.
  - Người sửa được kỳ thi bỏ qua cả hai bước.
  - Mã truy cập không áp cho thi ảo hay theo dõi riêng; mọi lần đi qua `contest_join` đều phải qua bước này.
- **Ai dùng được:** Đặt mã: form site (không kiểm quyền) hoặc admin (cần `judge.contest_access_code`).
- **Mã nguồn:** `judge/models/contest.py:170-172`, `judge/views/contests.py:281-303`, `judge/views/contests.py:491-497`

### KT-30. Theo dõi kỳ thi (spectate)
- **Làm gì:** Vào kỳ thi để xem đề và bảng mà không tính là thí sinh.
- **Cách VNOJ làm:**
  - Lượt theo dõi có `virtual = -1`. Không xuất hiện trên bảng xếp hạng, không tính rating.
  - Ai được theo dõi: tác giả, người phụ trách, người thử (kể cả trước giờ bắt đầu); thí sinh đã hết cửa sổ thi trong khi kỳ thi còn diễn ra.
  - Cửa sổ theo dõi kết thúc ở `end_time`.
  - Nút "Spectate contest" / "Stop spectating" trên trang kỳ thi.
  - Thí sinh theo dõi vẫn nhận thông báo đẩy (KT-36).
- **Ai dùng được:** Như trên.
- **Mã nguồn:** `judge/models/contest.py:637-639`, `judge/models/contest.py:704-725`, `judge/views/contests.py:560-627`, `templates/contest/contest-tabs.html:52-69`

### KT-31. Thi ảo (virtual)
- **Làm gì:** Sau khi kỳ thi kết thúc, người dùng thi lại như thật với đồng hồ riêng.
- **Cách VNOJ làm:**
  - Chỉ có khi kỳ thi đã kết thúc và `disallow_virtual` tắt (mặc định tắt).
  - Mỗi lần thi ảo tạo một lượt mới, số thứ tự tăng dần (`virtual = 1, 2, …`).
  - Thời lượng = `time_limit` nếu có, nếu không thì bằng độ dài kỳ thi.
  - Rời lượt ảo là mất luôn; muốn thi nữa phải tạo lượt mới (có hộp xác nhận).
  - Bảng xếp hạng có ô "Show virtual participations" (chỉ khi kỳ thi đã kết thúc và cho thi ảo); lượt ảo hiện số thứ tự `[n]` cạnh tên.
  - Nếu kỳ thi phát lại được, người đang thi ảo thấy bảng của thí sinh thật tại cùng thời điểm đã trôi qua (KT-47).
  - Lượt ảo không tính rating, không bị cấm máy chấm, không bị khóa chấm lại.
- **Ai dùng được:** Người dùng đã đăng nhập. Ô `disallow_virtual` trên site chỉ superuser sửa được.
- **Mã nguồn:** `judge/models/contest.py:196-198`, `judge/models/contest.py:726-730`, `judge/views/contests.py:583-600`, `judge/views/contests.py:1055-1076`, `templates/contest/media-js.html:3-6`

### KT-32. Danh sách người bị cấm thi
- **Làm gì:** Chặn người cụ thể khỏi một kỳ thi.
- **Cách VNOJ làm:**
  - Trường `banned_users`. Người trong danh sách không vào thi và không đăng ký được (thông báo "persona non grata"). Superuser bỏ qua.
  - Thêm người vào danh sách trong admin thì họ bị đẩy khỏi kỳ thi ngay.
  - Truất quyền (KT-46) tự thêm người vào danh sách; bỏ truất quyền thì tự gỡ.
- **Ai dùng được:** Admin, người sửa kỳ thi.
- **Mã nguồn:** `judge/models/contest.py:173-174`, `judge/views/contests.py:516-519`, `judge/views/contests.py:570-573`, `judge/admin/contest.py:128-130`

## Trong kỳ thi

### KT-33. Trang kỳ thi, danh sách bài, xem mọi đề một trang
- **Làm gì:** Trang chính của kỳ thi và các tab.
- **Cách VNOJ làm:**
  - Trang `contest_view`. Các tab: Info, Statistics (người sửa), Rankings hoặc "Hidden Rankings", Official Rankings (nếu có CSV), Submissions, Balloons (ICPC), MOSS, Edit, Clone, cùng nút Join/Register/Spectate/Virtual join/Leave.
  - Tab xếp hạng và bài nộp chỉ hiện sau giờ bắt đầu (trừ người có `see_private_contest`).
  - Bảng bài chỉ hiện khi: đang ở trong kỳ thi, kỳ thi đã kết thúc, superuser, tác giả/người phụ trách, người thử. Cột: nhãn, trạng thái đã giải/đã thử/khóa, tên, giới hạn thời gian, bộ nhớ, điểm (không hiện với ICPC), link lời giải (chỉ sau khi kết thúc và bài công khai có lời giải công khai).
  - Tên bài có link khi bài công khai hoặc người xem "xem được mọi bài" (đang thi, người sửa, người thử, superuser, hoặc kỳ thi không có bài riêng tư).
  - `contest_all_problems` (`/all`): hiện đề của mọi bài trên một trang, có bản dịch; cùng điều kiện "xem được mọi bài".
  - Trang kỳ thi còn có khối Announcements (KT-36) và Clarifications (KT-37).
- **Ai dùng được:** Ai truy cập được kỳ thi (KT-16).
- **Mã nguồn:** `judge/views/contests.py:176-418`, `templates/contest/contest-tabs.html`, `templates/contest/contest.html:190-291`, trang `contest_view`, `contest_all_problems`

### KT-34. Hành vi trang bài khi đang thi
- **Làm gì:** Khi đang ở trong kỳ thi, trang bài và các chức năng liên quan đổi cách hoạt động.
- **Cách VNOJ làm:**
  - Bài thuộc kỳ thi mình đang ở thì xem được kể cả khi bài riêng tư. Nếu kỳ thi chưa bắt đầu thì không xem được.
  - Bài nộp vào bài thuộc kỳ thi được gắn với lượt tham gia hiện tại (kể cả lượt theo dõi, lượt ảo).
  - Lời giải (editorial) bị ẩn (404) khi đang ở trong bất kỳ kỳ thi nào.
  - Nút "bài ngẫu nhiên" bị tắt khi đang thi.
  - Tag và tác giả bài bị ẩn theo KT-18.
  - Chi tiết nộp bài và chấm: xem 03.
- **Ai dùng được:** Người đang ở trong kỳ thi.
- **Mã nguồn:** `judge/models/problem.py:314-326`, `judge/views/problem.py:61-71`, `judge/views/problem.py:405-420`, `judge/views/problem.py:817-821`

### KT-35. Giới hạn số lần nộp mỗi bài
- **Làm gì:** Mỗi thí sinh chỉ được nộp tối đa N lần cho một bài trong kỳ thi.
- **Cách VNOJ làm:**
  - Theo `ContestProblem.max_submissions`. Đếm theo từng lượt tham gia, không tính bài nộp lỗi hệ thống (IE).
  - Trang nộp bài hiện số lần còn lại. Hết lượt thì báo "You have exceeded the submission limit for this problem".
  - Một bài IE được chấm lại thành kết quả khác sẽ bị tính vào giới hạn; số còn lại không xuống dưới 0.
- **Ai dùng được:** Người sửa kỳ thi đặt giới hạn.
- **Mã nguồn:** `judge/models/contest.py:780-784`, `judge/views/problem.py:56-59`, `judge/views/problem.py:257-268`, `judge/views/problem.py:369-372`

### KT-36. Thông báo kỳ thi và đẩy thông báo
- **Làm gì:** Ban tổ chức đăng thông báo trong kỳ thi, có thể đẩy tới thí sinh.
- **Cách VNOJ làm:**
  - Thông báo có `title` (tối đa 100 ký tự), `description` (Markdown), `date` tự ghi.
  - Tạo ở trang `contest_announce` hoặc trong admin. Hiện thành bảng "Announcements" trên trang kỳ thi, mới nhất trên đầu.
  - Nếu `push_announcements` bật (mặc định tắt), khi tạo thông báo thì tác vụ nền gửi thông báo dạng popup tới mọi người có lượt chính thức hoặc lượt theo dõi, qua kênh realtime riêng của kỳ thi, mức ưu tiên `CONTEST_ANNOUNCEMENT` = 30.
  - Admin có nút "Resend" gửi lại một thông báo.
- **Ai dùng được:** Người sửa kỳ thi. Ô `push_announcements` trên site chỉ superuser sửa; chế độ kỳ thi chính thức bật sẵn.
- **Mã nguồn:** `judge/models/contest.py:122-124`, `judge/models/contest.py:624-634`, `judge/signals.py:204-209`, `judge/tasks/contest.py:153-173`, `judge/views/contests.py:470-488`, `judge/admin/contest.py:94-106`, trang `contest_announce`

### KT-37. Làm rõ đề (clarification) và khóa bình luận
- **Làm gì:** Thay bình luận công khai bằng các thông báo làm rõ đề do ban tổ chức đăng.
- **Cách VNOJ làm:**
  - `use_clarifications` (mặc định bật).
  - Làm rõ đề là `ProblemClarification` gắn với bài (nội dung, thời gian), được nhập trong admin của bài.
  - Trang kỳ thi liệt kê mọi làm rõ của các bài trong kỳ thi. Trang bài hiện làm rõ của bài khi người xem đang ở trong kỳ thi bật cờ này.
  - Khi cờ bật: bình luận dưới bài bị khóa với người đang ở trong kỳ thi; bình luận dưới kỳ thi bị khóa khi người xem đang trong kỳ thi hoặc kỳ thi đang diễn ra.
  - Thí sinh đặt câu hỏi qua ticket của bài (xem 06).
- **Ai dùng được:** Người sửa bài nhập làm rõ; người sửa kỳ thi bật cờ.
- **Mã nguồn:** `judge/models/contest.py:119-121`, `judge/models/problem.py:714-717`, `judge/views/problem.py:175-205`, `judge/views/contests.py:309-315`, `judge/views/contests.py:359-361`

### KT-38. Bình luận dưới kỳ thi
- **Làm gì:** Khu thảo luận dưới trang kỳ thi.
- **Cách VNOJ làm:**
  - Trang `contest_comments` tải bình luận lười (AJAX) vào trang kỳ thi. Khóa trang bình luận là `c:<key>`.
  - Bị khóa trong lúc thi nếu dùng clarification (KT-37).
  - Chế độ kỳ thi chính thức ẩn danh sách bình luận với người không phải superuser.
  - Cơ chế bình luận chung: xem 06.
- **Ai dùng được:** Ai truy cập được kỳ thi.
- **Mã nguồn:** `judge/views/contests.py:376-389`, `templates/contest/contest.html:371-381`, trang `contest_comments`

### KT-39. Danh sách bài nộp theo kỳ thi
- **Làm gì:** Xem bài nộp trong phạm vi một kỳ thi.
- **Cách VNOJ làm:**
  - `contest_all_submissions`: mọi bài nộp của kỳ thi. Nếu không được xem toàn bộ thì chỉ thấy bài của mình.
  - `contest_all_user_submissions`: bài nộp của một người trong kỳ thi. Xem của người khác cần được xem toàn bộ bảng xếp hạng.
  - `contest_user_submissions`: bài nộp của một người cho một bài. Người đó phải có lượt tham gia. Nếu người xem không xem được bài thì tiêu đề hiện nhãn bài thay tên.
  - Không có `see_private_contest` thì kỳ thi ẩn hoặc chưa bắt đầu trả 404.
  - Quy tắc "được xem bài nộp của người khác" (`can_see_full_submission_list`): phải xem được toàn bộ bảng; người sửa kỳ thi hoặc `edit_all_contest` luôn được; nếu đang đóng băng thì không; nếu đã kết thúc thì được; nếu `show_submission_list` bật (mặc định tắt) thì được trong lúc thi.
  - Danh sách bài nộp chung toàn site ẩn bài nộp trong kỳ thi của người khác, trừ khi người xem là tác giả/người phụ trách, kỳ thi có bảng "Visible", hoặc kỳ thi đã kết thúc (người có `see_private_contest` thấy hết).
- **Ai dùng được:** Như trên.
- **Mã nguồn:** `judge/models/contest.py:116-118`, `judge/models/contest.py:303-328`, `judge/views/submission.py:392-406`, `judge/views/submission.py:784-900`, trang `contest_all_submissions`, `contest_all_user_submissions`, `contest_user_submissions`

### KT-40. Bài nộp tốt nhất của từng bài trong kỳ thi
- **Làm gì:** Bảng xếp hạng bài nộp của một bài, chỉ trong kỳ thi.
- **Cách VNOJ làm:**
  - Trang `contest_ranked_submissions` (`/contest/<key>/rank/<bài>/`).
  - Mỗi người lấy một bài nộp tốt nhất: điểm trong kỳ thi cao nhất, rồi thời gian chạy nhỏ nhất, rồi mã bài nộp nhỏ nhất. Chỉ tính bài có điểm > 0. Bỏ người dùng bị ẩn (`is_unlisted`).
  - Chỉ có cho bài công khai; bài riêng tư trả 404.
- **Ai dùng được:** Ai xem được kỳ thi (kỳ thi phải hiện và đã bắt đầu, trừ `see_private_contest`).
- **Mã nguồn:** `judge/views/ranked_submission.py:15-103`, trang `contest_ranked_submissions`

## Bảng xếp hạng

### KT-41. Trang bảng xếp hạng
- **Làm gì:** Bảng điểm trực tiếp của kỳ thi.
- **Cách VNOJ làm:**
  - Trang `contest_ranking`. Dữ liệu là JSON (thêm `?data` vào URL để lấy riêng JSON), trình duyệt tự dựng bảng theo thể thức.
  - Khi kỳ thi chưa kết thúc, trang tự tải lại dữ liệu mỗi 10 giây, tạm dừng khi tab bị ẩn.
  - Cột: hạng, người dùng (tên hiển thị, màu theo rating, huy hiệu, tổ chức đầu tiên), rating của người đó trong kỳ thi này (nếu kỳ thi đã tính rating), điểm, các cột phạt riêng của thể thức, từng bài.
  - Ô bài tô màu: giải đầu tiên, đã giải, thử sai, đang chờ, chưa thử. Ô bài link tới bài nộp của người đó cho bài đó (nếu được xem). "Giải đầu tiên" chỉ xét lượt chính thức.
  - Dòng cuối "Total AC" đếm số người đạt đủ điểm từng bài.
  - Công cụ phía trình duyệt: lọc theo tổ chức (nhớ trong localStorage theo kỳ thi), đánh dấu người yêu thích (ghim lên đầu), ẩn/hiện họ tên và tổ chức, hiện lượt thi ảo, tải CSV (trừ ICPC), link `#!username` cuộn tới người đó.
  - Người sửa kỳ thi thấy nút truất quyền và nút sửa lượt tham gia trong admin (nếu có quyền `change_contestparticipation`) trên từng dòng.
  - Nếu người xem không được xem toàn bộ bảng, chỉ thấy dòng của mình với hạng "???".
- **Ai dùng được:** Người qua được `can_see_own_scoreboard` (KT-42); không qua thì 404.
- **Mã nguồn:** `judge/views/contests.py:840-1198`, `templates/contest/ranking.html`, `resources/contest-ranking.js`, trang `contest_ranking`

### KT-42. Chế độ hiển thị bảng xếp hạng
- **Làm gì:** Quyết định khi nào ai được xem bảng.
- **Cách VNOJ làm:**
  - `scoreboard_visibility` có 4 giá trị: `V` "Visible" (mặc định, luôn hiện), `C` "Hidden for duration of contest" (ẩn đến khi kỳ thi kết thúc), `P` "Hidden for duration of participation" (ẩn đến khi cửa sổ thi của chính mình kết thúc), `H` "Always hidden" (luôn ẩn).
  - Bảng "công khai" (`show_scoreboard`) khi: không phải `H`, kỳ thi đã bắt đầu, và với `C`/`P` thì kỳ thi đã kết thúc.
  - Được xem toàn bộ bảng (`can_see_full_scoreboard`): bảng công khai; hoặc có `see_private_contest`/`edit_all_contest`; hoặc là tác giả/người phụ trách; hoặc có tên trong `view_contest_scoreboard`; hoặc chế độ `P` và lượt chính thức của mình đã hết giờ.
  - Được xem dòng của mình (`can_see_own_scoreboard`): được xem toàn bộ; hoặc kỳ thi đã bắt đầu và (bảng công khai, hoặc đang ở trong kỳ thi, hoặc đã thi xong).
  - `view_contest_scoreboard` cũng cho người đó vào được kỳ thi riêng tư (KT-16).
- **Ai dùng được:** Người sửa kỳ thi đặt `scoreboard_visibility`; `view_contest_scoreboard` chỉ trong admin.
- **Mã nguồn:** `judge/models/contest.py:64-73`, `judge/models/contest.py:107-112`, `judge/models/contest.py:279-301`, `judge/models/contest.py:330-346`

### KT-43. Cache bảng xếp hạng
- **Làm gì:** Giữ dữ liệu bảng trong bộ nhớ đệm vài giây để giảm tải.
- **Cách VNOJ làm:**
  - `scoreboard_cache_timeout` (giây), mặc định 3. Đặt 0 để tắt.
  - Không dùng cache cho người sửa kỳ thi và cho người đăng nhập nhưng chỉ được xem dòng của mình.
  - Khóa cache gồm kỳ thi, có hiện lượt ảo không, có đóng băng không, ngôn ngữ giao diện.
  - Khi kỳ thi chưa kết thúc và cache bật, trang hiện cảnh báo "bảng được cache N giây" (ẩn được, nhớ theo kỳ thi).
- **Ai dùng được:** Chỉ đặt trong admin.
- **Mã nguồn:** `judge/models/contest.py:113-115`, `judge/views/contests.py:1047-1053`, `judge/views/contests.py:1082-1085`, `judge/views/contests.py:1150-1159`, `templates/contest/ranking.html:574-580`

### KT-44. Bảng xếp hạng công khai bằng mã
- **Làm gì:** Cho người ngoài (ví dụ phụ huynh, khán giả) xem toàn bộ bảng qua một link có mã, dù bảng đang ẩn.
- **Cách VNOJ làm:**
  - Trường `ranking_access_code` (tối đa 255 ký tự, để trống = tắt).
  - Trang `contest_public_ranking` (`/contest/<key>/public_ranking/?code=<mã>`). Sai hoặc thiếu mã thì báo "Ranking access code required".
  - Bỏ qua kiểm tra chế độ hiển thị bảng, luôn hiện toàn bộ. Vẫn áp đóng băng.
  - Vẫn phải truy cập được kỳ thi (kiểm tra riêng tư ở KT-16 vẫn chạy).
- **Ai dùng được:** Đặt mã trong admin; ai có link thì xem.
- **Mã nguồn:** `judge/models/contest.py:200-203`, `judge/views/contests.py:1201-1217`, trang `contest_public_ranking`

### KT-45. Bảng xếp hạng chính thức nhập từ CSV
- **Làm gì:** Hiện một bảng kết quả chính thức xuất từ hệ thống khác (CMS).
- **Cách VNOJ làm:**
  - Trường `csv_ranking`: dán nội dung CSV xuất từ CMS. Cột bắt buộc `Username`, `User`, có thể có `Team`, sau đó từng bài (mỗi bài 2 cột, lấy cột đầu), cuối là `Global`.
  - Trang `contest_official_ranking` hiện bảng sắp theo tổng điểm giảm dần, hạng 1, 2, 3… liên tiếp.
  - Nếu nội dung bắt đầu bằng `http` thì trang chuyển hướng tới link đó.
  - Giá trị đặc biệt `ghost` không phải CSV mà là cờ của tính năng phát lại có người "ma" (KT-47).
  - Tab "Official Rankings" chỉ hiện khi có dữ liệu.
- **Ai dùng được:** Nhập trong admin. Người xem cần qua `can_see_own_scoreboard`.
- **Mã nguồn:** `judge/models/contest.py:74-76`, `judge/models/contest.py:193-194`, `judge/utils/cms.py:5-21`, `judge/views/contests.py:1220-1277`, trang `contest_official_ranking`

### KT-46. Truất quyền thi và tự khóa tài khoản gian lận
- **Làm gì:** Loại một thí sinh khỏi bảng xếp hạng; tùy chọn tự khóa tài khoản người vi phạm nhiều lần.
- **Cách VNOJ làm:**
  - Bấm nút trên dòng bảng xếp hạng (POST `contest_participation_disqualify`, bấm lại để bỏ) hoặc đổi `is_disqualified` trong admin.
  - Khi truất quyền: điểm thành −9999, `cumtime` và `tiebreaker` về 0; dòng xuống cuối bảng. Người đó bị đẩy khỏi kỳ thi và thêm vào `banned_users`. Nếu kỳ thi đã có rating thì tính lại rating (KT-56).
  - Bỏ truất quyền: tính lại điểm, gỡ khỏi `banned_users`.
  - Tự khóa tài khoản (tắt mặc định): nếu `VNOJ_SHOULD_BAN_FOR_CHEATING_IN_CONTESTS = True` và kỳ thi không phải của tổ chức, hệ thống đếm số lần bị truất quyền trong các kỳ thi không thuộc tổ chức, bắt đầu từ `VNOJ_BAN_COUNT_FROM_DATE` (mặc định 01/01/2026 UTC; `None` = đếm hết).
  - Đạt `VNOJ_MAX_DISQUALIFICATIONS_BEFORE_BANNING` (mặc định 3) thì khóa tài khoản với lý do `VNOJ_CONTEST_CHEATING_BAN_MESSAGE` ("Banned for multiple cheating offenses during contests"). Khóa = hạng hiển thị `banned`, ẩn khỏi bảng xếp hạng người dùng, tắt đăng nhập.
  - Nếu sau đó số lần giảm dưới ngưỡng và tài khoản đang bị khóa đúng vì lý do này thì tự mở khóa.
  - Trang đăng nhập của tài khoản bị khóa vì lý do này liệt kê các kỳ thi đã bị truất quyền.
- **Ai dùng được:** Người sửa kỳ thi.
- **Mã nguồn:** `judge/models/contest.py:650-651`, `judge/models/contest.py:658-702`, `judge/views/contests.py:1321-1337`, `judge/admin/contest.py:411-414`, `judge/models/profile.py:503-518`, `judge/forms.py:574-585`, `dmoj/settings.py:145-150`

### KT-47. Phát lại bảng xếp hạng (replay)
- **Làm gì:** Kéo thanh thời gian để xem bảng xếp hạng thay đổi thế nào trong suốt kỳ thi.
- **Cách VNOJ làm:**
  - Chỉ có khi cả 4 điều kiện đúng: khách chưa đăng nhập cũng truy cập được kỳ thi; kỳ thi đã kết thúc và `frozen_last_minutes = 0`; bảng công khai; thể thức không phải `ioi16`. Lý do: phát lại làm lộ toàn bộ bảng.
  - Dữ liệu: file JSON gồm danh sách thí sinh chính thức và mọi bài nộp (bỏ CE, IE, chưa có kết quả) với điểm và giây kể từ lúc bắt đầu. Tạo một lần, lưu ở `MEDIA_ROOT/contest_replay/<key>_v<version>.json` (`CONTEST_REPLAY_MEDIA_DIR`), trả về với cache 1 năm. Có thể phục vụ qua nginx bằng `DMOJ_CONTEST_REPLAY_INTERNAL`.
  - URL dữ liệu là `contest_replay_data` kèm `replay_version`. Admin bấm "Invalidate Replay" thì tăng phiên bản để trình duyệt tải lại.
  - Trình duyệt tự tính điểm cho cả 7 thể thức tại mọi thời điểm. Có thanh trượt, nút "End", ô nhập số phút đóng băng thử (với thể thức hỗ trợ đóng băng).
  - Người đang thi ảo kỳ thi này thấy bảng của thí sinh thật tại cùng thời điểm đã trôi qua, nút "Live" quay về hiện tại.
  - Người "ma": lệnh `merge_replay_data <contest> <file.json>` trộn thí sinh của một kỳ thi khác (cùng số bài) vào dữ liệu phát lại dưới dạng "ghost", tăng phiên bản, đặt `csv_ranking = 'ghost'`. Bảng có ô "Show ghost participations".
  - Không phát lại được khi đang bật hiện lượt ảo.
- **Ai dùng được:** Mọi người xem bảng; lệnh trộn chạy trên máy chủ.
- **Mã nguồn:** `judge/models/contest.py:204-226`, `judge/views/contests.py:1106-1173`, `judge/views/contests.py:1340-1423`, `judge/admin/contest.py:288-295`, `judge/management/commands/merge_replay_data.py`, `resources/contest-replay.js`, `dmoj/settings.py:275-278`, trang `contest_replay_data`

## Sau kỳ thi

### KT-48. Trang thống kê kỳ thi
- **Làm gì:** Biểu đồ tổng hợp bài nộp của kỳ thi.
- **Cách VNOJ làm:**
  - Trang `contest_stats`. 4 biểu đồ: số bài nộp theo kết quả cho từng bài (cột chồng), tỉ lệ AC từng bài, số bài nộp theo ngôn ngữ (tròn), tỉ lệ AC theo ngôn ngữ.
  - Tính trên mọi bài nộp gắn với kỳ thi sau giờ bắt đầu (kể cả thi ảo). Màu kết quả theo `DMOJ_STATS_SUBMISSION_RESULT_COLORS`.
- **Ai dùng được:** Chỉ người sửa kỳ thi (người khác 404).
- **Mã nguồn:** `judge/views/contests.py:761-828`, trang `contest_stats`

### KT-49. Tải dữ liệu bài nộp của kỳ thi
- **Làm gì:** Ban tổ chức tải mã nguồn mọi bài nộp thành một file zip.
- **Cách VNOJ làm:**
  - Tắt mặc định: cần `DMOJ_CONTEST_DATA_DOWNLOAD = True` và thư mục `DMOJ_CONTEST_DATA_CACHE`.
  - Trang `contest_prepare_data`: chọn lọc theo mẫu mã bài (glob, mặc định `*`) và theo kết quả. Bấm thì tác vụ nền tạo zip, có thanh tiến độ.
  - Giới hạn tạo lại: 1 lần mỗi `DMOJ_CONTEST_DATA_DOWNLOAD_RATELIMIT` (mặc định 1 ngày), ghi ở `data_last_downloaded`.
  - Chỉ lấy lượt thi chính thức. Cấu trúc: `<username>/<mãbài>.<đuôi>` là bài điểm cao nhất; các bài khác ở `<username>/$History/<mãbài>_<id>.<đuôi>`. Bài nộp dạng file được chép nguyên file.
  - `contest_download_data` tải file `<key>-data.zip`.
  - Bộ lọc theo kết quả gọi `filter(result__in=…)` trên `ContestSubmission`, mô hình này không có trường `result` (chưa kiểm tra bộ lọc này có chạy được không).
  - Ngoài web có 2 lệnh quản trị: `export_contest_submissions <key> <thư mục>` (cùng cấu trúc thư mục) và `export_contest_submissions_details <key> <file>` (CSV từng test: username, bài, bài nộp, test, điểm, thời gian, bộ nhớ, phản hồi).
- **Ai dùng được:** Người sửa kỳ thi, sau khi kỳ thi kết thúc.
- **Mã nguồn:** `judge/views/contests.py:1633-1735`, `judge/forms.py:361-388`, `judge/tasks/contest.py:92-150`, `judge/management/commands/export_contest_submissions.py`, `judge/management/commands/export_contest_submissions_details.py`, `dmoj/settings.py:269-273`, trang `contest_prepare_data`, `contest_download_data`

### KT-50. Kiểm tra đạo văn bằng MOSS
- **Làm gì:** Gửi mã nguồn lên dịch vụ MOSS (Stanford) để tìm bài giống nhau.
- **Cách VNOJ làm:**
  - Cần `MOSS_API_KEY` (mặc định `None` = tắt); máy chủ `MOSS_HOST` = `moss.stanford.edu`, cổng `MOSS_PORT` = 7690.
  - Trang `contest_moss`: bấm chạy thì tác vụ nền xóa kết quả cũ, rồi với mỗi bài × 5 ngôn ngữ (C, C++, Java, Python, Pascal; khớp theo `common_name` của ngôn ngữ) gửi một file mỗi người (bài điểm cao nhất), lấy từ lượt chính thức và lượt theo dõi.
  - Cần ít nhất 2 người cho một cặp bài–ngôn ngữ. `matching_file_limit` = 100.
  - Kết quả lưu `ContestMoss`: bài, ngôn ngữ, số bài nộp, link kết quả. Trang hiện bảng bài × ngôn ngữ. `contest_moss_delete` xóa kết quả.
- **Ai dùng được:** Có `judge.moss_contest` và sửa được kỳ thi.
- **Mã nguồn:** `judge/models/contest.py:827-845`, `judge/views/contests.py:1426-1477`, `judge/tasks/contest.py:39-89`, `dmoj/settings.py:813-815`, trang `contest_moss`, `contest_moss_delete`

### KT-51. Trang bóng bay (balloons)
- **Làm gì:** Danh sách để tình nguyện viên mang bóng bay tới đội vừa giải được bài (kiểu ICPC tại chỗ).
- **Cách VNOJ làm:**
  - Trang `contest_balloons`, tab chỉ hiện với thể thức ICPC.
  - Liệt kê bài AC đầu tiên của mỗi người cho mỗi bài, sắp theo lúc chấm xong, chỉ tính bài nộp trước mốc đóng băng (hoặc trước giờ kết thúc nếu không đóng băng).
  - Cột: số thứ tự, mã bài nộp, đội, bài, màu bóng. Màu lấy từ `VNOJ_BALLOON_COLORS` (ánh xạ mã bài → tên màu, mặc định `{}` = ẩn cột màu).
  - Tham số `?balloons_done=N` bỏ qua N dòng đầu đã phát.
- **Ai dùng được:** Người sửa kỳ thi hoặc có `judge.view_contest_balloons`.
- **Mã nguồn:** `judge/views/contests.py:1280-1318`, `templates/contest/balloons.html`, `dmoj/settings.py:62-65`, trang `contest_balloons`

### KT-52. Công khai bài và gán nguồn bài sau kỳ thi
- **Làm gì:** Hai nút trên trang kỳ thi để đưa bài vào kho luyện tập.
- **Cách VNOJ làm:**
  - "Make All Problems Public" (`contest_problems_make_public`): mỗi bài riêng tư được đặt công khai, ngày đăng = bây giờ, rồi tính lại điểm bài. Bài riêng tư mà người bấm không sửa được thì dừng với lỗi. Với bài người bấm sửa được, lời giải chưa công khai cũng được công khai ngay.
  - "Set Problems Source" (`contest_problems_set_source`): mọi bài trong kỳ thi có nguồn trống được đặt nguồn `c:<key>`.
- **Ai dùng được:** Công khai: người sửa kỳ thi (cần thêm quyền sửa bài riêng tư). Gán nguồn: chỉ superuser.
- **Mã nguồn:** `judge/views/contests.py:1738-1788`, `templates/contest/contest.html:193-208`, trang `contest_problems_make_public`, `contest_problems_set_source`

### KT-53. Chấm lại, tính lại điểm theo kỳ thi
- **Làm gì:** Công cụ admin để sửa kết quả sau khi đổi test hoặc cấu hình.
- **Cách VNOJ làm:**
  - Trong bảng bài của admin kỳ thi: "Rejudge" chấm lại mọi bài nộp trong kỳ thi của một bài (bỏ qua bài đã khóa, KT-22); "Rescore" tính lại điểm kỳ thi từ kết quả có sẵn, không chạy lại.
  - Tác vụ nền `rescore_contest` tính lại mọi lượt tham gia; tự chạy khi đổi thể thức, cấu hình, đóng băng hoặc danh sách bài.
  - Admin lượt tham gia có thao tác "Recalculate results" cho các lượt được chọn.
  - Xóa một bài nộp trong kỳ thi thì lượt tham gia được tính lại.
  - Cơ chế chấm lại chung: xem 03.
- **Ai dùng được:** Nhân viên sửa được kỳ thi.
- **Mã nguồn:** `judge/admin/contest.py:315-343`, `judge/admin/contest.py:416-424`, `judge/tasks/contest.py:24-36`, `judge/signals.py:145-149`

## Rating

### KT-54. Thuật toán rating
- **Làm gì:** Tính điểm năng lực (rating) của thí sinh sau mỗi kỳ thi có tính rating.
- **Cách VNOJ làm:**
  - Thuật toán kế thừa từ DMOJ, dựa trên Elo-MMR (mô hình xác suất thắng/thua giữa từng cặp thí sinh, dùng hàm tanh).
  - Đầu vào cho mỗi thí sinh: thứ hạng trong kỳ thi, "mean" cũ (rating thô, người mới = 1500), số kỳ thi đã được tính, danh sách "performance" (sức thi) của các kỳ trước.
  - Thứ hạng: sắp theo (điểm, `cumtime`, `tiebreaker`). Người bằng nhau nhận hạng trung bình (ví dụ hai người cùng hạng 2 và 3 thì cả hai là 2,5). Hòa được tính là nửa thắng.
  - Bước 1, tính performance của kỳ này: tìm giá trị sao cho số trận "thắng" dự đoán bằng số người thực sự đứng dưới trừ số người đứng trên, có trọng số theo độ bất định của từng đối thủ. Giải bằng chia đôi trong khoảng 1500 ± 20 × SD_INIT (khoảng −4695 đến 7695).
  - Bước 2, tính mean mới: kết hợp performance mới với các performance cũ; kỳ càng cũ trọng số càng giảm.
  - Bước 3, rating hiển thị = mean − (độ lệch chuẩn sau kỳ này − SD_LIM), làm tròn, tối thiểu 1. Người mới bị trừ nhiều hơn để khuyến khích thi tiếp: khoảng 99 điểm sau kỳ đầu, 62 sau kỳ 2, 42 sau kỳ 3, 14 sau kỳ 6, 3 sau kỳ 11.
  - Hằng số: `BETA2` = 328,33²; `MEAN_INIT` = 1500; `VAR_INIT` = 200² × BETA2/212² (độ lệch ≈ 309,7); `VAR_PER_CONTEST` = 1219,047619 × BETA2/212² (độ lệch ≈ 54,1, độ bất định cộng thêm mỗi kỳ); `SD_LIM` ≈ 127,9 (giới hạn độ lệch khi thi rất nhiều); `RATING_INIT` = 1200 (chỉ dùng để so với sàn/trần cho người mới).
  - Kỳ thi chỉ có 0 hoặc 1 người được tính thì mean giữ nguyên.
  - Đầu ra lưu vào bảng `Rating` (mỗi người mỗi kỳ một dòng): `user`, `contest`, `participation` (một-một), `rank`, `rating`, `mean` (rating thô), `performance`, `last_rated`. `rank` là cột số nguyên trong khi hạng hòa có thể là x,5 (chưa kiểm tra cách CSDL làm tròn).
  - Sau khi tính, `Profile.rating` của mọi người đã thi chính thức kỳ đó được đặt bằng rating của kỳ gần nhất của họ.
- **Ai dùng được:** Chạy bởi người có `judge.contest_rating` (KT-56).
- **Mã nguồn:** `judge/ratings.py:11-190`, `judge/models/contest.py:810-824`

### KT-55. Điều kiện được tính rating
- **Làm gì:** Chọn kỳ thi nào và ai được tính rating.
- **Cách VNOJ làm:**
  - `is_rated` (mặc định tắt): kỳ thi có thể tính rating.
  - Chỉ lượt thi chính thức (`virtual = 0`); lượt ảo và lượt theo dõi không tính.
  - `rate_all` (mặc định tắt): tắt thì chỉ tính người có ít nhất 1 bài nộp; bật thì tính cả người vào thi mà không nộp.
  - `rate_exclude`: danh sách người không tính (chỉ chọn được người đã tham gia).
  - `rate_disqualified` (mặc định **bật**): vẫn tính người bị truất quyền (họ đứng cuối vì điểm −9999). Tắt thì bỏ họ ra.
  - `rating_floor` / `rating_ceiling`: bỏ người có rating gần nhất thấp hơn sàn / cao hơn trần. Người chưa có rating được coi là 1200.
  - Khối tóm tắt trên trang kỳ thi diễn giải các điều kiện này bằng lời (KT-17).
- **Ai dùng được:** Admin. `is_rated`, `rate_all`, `rate_exclude` cần `judge.contest_rating`; `rate_disqualified`, sàn, trần chỉ cần quyền sửa kỳ thi trong admin.
- **Mã nguồn:** `judge/models/contest.py:105-106`, `judge/models/contest.py:125-136`, `judge/ratings.py:145-162`, `judge/admin/contest.py:201-202`

### KT-56. Chạy tính rating
- **Làm gì:** Kích hoạt việc tính rating.
- **Cách VNOJ làm:**
  - Không tự chạy khi kỳ thi kết thúc. Phải bấm tay.
  - Nút "Rate" trong admin (chỉ hiện với kỳ thi `is_rated` đã kết thúc): xóa rating của mọi kỳ thi kết thúc từ giờ kết thúc của kỳ này đến hiện tại, rồi tính lại lần lượt mọi kỳ thi có tính rating trong khoảng đó theo thứ tự thời gian. Nghĩa là tính lại một kỳ cũ sẽ tính lại cả các kỳ sau nó.
  - Nút "Rate all ratable contests" ở danh sách admin: xóa sạch bảng `Rating`, đặt mọi `Profile.rating = None`, tính lại mọi kỳ thi có tính rating đã kết thúc theo thứ tự.
  - Tự chạy lại khi truất quyền hoặc bỏ truất quyền trong kỳ thi đã có rating (KT-46).
  - Kỳ thi đã có rating thì không xóa được trên site (KT-12).
- **Ai dùng được:** Quyền `judge.contest_rating`.
- **Mã nguồn:** `judge/models/contest.py:594-600`, `judge/admin/contest.py:354-375`, `templates/admin/judge/contest/change_form.html:28-34`, `templates/admin/judge/contest/change_list.html`

### KT-57. Hiển thị rating và hạng hiển thị
- **Làm gì:** Cho thấy rating của người dùng bằng số, màu, tên bậc và biểu đồ.
- **Cách VNOJ làm:**
  - Bậc rating (`RATING_VALUES`, `RATING_LEVELS`): Newbie (< 1200), Pupil (1200–1399), Specialist (1400–1599), Expert (1600–1899), Candidate Master (1900–2199), Master (2200–2299), International Master (2300–2399), Grandmaster (2400–2599), International Grandmaster (2600–2899), Legendary Grandmaster (≥ 2900). Mỗi bậc có lớp CSS màu `rate-…`; người chưa có rating dùng `rate-none` và tên "Unrated".
  - Tên người dùng khắp site tô màu theo bậc khi `DMOJ_RATING_COLORS = True` (mặc định). Biểu tượng hình hộp nhỏ cạnh rating được tô theo tiến độ trong bậc.
  - Trang cá nhân (`user_page`): rating hiện tại, hạng theo rating, rating thấp nhất, cao nhất, số kỳ thi đã thi; biểu đồ rating theo thời gian, mỗi điểm có tên kỳ thi, rating, thứ hạng và link tới bảng xếp hạng kỳ đó.
  - Bảng xếp hạng người dùng (`user_list`) mặc định sắp theo rating giảm dần, 100 người mỗi trang; `user_ranking_redirect` (`?handle=`) nhảy tới trang có người đó.
  - Bảng xếp hạng kỳ thi có cột rating của người đó trong kỳ thi này khi kỳ thi đã được tính.
  - "Hạng hiển thị" (`display_rank`) là vai trò, không phải ngưỡng rating. `VNOJ_DISPLAY_RANKS` gồm: `user` (Normal User, mặc định), `setter` (Problem Setter), `daor` (Bedao Team), `staff` (Staff), `banned` (Banned User), `admin` (Admin), `teacher` (Teacher). Lớp CSS của tên người dùng = `rating <lớp bậc rating> <display_rank>`.
- **Ai dùng được:** Mọi người xem.
- **Mã nguồn:** `judge/ratings.py:193-219`, `judge/models/profile.py:270-271`, `judge/models/profile.py:531-539`, `judge/jinja2/rating.py`, `judge/views/user.py:128-146`, `judge/views/user.py:190-205`, `judge/views/user.py:580-588`, `judge/views/user.py:666-678`, `dmoj/settings.py:101-109`, `dmoj/settings.py:248`, trang `user_page`, `user_list`, `user_ranking_redirect`

## Tích hợp

### KT-58. API đồng bộ kỳ thi (v2 sync)
- **Làm gì:** API JSON chỉ đọc để hệ thống ngoài (ví dụ bảng điểm trình chiếu) lấy dữ liệu kỳ thi.
- **Cách VNOJ làm:**
  - Tắt mặc định: `VNOJ_ENABLE_SYNC_API = False`. Khi tắt, các URL không tồn tại.
  - Xác thực bằng một khóa chung `GLOBAL_API_KEY` (giá trị mẫu trong settings là `test-api-key-123`), gửi qua header `X-Global-API-Key` hoặc tham số `?global_api_key=`. Không kiểm tra quyền xem kỳ thi; có khóa là đọc được mọi kỳ thi.
  - `GET /api/v2/sync/contest/<key>` (`api_contest_sync_detail`): `code`, `start_time`, `end_time`, `frozen_at` (mốc đóng băng, hoặc `null`).
  - `…/problems` (`api_contest_sync_problems`): danh sách `{code, contest}` theo thứ tự bài.
  - `…/participants` (`api_contest_sync_participants`): danh sách `{user, contest, rank}`. Chỉ lượt chính thức, bỏ người bị truất quyền. Hạng kiểu "1, 1, 3" theo (điểm, `cumtime`, `tiebreaker`). Dùng số liệu đóng băng khi đang đóng băng.
  - `…/submissions` (`api_contest_sync_submissions`): bắt buộc `from_timestamp` (ISO 8601, thiếu múi giờ thì coi là UTC); `limit` mặc định và tối đa 2000; `status` = `final` (mặc định, bỏ bài đang chấm) hoặc `all`. Trả bài nộp có `judged_date ≥ from_timestamp`, sắp theo lúc chấm xong: `id`, `submittedAt`, `judgedAt`, `author`, `submissionStatus` (kết quả, hoặc trạng thái nếu chưa có), `contest_code`, `problem_code`. Endpoint này không lọc theo đóng băng.
  - Lỗi trả JSON `{error: {code, message}}` với mã 400, 403 ("api key required" hoặc "permission denied"), 404.
- **Ai dùng được:** Ai giữ khóa API chung.
- **Mã nguồn:** `judge/views/api/api_v2.py:13-212`, `dmoj/urls.py:471-495`, `dmoj/settings.py:57-58`

### KT-59. Chế độ kỳ thi chính thức
- **Làm gì:** Một công tắc toàn site để chạy site như máy chủ thi tập trung (không phải luyện tập).
- **Cách VNOJ làm:** `VNOJ_OFFICIAL_CONTEST_MODE` (mặc định `False`). Khi bật, các chỗ sau đổi hành vi (đã grep toàn bộ):
  - Kỳ thi tạo mới luôn bật `push_announcements` và `disallow_virtual`.
  - Người dùng không sửa được phần giới thiệu (`about`, vì có thể giấu lời giải ở đó), huy hiệu, tổ chức và họ tên trong hồ sơ.
  - Không bắt đổi mật khẩu khi mật khẩu bị phát hiện đã lộ.
  - Ảnh đại diện Gravatar thay bằng biểu tượng tĩnh để tránh gọi ra ngoài.
  - Mỗi lần nộp bài ghi tên đăng nhập và IP vào log `judge.user_submit_ip_logger`.
  - Không ai tạo bài blog; chỉ superuser sửa bài blog.
  - Không rời tổ chức được.
  - Người dùng không tự hủy bài nộp đang chấm (cần `abort_any_submission`).
  - Danh sách bình luận bị ẩn với người không phải superuser.
  - Bỏ hộp xác nhận "đồng hồ sẽ chạy" khi bấm vào thi.
  - Trên bảng xếp hạng, huy hiệu hiện cạnh tên tổ chức thay vì cạnh tên người.
- **Ai dùng được:** Người quản trị máy chủ (cấu hình).
- **Mã nguồn:** `dmoj/settings.py:60`, `judge/views/contests.py:1531-1533`, `judge/forms.py:69-75`, `judge/forms.py:125-127`, `judge/middleware.py:46-69`, `judge/jinja2/gravatar.py:15-17`, `judge/views/problem.py:437-445`, `judge/views/blog.py:391`, `judge/views/blog.py:431`, `judge/views/organization.py:300-302`, `judge/views/submission.py:330`, `templates/comments/list.html:1`, `templates/contest/list.html:22`, `templates/contest/media-js.html:8`, `templates/contest/ranking.html:70`, `resources/contest-ranking.js:482`

### KT-60. Kỳ thi của tổ chức
- **Làm gì:** Tổ chức tự tạo kỳ thi chỉ cho thành viên.
- **Cách VNOJ làm:**
  - Trang tạo riêng của tổ chức (`contest_create_organization`): dùng form KT-11, `key` gợi ý sẵn và bắt buộc bắt đầu bằng `<slug tổ chức chỉ giữ chữ số>_`. Kỳ thi tự đặt `is_organization_private = True` và gắn tổ chức.
  - Danh sách kỳ thi của tổ chức: `contest_list_organization`.
  - Kỳ thi của tổ chức không tính vào số lần truất quyền để tự khóa tài khoản (KT-46).
  - Chi tiết tổ chức, quyền quản trị tổ chức, hạn mức: xem 07.
- **Ai dùng được:** Quản trị viên tổ chức có `judge.create_private_contest`.
- **Mã nguồn:** `judge/views/organization.py:921-935`, `judge/views/organization.py:1024-1046`, `judge/forms.py:858-867`, trang `contest_create_organization`, `contest_list_organization`
