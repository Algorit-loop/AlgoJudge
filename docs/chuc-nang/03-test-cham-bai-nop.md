# 03. Test, chấm bài và bài nộp

Nguồn: `VNOI-Admin/OJ` commit `209a32e` (04/11/2026), thư mục `reference/vnoj-src/site/`; máy chấm `VNOI-Admin/judge-server` commit `23759617` (10/10/2026). Phần này nằm chủ yếu ở trang sửa test (`judge/views/problem_data.py`, `judge/utils/problem_data.py`), cầu nối máy chấm (`judge/bridge/`, `judge/judgeapi.py`), trang nộp bài (`judge/views/problem.py`) và các trang bài nộp (`judge/views/submission.py`, `templates/submission/`).

## Bảng quyết định

| Mã | Chức năng | Quyết định | Ghi chú |
|---|---|---|---|
| CB-01 | Trang sửa dữ liệu test và quyền vào | | |
| CB-02 | Tải lên file zip test | | |
| CB-03 | Tạo file zip ngay trên trình duyệt | | |
| CB-04 | Tự điền bảng test theo tên file | | |
| CB-05 | Bảng test: thêm, xóa, kéo thả, loại dòng C/S/E | | |
| CB-06 | Nhóm test (batch) và phụ thuộc giữa các nhóm | | |
| CB-07 | Điểm từng test và kiểm tra tổng điểm | | |
| CB-08 | Pretest | | |
| CB-09 | Giới hạn số test (mềm/cứng) | | |
| CB-10 | Sinh `init.yml`, báo lỗi, xem YAML | | |
| CB-11 | Checker có sẵn và tham số | | |
| CB-12 | Checker tự viết (6 kiểu) | | |
| CB-13 | Grader: chuẩn, tương tác, hàm (IOI), chỉ nộp output | | |
| CB-14 | Đọc/ghi qua file thay cho stdin/stdout | | |
| CB-15 | Giới hạn độ dài output, prefix output, hint `unicode`/`nobigmath` | | |
| CB-16 | Generator (sinh test khi chấm) | | |
| CB-17 | Xem/tải file test trên web, tải gói bài | | |
| CB-18 | Cho thí sinh xem nội dung test | | |
| CB-19 | Bảng so sánh bài nộp theo từng test | | |
| CB-20 | Kho lưu dữ liệu test (storage, namespace, lưu trữ lạnh) | | |
| CB-21 | Danh mục ngôn ngữ (Language) | | |
| CB-22 | Ngôn ngữ cho phép và giới hạn riêng theo ngôn ngữ | | |
| CB-23 | Trang Runtimes và ma trận phiên bản | | |
| CB-24 | Quản lý máy chấm (Judge) | | |
| CB-25 | Trang trạng thái máy chấm | | |
| CB-26 | Bridge và Judge API | | |
| CB-27 | Hàng đợi, độ ưu tiên, tier, giữ máy, máy bị cấm | | |
| CB-28 | Cảnh báo hàng đợi dài và thống kê thời gian chờ | | |
| CB-29 | Balancer (một cụm máy chấm cho nhiều site) | | |
| CB-30 | Form nộp bài | | |
| CB-31 | Nộp lại (resubmit) | | |
| CB-32 | Các kiểm tra khi nộp | | |
| CB-33 | Mô hình bài nộp, trạng thái và mã kết quả | | |
| CB-34 | Kết quả từng test và cách gộp kết quả | | |
| CB-35 | Trang kết quả bài nộp | | |
| CB-36 | Mức hiển thị kết quả test và feedback | | |
| CB-37 | Xử lý lỗi nội bộ (IE) | | |
| CB-38 | Xem mã nguồn, bản raw, tải file và quyền xem | | |
| CB-39 | So sánh mã nguồn hai bài nộp | | |
| CB-40 | Hủy chấm (abort) | | |
| CB-41 | Chấm lại một hoặc vài bài | | |
| CB-42 | Chấm lại hàng loạt theo bài (có xem trước) và tính lại điểm | | |
| CB-43 | Danh sách bài nộp và bộ lọc | | |
| CB-44 | Bài nộp tốt nhất (ranked) | | |
| CB-45 | Cập nhật thời gian thực (event daemon) | | |
| CB-46 | Khóa bài nộp (`locked_after`) | | |

## Chi tiết

## Test

### CB-01. Trang sửa dữ liệu test và quyền vào
- **Làm gì:** Một trang riêng cho mỗi bài để tải test, khai báo các test, chọn checker và grader.
- **Cách VNOJ làm:**
  - URL `/problem/<code>/test_data`. Cần đăng nhập.
  - Chỉ superuser hoặc người sửa được bài (`is_editable_by`) vào được. Người khác nhận 404.
  - Nếu bài bật `is_manually_managed` (dữ liệu do quản trị đặt tay trên máy chấm) thì trang trả 404. Đổi cờ này cần quyền `change_manually_managed`.
  - Nếu dữ liệu bài đã chuyển sang lưu trữ lạnh (`archived_at` có giá trị) thì không sửa được. Admin tổ chức được chuyển tới trang khôi phục; người khác thấy trang thông báo.
  - Một form gồm hai phần: phần dữ liệu chung (`ProblemDataForm`) và bảng test (`ProblemCaseFormSet`). Bấm Lưu một lần cho cả hai.
  - Bài thuộc tổ chức riêng có kiểm tra hạn mức dung lượng; cảnh báo hiện ở đầu trang. Chặn tải lên chỉ khi `VNOJ_QUOTA_ENFORCEMENT_ENABLED = True` (mặc định `False`). Chi tiết hạn mức tổ chức nằm ở phần tổ chức.
  - Setting `DATA_UPLOAD_MAX_NUMBER_FIELDS = 3000` được nâng để form nhiều test không bị Django chặn.
- **Ai dùng được:** Người sửa được bài (quyền `judge.edit_own_problem` cộng là tác giả/curator, hoặc `judge.edit_all_problem`, hoặc `judge.edit_public_problem` với bài công khai); superuser.
- **Mã nguồn:** `judge/views/problem_data.py:130-137`, `judge/views/problem_data.py:195-230`, `judge/views/problem_data.py:291-318`, `judge/models/problem.py:303-312`, `dmoj/settings.py:194`, trang `problem_data`

### CB-02. Tải lên file zip test
- **Làm gì:** Người ra đề tải một file zip chứa toàn bộ file input/output.
- **Cách VNOJ làm:**
  - Trường `ProblemData.zipfile`. File lưu ở `<mã bài>/<tên file>` trong kho dữ liệu test.
  - Server mở zip và gọi `testzip()`. Zip hỏng thì báo "Your zip file is invalid!" kèm lỗi.
  - Danh sách file hợp lệ là mọi mục trong zip trừ thư mục.
  - Trình duyệt chặn file trên 100 MB (giới hạn thân request của Cloudflare). Trình duyệt bỏ qua `.DS_Store`, file bắt đầu bằng `._` và thư mục `__MACOSX/` khi đọc danh sách file.
  - Khi có file đính kèm, form gửi bằng XHR và hiện thanh tiến trình phần trăm.
  - Ô "Clear" của zip sẽ tự đánh dấu xóa toàn bộ test trong bảng.
  - Kích thước dữ liệu được ghi vào `zipfile_size` (tổng zip, generator, checker, grader, header) mỗi lần lưu.
- **Ai dùng được:** Như CB-01.
- **Mã nguồn:** `judge/models/problem_data.py:57-58`, `judge/models/problem_data.py:93-120`, `judge/views/problem_data.py:69-73`, `judge/views/problem_data.py:249-265`, `templates/problem/data.html:383-422`, `templates/problem/data.html:624-656`, trang `problem_data`

### CB-03. Tạo file zip ngay trên trình duyệt
- **Làm gì:** Người ra đề chọn nhiều file hoặc cả thư mục, trình duyệt nén thành zip rồi gắn vào ô tải lên.
- **Cách VNOJ làm:**
  - Link "or click here to build zip file" mở hộp thoại "Build Test Data".
  - Có nút chọn file, nút chọn thư mục và vùng kéo thả. Hộp thoại liệt kê tối đa 50 file, phần còn lại ghi "... and N more files".
  - Ô chọn file gợi ý đuôi `.in,.inp,.out,.ok,.ans,.a,.txt`.
  - Nén bằng JSZip, DEFLATE mức 9, tên `tests.zip`. Sau đó chạy tiếp bước tự điền bảng (CB-04).
- **Ai dùng được:** Như CB-01.
- **Mã nguồn:** `templates/problem/data.html:263-269`, `templates/problem/data.html:658-830`, `templates/problem/data.html:1201-1229`, trang `problem_data`

### CB-04. Tự điền bảng test theo tên file
- **Làm gì:** Đọc tên file trong zip và tự tạo các dòng test với cặp input/output.
- **Cách VNOJ làm:**
  - Chạy khi chọn zip mới, hoặc khi mở trang mà bảng đang rỗng và zip có file.
  - Nhận ba kiểu tên: Themis (`*.inp`, `*.in` / `*.out`, `*.ok`, `*.ans`, `*.ou`), CMS (`input.X` / `output.X`), Polygon (`01` / `01.a`). Mọi file phải cùng một kiểu, nếu không báo "Files are not in the same format!".
  - Số file input phải bằng số file output. Sắp xếp theo thứ tự tự nhiên (natsort).
  - Điểm điền sẵn: bài cho điểm từng phần thì mỗi test 1 điểm; bài không cho điểm từng phần thì chỉ test cuối 1 điểm, còn lại 0.
  - Chỉ điền tối đa bằng giới hạn số test (CB-09) và báo phần bị cắt.
  - Kết quả chưa được lưu; trang hiện thông báo yêu cầu bấm lưu.
  - Khi chọn tay một file input, ô output tự điền tên tương ứng (thay `in` cuối cùng bằng `out`), và ngược lại.
- **Ai dùng được:** Như CB-01.
- **Mã nguồn:** `templates/problem/data.html:15-52`, `templates/problem/data.html:497-588`, `templates/problem/data.html:620-622`, trang `problem_data`

### CB-05. Bảng test: thêm, xóa, kéo thả, loại dòng C/S/E
- **Làm gì:** Danh sách có thứ tự các dòng test mà người ra đề sửa trực tiếp.
- **Cách VNOJ làm:**
  - Mỗi dòng là một `ProblemTestCase`: `order`, `type`, `input_file`, `output_file`, `points`, `is_pretest`, `batch_dependencies`. Model còn có `generator_args`, `output_prefix`, `output_limit`, `checker`, `checker_args` theo từng dòng nhưng các cột này không hiện trên bảng (cột generator args bị comment trong template).
  - Ba loại dòng: `C` (test thường), `S` (bắt đầu nhóm), `E` (kết thúc nhóm).
  - Ô input/output là danh sách chọn từ file có trong zip. File không có trong zip được tô đỏ (`bad-file`).
  - Có nút thêm dòng ở đầu, thêm dòng ngay dưới một dòng, kéo thả để đổi thứ tự, ô xóa từng dòng và ô "xóa tất cả".
  - Dòng để trống hoàn toàn bị bỏ khi lưu.
- **Ai dùng được:** Như CB-01. Cột Pretest chỉ hiện với `is_staff`.
- **Mã nguồn:** `judge/models/problem_data.py:138-158`, `judge/views/problem_data.py:97-127`, `templates/problem/data.html:288-372`, `templates/problem/data.html:424-495`, `templates/problem/data.html:1125-1196`, trang `problem_data`

### CB-06. Nhóm test (batch) và phụ thuộc giữa các nhóm
- **Làm gì:** Gom nhiều test thành một nhóm (subtask). Nhóm chỉ được điểm khi mọi test trong nhóm đều đúng.
- **Cách VNOJ làm:**
  - Dòng `S` mở nhóm, các dòng `C` sau đó thuộc nhóm, dòng `E` đóng nhóm. Gặp `S` mới khi chưa đóng thì nhóm cũ tự đóng.
  - Điểm đặt trên dòng `S`. Điểm của các dòng `C` trong nhóm bị xóa.
  - Nhóm rỗng báo "Empty batches not allowed." `E` ngoài nhóm báo lỗi.
  - Phụ thuộc (`batch_dependencies`): danh sách số thứ tự nhóm, cách nhau bằng dấu phẩy, chỉ được trỏ tới nhóm đứng trước và phải ≥ 1. Cột này chỉ hiện khi bảng có ít nhất một dòng `S`.
  - Không cho dùng phụ thuộc khi có nhóm là pretest, vì máy chấm đánh số nhóm pretest khác nhau giữa lúc kiểm tra và lúc chấm.
  - Khi chấm, điểm nhóm = điểm nhỏ nhất trong các test của nhóm (xem CB-34).
- **Ai dùng được:** Như CB-01.
- **Mã nguồn:** `judge/utils/problem_data.py:52-55`, `judge/utils/problem_data.py:183-245`, `templates/problem/data.html:282-286`, trang `problem_data`

### CB-07. Điểm từng test và kiểm tra tổng điểm
- **Làm gì:** Mỗi test hoặc nhóm có một số điểm nguyên. Điểm bài nộp tính theo tỉ lệ điểm đạt trên tổng.
- **Cách VNOJ làm:**
  - `points` là số nguyên. Test thường ngoài nhóm bắt buộc có điểm, nếu thiếu báo "Points must be defined for non-batch case #N." Dòng `S` bắt buộc có điểm.
  - Tổng điểm phải > 0, nếu không báo "Total points must be greater than 0."
  - Cách quy đổi sang điểm bài: xem CB-34; điểm người dùng xem 05.
- **Ai dùng được:** Như CB-01.
- **Mã nguồn:** `judge/utils/problem_data.py:144-170`, `judge/utils/problem_data.py:187-188`, `judge/utils/problem_data.py:236-237`, trang `problem_data`

### CB-08. Pretest
- **Làm gì:** Đánh dấu một số test là pretest. Trong kỳ thi có thể chỉ chấm pretest trong giờ thi.
- **Cách VNOJ làm:**
  - Cờ `is_pretest` trên dòng `C` ngoài nhóm hoặc trên dòng `S`. Test trong nhóm lấy theo cờ của nhóm.
  - `init.yml` tách thành `pretest_test_cases` và `test_cases`.
  - Ô Pretest chỉ hiện với `is_staff`; người khác gửi giá trị ẩn giữ nguyên.
  - Bài nộp có cờ `is_pretested`. Khi gửi chấm, cờ này lấy từ cài đặt kỳ thi `run_pretests_only` và `ContestProblem.is_pretested` (xem 04). Máy chấm báo lại cờ thực tế ở gói `grading-begin`.
  - Trang kết quả ghi "Pretest #N", "Pretest Execution Results", "Final pretest score" và câu nhắc "Passing pretests does not guarantee a full score on system tests."
- **Ai dùng được:** Đặt cờ: người sửa bài có `is_staff`.
- **Mã nguồn:** `judge/models/problem_data.py:151`, `judge/utils/problem_data.py:264-279`, `judge/judgeapi.py:61-69`, `judge/bridge/judge_handler.py:361-363`, `templates/problem/data.html:1150-1177`, `templates/submission/status-testcases.html:41-45`, `templates/submission/status-testcases.html:176-196`

### CB-09. Giới hạn số test (mềm/cứng)
- **Làm gì:** Hạn chế số dòng test một bài để tránh dữ liệu quá lớn.
- **Cách VNOJ làm:**
  - `VNOJ_TESTCASE_SOFT_LIMIT = 50`: vượt mức này trình duyệt cảnh báo một lần.
  - `VNOJ_TESTCASE_HARD_LIMIT = 100`: trình duyệt không cho thêm dòng; server từ chối lưu với lỗi "Too many testcases".
  - Người có quyền `judge.create_mass_testcases` được nâng cả hai mức lên 9999 ở trình duyệt và không bị server kiểm tra.
- **Ai dùng được:** Mọi người sửa bài; quyền `create_mass_testcases` để vượt giới hạn.
- **Mã nguồn:** `dmoj/settings.py:120-125`, `judge/views/problem_data.py:277-282`, `judge/views/problem_data.py:294-302`, `templates/problem/data.html:427-445`

### CB-10. Sinh `init.yml`, báo lỗi, xem YAML
- **Làm gì:** Từ form, site tự sinh file cấu hình `init.yml` mà máy chấm đọc. Lỗi cấu hình được báo ngay trên trang.
- **Cách VNOJ làm:**
  - Mỗi lần lưu hợp lệ, `ProblemDataCompiler.generate` dựng `init.yml` gồm `archive`, `generator`, `pretest_test_cases`, `test_cases`, `output_limit_length`, `output_prefix_length`, `checker`, `hints` và khóa grader (`file_io`, `interactive`, `signature_grader`, `output_only`).
  - Nếu bảng test rỗng thì không tạo `init.yml` (cố ý, để máy chấm không tự dò test trong zip lớn) và xóa file cũ.
  - Lỗi được lưu vào `ProblemData.feedback` và hiện ở đầu trang dạng danh sách lỗi; `init.yml` cũ bị xóa. Ví dụ lỗi: file input/output không có trong zip, nhóm rỗng, thiếu điểm, phụ thuộc sai, checker sai đuôi, thiếu file input/output khi đọc ghi file.
  - Lưu xong thì xóa cache metadata của zip (CB-20).
  - Có `init.yml` thì tiêu đề trang có link "View YAML" tới `/problem/<code>/test_data/init`, hiển thị YAML có tô màu.
  - Không có `init.yml` (và bài không quản lý tay) thì trang nộp bài ghi "This problem does not have test data." và không cho nộp.
- **Ai dùng được:** Như CB-01. Trang YAML: người sửa được bài.
- **Mã nguồn:** `judge/utils/problem_data.py:29-328`, `judge/views/problem_data.py:332`, `judge/views/problem_data.py:371-389`, `templates/problem/data.html:1092-1104`, `judge/views/problem.py:331-335`, `templates/problem/submit-form.html:84-85`, trang `problem_data_init`

### CB-11. Checker có sẵn và tham số
- **Làm gì:** Chọn chương trình so kết quả (checker: chương trình so output của thí sinh với đáp án) cho cả bài.
- **Cách VNOJ làm:**
  - Danh sách `CHECKERS`: `standard` (mặc định, bỏ qua khác biệt khoảng trắng), `floats`, `floatsabs` (sai số tuyệt đối), `floatsrel` (sai số tương đối), `identical` (giống từng byte), `linecount` (so từng dòng), `bridged` (checker tự viết, CB-12).
  - Với nhóm `floats*`, trang hiện ô "precision" (số chữ số thập phân), mặc định 6, ghi vào `checker_args` dạng `{"precision": N}`.
  - `checker_args` là JSON object; server kiểm tra phải là object hợp lệ.
  - Model cho phép checker và tham số riêng từng test/nhóm, nhưng bảng test không có ô sửa (CB-05).
  - Máy chấm còn có checker `easy`, `linematches`, `rstripped`, `sorted`, `unordered` nhưng site không đưa vào danh sách chọn.
- **Ai dùng được:** Như CB-01.
- **Mã nguồn:** `judge/models/problem_data.py:22-30`, `judge/models/problem_data.py:64`, `judge/views/problem_data.py:38-47`, `templates/problem/data.html:90-168`, `judge-server:dmoj/checkers/floats.py:55-62`, `judge-server:dmoj/checkers/`

### CB-12. Checker tự viết (6 kiểu)
- **Làm gì:** Người ra đề tải mã nguồn checker riêng. Máy chấm biên dịch và chạy nó cho từng test.
- **Cách VNOJ làm:**
  - Chọn checker `bridged`, tải `custom_checker` đuôi `cpp`, `pas` hoặc `java`.
  - Trường `checker_type` chọn một trong 6 kiểu (`CUSTOM_CHECKERS`):
    - `themis`: kiểu Themis. Thêm cờ `-DTHEMIS`. Checker đọc từ stdin hai đường dẫn thư mục. Điểm là số thực ở dòng cuối feedback, nhân với điểm test.
    - `testlib`: kiểu testlib. Mã thoát 0 = đúng, 1 = sai, 2 = sai định dạng, 3 = lỗi checker, 7 = điểm một phần với dòng `points X` trên stderr. Có tùy chọn "Treat checker points as percentage" (`X` là phần trăm 0–100).
    - `cms`: kiểu CMS. Thêm cờ `-DCMS`. Tỉ lệ điểm 0–1 in ở stdout.
    - `coci`: kiểu COCI, dựa trên testlib, nhận `partial a/b` trên stderr.
    - `peg`: kiểu PEG, có thể cho điểm một phần qua tỉ lệ hai số.
    - `default`: kiểu DMOJ, tham số `{input_file} {output_file} {answer_file}`, mã thoát 0 đúng, 1 sai.
  - Trình duyệt tự ghi `checker_args` = `{"files": <tên file>, "lang": <ngôn ngữ>, "type": <kiểu>}`. Ngôn ngữ: `CPP20` cho `.cpp`, `JAVA8` cho `.java`, `PAS` cho `.pas`.
  - Server báo lỗi nếu đuôi sai hoặc `checker_args` rỗng.
- **Ai dùng được:** Như CB-01.
- **Mã nguồn:** `judge/models/problem_data.py:44-51`, `judge/models/problem_data.py:71-77`, `judge/views/problem_data.py:67`, `judge/utils/problem_data.py:57-77`, `templates/problem/data.html:116-150`, `judge-server:dmoj/checkers/bridged.py:25-56`, `judge-server:dmoj/contrib/testlib.py:15-76`, `judge-server:dmoj/contrib/themis.py:30-48`, `judge-server:dmoj/contrib/cms.py:13-66`, `judge-server:dmoj/contrib/coci.py:14-53`, `judge-server:dmoj/contrib/peg.py:39-52`, `judge-server:dmoj/contrib/default.py:14-52`

### CB-13. Grader: chuẩn, tương tác, hàm (IOI), chỉ nộp output
- **Làm gì:** Chọn cách chạy bài của thí sinh (grader: phần điều khiển cách chạy và cấp dữ liệu cho bài).
- **Cách VNOJ làm:**
  - `standard` (mặc định): chạy chương trình, cấp input, so output.
  - `interactive`: tải `custom_grader` đuôi `.cpp` làm interactor (chương trình trò chuyện với bài thí sinh). Site luôn ghi `type: testlib`, `lang: CPP20`.
  - `signature` ("Function Signature Grading (IOI-style)"): tải file chạy chính `.cpp` và header `.h`. Thí sinh chỉ viết hàm. `grader_args` có thể bật `allow_main: true` để cho thí sinh tự viết `main`.
  - `output_only`: ghi `output_only: true`. Thí sinh nộp file zip output bằng ngôn ngữ `OUTPUT`; máy chấm tìm file theo tên `out` của từng test, thiếu thì WA, quá `output_limit_length` thì OLE.
  - Trang ẩn/hiện ô theo grader: chỉ `standard` có ô IO method; ô `custom_grader` cho `interactive` và `signature`; ô header và `grader_args` chỉ cho `signature`.
  - `grader_args` là JSON object, server kiểm tra hợp lệ.
- **Ai dùng được:** Như CB-01.
- **Mã nguồn:** `judge/models/problem_data.py:32-37`, `judge/models/problem_data.py:79-92`, `judge/views/problem_data.py:50-59`, `judge/utils/problem_data.py:89-142`, `templates/problem/data.html:171-245`, `judge-server:dmoj/graders/output_only.py:17-60`

### CB-14. Đọc/ghi qua file thay cho stdin/stdout
- **Làm gì:** Bài yêu cầu đọc từ một file và ghi ra một file có tên cố định.
- **Cách VNOJ làm:**
  - Chỉ áp dụng cho grader `standard`. Hai lựa chọn `IO_METHODS`: `standard` (stdin/stdout) và `file`.
  - Khi chọn `file`, phải nhập cả "Input from file" và "Output to file" (tối đa 100 ký tự). Thiếu một trong hai báo "You must specify both input and output files."
  - Giá trị lưu trong `grader_args` (`io_method`, `io_input_file`, `io_output_file`) và sinh khóa `file_io` trong `init.yml`.
  - Thuộc tính `Problem.io_method` đọc lại cấu hình này để hiển thị ở trang đề (xem 02).
- **Ai dùng được:** Như CB-01.
- **Mã nguồn:** `judge/models/problem_data.py:39-42`, `judge/views/problem_data.py:63-66`, `judge/utils/problem_data.py:98-111`, `judge/models/problem.py:588-600`

### CB-15. Giới hạn độ dài output, prefix output, hint `unicode`/`nobigmath`
- **Làm gì:** Các tùy chọn chấm phụ cho cả bài.
- **Cách VNOJ làm:**
  - `output_limit` (byte): có ô trên trang, ghi chú "đặt khi output có thể dài trên 20MB". Sinh `output_limit_length`. Bỏ trống thì máy chấm dùng mặc định 25165824 byte (24 MiB).
  - `output_prefix` (số byte output của thí sinh được giữ lại để hiển thị): có trong model và sinh `output_prefix_length`, nhưng không có ô trên trang. Máy chấm mặc định 128 (0 với grader signature).
  - `unicode` ("enable unicode") và `nobigmath` ("disable bigInteger / bigDecimal"): sinh mục `hints`. Không có ô trên trang; chỉ đặt được ngoài giao diện.
  - Kỳ thi có `output_prefix_override` để cắt phần output hiển thị (xem 04).
- **Ai dùng được:** `output_limit`: như CB-01. Các trường còn lại: không có giao diện (chưa kiểm tra cách đặt khác ngoài shell/DB).
- **Mã nguồn:** `judge/models/problem_data.py:61-67`, `judge/views/problem_data.py:80-94`, `judge/utils/problem_data.py:280-296`, `judge-server:dmoj/problem.py:326-330`

### CB-16. Generator (sinh test khi chấm)
- **Làm gì:** Thay vì lưu file input, máy chấm chạy một chương trình sinh test với tham số cho từng test.
- **Cách VNOJ làm:**
  - Model có `ProblemData.generator` (file) và `ProblemTestCase.generator_args` (mỗi dòng một tham số).
  - Có generator thì không kiểm tra file input/output có trong zip.
  - `init.yml` có khóa `generator` và `generator_args` cho từng test/nhóm.
  - Form không có ô tải generator và cột generator args bị comment, nên không dùng được qua giao diện.
- **Ai dùng được:** Không có giao diện.
- **Mã nguồn:** `judge/models/problem_data.py:59-60`, `judge/models/problem_data.py:149`, `judge/utils/problem_data.py:156-172`, `judge/utils/problem_data.py:258-262`, `judge/views/problem_data.py:80-86`, `templates/problem/data.html:1143`

### CB-17. Xem/tải file test trên web, tải gói bài
- **Làm gì:** Người sửa bài tải lại từng file dữ liệu hoặc cả gói bài.
- **Cách VNOJ làm:**
  - URL `/problem/<code>/data/<path>` trả file dưới dạng `application/octet-stream`. Đường dẫn được chuẩn hóa để không thoát ra ngoài thư mục bài.
  - Kho S3 thì chuyển hướng tới presigned URL. Có `DMOJ_PROBLEM_DATA_INTERNAL` thì dùng X-Accel-Redirect qua nginx.
  - Các ô file trên trang sửa test hiện link tới URL này (qua `ProblemDataStorage.url`).
  - Trang `problem_download_full_package` tạo `<code>_package.zip` gồm `statement.md`, `statement.pdf` (nếu có link PDF), zip test, checker, grader, header. File thiếu thì ghi file `*_error.txt` thay thế.
  - Dữ liệu đã lưu trữ lạnh thì tải qua `problem_download_archived_data` (presigned URL từ dịch vụ lưu trữ).
- **Ai dùng được:** Người sửa được bài, đã đăng nhập.
- **Mã nguồn:** `judge/views/problem_data.py:340-368`, `judge/utils/problem_data_storage.py:141-145`, `judge/views/problem_download.py:21-120`, trang `problem_data_file`, `problem_download_full_package`, `problem_download_archived_data`

### CB-18. Cho thí sinh xem nội dung test
- **Làm gì:** Trên trang kết quả, hiện input và đáp án của từng test cho người được phép.
- **Cách VNOJ làm:**
  - Trường bài `testcase_visibility_mode` (đặt ở trang sửa bài, xem 02): `O` chỉ người sửa bài (mặc định), `C` khi người xem không đang trong kỳ thi, `A` luôn hiện (kể cả khách).
  - Nội dung lấy từ zip, mỗi file tối đa `VNOJ_TESTCASE_VISIBLE_LENGTH = 60` byte, dài hơn thì cắt và thêm `...`.
  - Chỉ đọc các dòng có `input_file`, đánh số theo thứ tự. Chưa hỗ trợ bài quản lý tay và pretest (ghi TODO trong code).
  - Ai xem được test thì cũng thấy output (đã cắt) của bài nộp ở từng test.
  - Kết quả đọc zip được cache vào file JSON nếu có `metadata_dir` (CB-20).
- **Ai dùng được:** Theo chế độ trên; người sửa bài luôn xem được.
- **Mã nguồn:** `judge/models/problem.py:136-140`, `judge/models/problem.py:237-239`, `judge/models/problem.py:367-380`, `judge/utils/problem_data_storage.py:96-127`, `dmoj/settings.py:139`, `judge/views/submission.py:257-261`, `templates/submission/status-testcases.html:85-147`

### CB-19. Bảng so sánh bài nộp theo từng test
- **Làm gì:** Đặt nhiều bài nộp của một bài cạnh nhau, mỗi cột là một test.
- **Cách VNOJ làm:**
  - URL `/problem/<code>/test_data/diff?username=a&username=b` hoặc `?id=1&id=2`.
  - Bỏ bài nộp bằng ngôn ngữ chỉ nộp file. Sắp theo id.
  - Số cột = số dòng `C` của bài; nếu bài không có bảng test thì lấy số test của bài nộp đầu tiên.
  - Ô test đúng hiện thời gian (2 chữ số thập phân), ô khác hiện mã kết quả. Bấm ô để xem output đã cắt của test đó.
  - Chọn hai bài ở cột "1st"/"2nd" rồi bấm để mở so sánh mã nguồn (CB-39). Tham số `highlight` tô sáng một dòng.
  - Mở từ trang kết quả ("Diff this submission"), danh sách bài nộp, hoặc ô chọn người dùng trên trang quản lý bài nộp.
- **Ai dùng được:** Người sửa được bài.
- **Mã nguồn:** `judge/views/problem_data.py:140-187`, `templates/problem/submission-diff.html:20-145`, `templates/problem/manage_submission.html:76-83`, trang `problem_submission_diff`

### CB-20. Kho lưu dữ liệu test (storage, namespace, lưu trữ lạnh)
- **Làm gì:** Cho phép đặt dữ liệu test ở nhiều kho (đĩa hoặc S3). Mỗi bài chọn một kho, chỉ máy chấm có kho đó mới chấm bài đó.
- **Cách VNOJ làm:**
  - Cấu hình bằng file YAML trỏ bởi `DMOJ_STORAGE_CONFIG_PATH`: `default`, `storages` (mỗi kho `backend: filesystem` với `location`, hoặc `backend: s3`), và `metadata_dir` tùy chọn. `DMOJ_PROBLEM_DATA_ROOT` là cách cũ, tạo một kho `local`.
  - Trường bài `storage` (chọn trong admin, mục "Storage"); để trống dùng kho mặc định.
  - `metadata_dir`: cache danh sách file và nội dung test hiển thị vào `<code>_metadata.json`; bị xóa mỗi lần lưu dữ liệu test.
  - Máy chấm (giao thức phiên bản 2) khai báo danh sách kho lúc bắt tay. Site lưu vào `Judge.storages`. Bridge chỉ gửi bài cho máy có kho của bài. Ngôn ngữ dùng được của bài cũng lọc theo máy online có kho đó.
  - Phía máy chấm: `problem_storage_globs` cho namespace mặc định và `storage_namespaces` cho các namespace khác. Balancer gắn `storage-namespace` theo từng bridge (CB-29).
  - Đổi mã bài thì đổi tên thư mục trong kho. Xóa bài thì xóa thư mục.
  - Lưu trữ lạnh: `archived_at` và `archived_size` do dịch vụ ngoài (`VNOJ_PROBLEM_ARCHIVE_SERVICE_URL`) đặt; giữ trong `VNOJ_PROBLEM_ARCHIVE_RETENTION = 180 ngày`. Bài đã lưu trữ không sửa test, không chấm lại.
- **Ai dùng được:** Quản trị cấu hình server; chọn kho cho bài trong admin.
- **Mã nguồn:** `judge/utils/problem_data_storage.py:15-243`, `judge/models/problem.py:264-272`, `judge/models/problem.py:488-493`, `judge/admin/problem.py:20-44`, `judge/bridge/judge_handler.py:174`, `judge/bridge/judge_handler.py:184-186`, `judge/bridge/judge_list.py:203-210`, `judge-server:dmoj/judgeenv.py:216-246`, `dmoj/settings.py:225-228`, `dmoj/settings.py:196-243`

## Ngôn ngữ và máy chấm

### CB-21. Danh mục ngôn ngữ (Language)
- **Làm gì:** Bảng các ngôn ngữ lập trình site biết, khớp với executor của máy chấm.
- **Cách VNOJ làm:**
  - Trường: `key` (tối đa 10 ký tự, trùng id executor của máy chấm, duy nhất), `name` (tên dài, 20), `short_name` (tên ngắn hiển thị, trống thì dùng `key`), `common_name` (tên chung, ví dụ "C++" cho C++11/C++14), `ace` (mode của trình soạn thảo Ace), `pygments` (tên lexer tô màu mã nguồn), `template` (mã mẫu trong ô soạn), `info` (ghi đè thông tin runtime, tối đa 50), `description` (Markdown, ghi chú về môi trường), `extension` (đuôi file), `file_only` (chỉ nộp bằng file), `file_size_limit` (MB, mặc định 0), `include_in_problem` (tự thêm vào mọi bài).
  - `include_in_problem`: khi tạo ngôn ngữ mới trong admin, ngôn ngữ được gắn vào tất cả bài hiện có. Bài mới tạo (trang tạo bài, tổ chức, nhập Polygon) nhận các ngôn ngữ có cờ này.
  - Tên hiển thị khi chọn là `name (info)` nếu có `info`.
  - `common_name` dùng để gộp giới hạn theo ngôn ngữ và hiển thị danh sách ngôn ngữ ở trang đề (cache 86400 giây).
  - Ngôn ngữ mặc định của người dùng mới: `DEFAULT_USER_LANGUAGE = 'CPP20'`; không có thì dùng/tạo `PY3`.
  - Máy chấm hiện có 74 executor (ví dụ `CPP20`, `PY3`, `JAVA8`, `PAS`, `OUTPUT`, `SCRATCH`, `CPPTHEMIS`, `PASTHEMIS`).
  - Quản lý trong Django admin; ô `template` dùng trình soạn Ace.
- **Ai dùng được:** Quản trị qua admin (quyền model `judge.change_language`).
- **Mã nguồn:** `judge/models/runtime.py:18-121`, `judge/admin/runtime.py:18-43`, `dmoj/settings.py:343`, `judge/models/problem.py:542-562`, `judge-server:dmoj/executors/`

### CB-22. Ngôn ngữ cho phép và giới hạn riêng theo ngôn ngữ
- **Làm gì:** Mỗi bài chọn ngôn ngữ được nộp, và có thể đặt giới hạn thời gian/bộ nhớ khác cho từng ngôn ngữ.
- **Cách VNOJ làm:**
  - `Problem.allowed_languages` (xem 02). Ngôn ngữ "dùng được" là ngôn ngữ cho phép mà có ít nhất một máy online có kho của bài. Trang đề gạch ngang ngôn ngữ không có máy online ("No X judge online").
  - `LanguageLimit`: `problem`, `language`, `time_limit` (giây, 0.01–60), `memory_limit` (KB, 0–1048576). Mỗi cặp bài–ngôn ngữ một dòng.
  - Không có quyền `judge.high_problem_timelimit` thì `time_limit` tối đa `VNOJ_PROBLEM_TIMELIMIT_LIMIT = 5` giây.
  - Khi gửi chấm, bridge thay giới hạn của bài bằng giới hạn riêng nếu có. Trang kết quả dùng giới hạn riêng để ghi ">Xs" cho TLE.
  - Sửa trên trang sửa bài và trong admin bài.
- **Ai dùng được:** Người sửa được bài.
- **Mã nguồn:** `judge/models/problem.py:720-733`, `judge/models/problem.py:487-493`, `judge/forms.py:147-163`, `judge/forms.py:327-328`, `judge/bridge/judge_handler.py:214-218`, `judge/views/submission.py:270-276`, `templates/problem/problem.html:385-400`

### CB-23. Trang Runtimes và ma trận phiên bản
- **Làm gì:** Trang công khai liệt kê ngôn ngữ và phiên bản trình biên dịch trên các máy chấm.
- **Cách VNOJ làm:**
  - `/runtimes/`: bảng ID (tên ngắn), tên, thông tin runtime và mô tả Markdown của ngôn ngữ. Người thường chỉ thấy ngôn ngữ có máy online; staff/superuser thấy hết.
  - `/runtimes/matrix/`: ma trận máy × ngôn ngữ. Máy cùng tiền tố tên (phần trước dấu chấm cuối) có cùng phiên bản được gộp thành một cột. Phiên bản mới nhất của mỗi ngôn ngữ được đánh dấu.
  - Dữ liệu `RuntimeVersion` (`language`, `judge`, `name`, `version`, `priority`) do máy chấm gửi khi kết nối hoặc khi gửi gói `executors`; xóa khi máy ngắt.
  - Các tab trên nhóm trang: Judges, OJ (chỉ superuser), Runtimes, Versions.
- **Ai dùng được:** Mọi người.
- **Mã nguồn:** `judge/views/language.py:7-18`, `judge/views/status.py:47-121`, `judge/models/runtime.py:124-129`, `judge/bridge/judge_handler.py:335-355`, `templates/status/language-list.html`, `templates/status/status-tabs.html`, trang `runtime_list`, `version_matrix`

### CB-24. Quản lý máy chấm (Judge)
- **Làm gì:** Khai báo các máy chấm được phép kết nối và điều khiển chúng.
- **Cách VNOJ làm:**
  - Trường: `name` (duy nhất, kiểu hostname, tối đa 50), `auth_key` (khóa xác thực, tối đa 100; admin có nút "Regenerate" sinh 75 byte ngẫu nhiên base64), `is_blocked` (chặn kết nối dù đúng khóa), `is_disabled` (bỏ khỏi hàng đợi chung), `tier` (mặc định 1), `description`.
  - Trường chỉ đọc: `created`, `online`, `start_time`, `ping` (giây), `load` (tải 1 phút chia số CPU), `last_ip`, `storages`, `runtimes`.
  - Admin có nút: ngắt nhẹ (`disconnect`, gửi gói yêu cầu máy tự thoát), ngắt cứng (`terminate`, đóng socket), bật/tắt `is_disabled` (báo bridge ngay).
  - Không xóa được máy đang online. Không đổi tên máy đang online.
  - Máy bị disabled vẫn nhận bài nếu bài chỉ định đích danh máy đó.
- **Ai dùng được:** Quản trị qua admin (quyền model `judge.change_judge`).
- **Mã nguồn:** `judge/models/runtime.py:132-203`, `judge/admin/runtime.py:46-128`, `judge/bridge/judge_handler.py:184-186`

### CB-25. Trang trạng thái máy chấm
- **Làm gì:** Cho mọi người thấy máy chấm nào đang chạy và tình trạng của chúng.
- **Cách VNOJ làm:**
  - `/status/`: bảng tên máy, thời gian chạy, ping (ms), load, danh sách runtime (rê chuột xem phiên bản).
  - Người thường chỉ thấy máy online. Staff/superuser thấy cả máy offline và cột Online. Ai có `change_judge` thì tên máy là link tới admin.
  - Bảng tự tải lại mỗi 10 giây qua `/widgets/status-table`; dừng khi tab bị ẩn và tải lại khi quay lại.
  - Tab OJ (`/status/oj/`, chỉ superuser): biểu đồ bài nộp theo ngày, theo ngôn ngữ, theo kết quả, thời gian chờ, theo tổ chức, chọn khoảng ngày.
- **Ai dùng được:** Mọi người (tab OJ: superuser).
- **Mã nguồn:** `judge/views/status.py:10-46`, `templates/status/judge-status-table.html`, `templates/status/media-js.html:29-60`, `templates/status/oj-status.html`, trang `status_all`, `status_table`, `status_oj`

### CB-26. Bridge và Judge API
- **Làm gì:** Tiến trình trung gian giữ kết nối với máy chấm, nhận lệnh từ site và ghi kết quả vào cơ sở dữ liệu.
- **Cách VNOJ làm:**
  - Chạy bằng lệnh quản trị `runbridged`. Hai cổng: máy chấm nối vào `BRIDGED_JUDGE_ADDRESS` (mặc định `localhost:9999`), site nối vào `BRIDGED_DJANGO_ADDRESS` (mặc định `localhost:9998`). Gói tin là JSON nén zlib, có 4 byte độ dài, tối đa 8 MB. Hỗ trợ PROXY protocol cho danh sách `BRIDGED_JUDGE_PROXIES`.
  - Khi bridge khởi động: đặt mọi máy về offline và chuyển mọi bài đang `QU`/`P`/`G` thành `IE`.
  - Bắt tay: máy gửi `id`, `key`, danh sách executor và kho. Giao thức phiên bản 1 bị từ chối. Sai khóa hoặc `is_blocked` thì đóng. Máy cùng tên đang nối bị ngắt cứng.
  - Timeout 15 giây trước bắt tay, 60 giây sau bắt tay. Ping mỗi 10 giây; ping và độ lệch giờ lấy trung bình 6 lần.
  - Gửi bài kèm giới hạn thời gian/bộ nhớ, `short-circuit`, và `meta` (`pretests-only`, `in-contest`, `attempt-no`, `user`, `file-only`, `file-size-limit`). Bài nộp bằng file thì gửi URL tuyệt đối của file. Máy không xác nhận trong 20 giây thì bị đóng kết nối.
  - Các gói máy gửi về: `submission-acknowledged`, `grading-begin`, `compile-message`, `compile-error`, `batch-begin`, `batch-end`, `test-case-status`, `grading-end`, `internal-error`, `submission-terminated`, `ping-response`, `executors`.
  - Judge API phía site (`judgeapi.py`): `submission-request` (gửi chấm), `terminate-submission` (hủy), `disconnect-judge`, `disable-judge`.
  - Mọi sự kiện được ghi log JSON (`judge.json.bridge`).
- **Ai dùng được:** Hệ thống (không có giao diện).
- **Mã nguồn:** `judge/bridge/daemon.py:16-50`, `judge/management/commands/runbridged.py`, `judge/bridge/base_handler.py:16`, `judge/bridge/judge_handler.py:40-668`, `judge/bridge/django_handler.py:13-69`, `judge/judgeapi.py:29-137`, `dmoj/settings.py:730-734`

### CB-27. Hàng đợi, độ ưu tiên, tier, giữ máy, máy bị cấm
- **Làm gì:** Quyết định bài nộp nào được chấm trước và trên máy nào.
- **Cách VNOJ làm:**
  - 4 mức ưu tiên: 0 bài trong kỳ thi, 1 bài thường, 2 chấm lại một bài, 3 chấm lại hàng loạt. Số nhỏ chấm trước.
  - Tier: chỉ máy online, không disabled, có tier nhỏ nhất mới được dùng. Máy tier cao hơn là dự phòng; khi tier nhỏ nhất mất hết máy thì tier kế tiếp tự nhận bài.
  - Chọn máy: trong các máy rảnh, có executor của ngôn ngữ, có kho của bài, chọn máy có `load` nhỏ nhất (hòa thì ngẫu nhiên).
  - Giữ máy: nếu có hơn một máy và chỉ còn một máy rảnh thì bài chấm lại (mức 2, 3) phải chờ. Máy cuối được để dành cho bài nộp mới.
  - Chỉ định máy: người sửa bài có thể gửi bài tới một máy cụ thể (`judge_id`). Máy disabled vẫn nhận nếu được chỉ định.
  - Máy bị cấm: kỳ thi có `banned_judges` (xem 04); bài nộp của người đang thi chính thức hoặc đang xem (spectate) không gửi tới các máy đó.
  - Bài đã trong hàng đợi hoặc đang chấm thì không xếp lại lần nữa.
  - Bài biến mất trước khi gửi thì bị bỏ khỏi hàng đợi.
- **Ai dùng được:** Hệ thống; chọn máy: người sửa bài (xem CB-30).
- **Mã nguồn:** `judge/judge_priority.py:1-4`, `judge/bridge/judge_list.py:22-241`, `judge/judgeapi.py:84-104`

### CB-28. Cảnh báo hàng đợi dài và thống kê thời gian chờ
- **Làm gì:** Báo cho quản trị qua Discord khi hàng đợi quá dài, và gửi thống kê thời gian chờ hằng ngày.
- **Cách VNOJ làm:**
  - Khi số bài chờ ở mức ưu tiên 0 và 1 cộng lại ≥ `VNOJ_LONG_QUEUE_ALERT_THRESHOLD = 10`, bridge gọi tác vụ `on_long_queue`.
  - Tác vụ gửi webhook `DISCORD_WEBHOOK['on_long_queue']` kèm link `/submissions/?status=QU`. Tối đa một cảnh báo mỗi 5 phút. Cần `SITE_FULL_URL`.
  - Lưu ý: bridge truyền `counts` dạng list nhưng tác vụ gọi `.values()` (chưa kiểm tra khi chạy).
  - Tác vụ `queue_time_stats` chạy lúc 0 giờ mỗi ngày: đếm bài của ngày trước theo khoảng thời gian chờ (0–1s, 1–2s, 2–5s, 5–10s, 10–30s, 30s–1 phút, 1–2 phút, 2–5 phút, 5–10 phút, >10 phút), vẽ biểu đồ và gửi webhook `queue_time_stats`. Bỏ qua bài đã chấm lại.
- **Ai dùng được:** Quản trị (cấu hình webhook).
- **Mã nguồn:** `judge/bridge/judge_list.py:42-43`, `judge/bridge/judge_list.py:240-241`, `judge/tasks/webhook.py:178-240`, `dmoj/settings.py:174`, `dmoj/settings.py:203-213`, `dmoj/celery.py:25-31`

### CB-29. Balancer (một cụm máy chấm cho nhiều site)
- **Làm gì:** Tiến trình đứng giữa một cụm máy chấm và một hoặc nhiều bridge, để nhiều site dùng chung máy.
- **Cách VNOJ làm:**
  - Chạy bằng `runbalancer -c <file YAML>`. Máy chấm nối vào `BALANCER_JUDGE_ADDRESS` (mặc định `localhost:8888`).
  - File cấu hình có `judges` (danh sách `id`, `key` cho máy được phép) và `bridges` (mỗi bridge: `host`, `port`, `id`, `key`, `secure`, `no_cert_check`, `cert_store`, `glob_ids`, `judge_version`, `storage_namespace`).
  - Với mỗi bridge, balancer đóng vai một máy chấm. Nó báo load của chính nó và gửi danh sách executor của cụm.
  - Bài nhận từ bridge vào một hàng đợi FIFO và giao cho máy rảnh bất kỳ; gói tin gắn `storage-namespace` của bridge đó.
  - Kết nối lại bridge theo backoff từ 4 giây tới tối đa 60 giây. Hỗ trợ TLS.
- **Ai dùng được:** Quản trị hệ thống.
- **Mã nguồn:** `judge/balancer/balancer.py:18-135`, `judge/balancer/bridge_handler.py:22-259`, `judge/balancer/sysinfo.py`, `judge/management/commands/runbalancer.py`, `dmoj/settings.py:727-728`

## Nộp bài

### CB-30. Form nộp bài
- **Làm gì:** Trang để thí sinh chọn ngôn ngữ, viết hoặc tải mã nguồn và nộp.
- **Cách VNOJ làm:**
  - Trang riêng `/problem/<code>/submit`. Form cũng nằm trong tab "Submit Solution" của trang đề.
  - Ô chọn ngôn ngữ chỉ gồm ngôn ngữ dùng được của bài (CB-22), sắp theo tên. Mỗi lựa chọn hiện tên và thông tin runtime (`info` hoặc phiên bản từ máy chấm).
  - Ngôn ngữ chọn sẵn: ngôn ngữ của bài cũ khi nộp lại, ngược lại là ngôn ngữ mặc định trong hồ sơ người dùng. Nếu ngôn ngữ đó không dùng được cho bài thì hiện cảnh báo và bỏ chọn.
  - Trình soạn Ace: theme theo hồ sơ người dùng; mode theo `Language.ace`; tự xuống dòng; cỡ chữ 14; chiều cao theo cửa sổ.
  - Mã mẫu: khi ô soạn trống hoặc còn đúng mẫu cũ, đổi ngôn ngữ sẽ nạp bản nháp `localStorage` (`submit:<id ngôn ngữ>`) hoặc `Language.template` qua `/widgets/template?id=`. `Ctrl-S` lưu nháp vào `localStorage`. `Ctrl-O` mở file.
  - Nạp mã từ file (nút chọn hoặc kéo thả vào editor); tự đổi ngôn ngữ theo đuôi file nếu khớp `extension`.
  - Ngôn ngữ `file_only`: ẩn editor, hiện ô kéo thả file, chỉ nhận đuôi `extension`, kiểm tra `file_size_limit` MB ở cả trình duyệt và server. Ngôn ngữ `SCRATCH`: lấy `project.json` trong zip. File lưu ở `submission_file/<mã bài>/<user id>/<uuid>.<đuôi>`; mã nguồn lưu là URL file.
  - Mã nguồn tối đa 65536 ký tự (kiểm tra ở trình duyệt và ở form). Phải có đúng một trong hai: mã nguồn hoặc file.
  - Trường `judge` (chọn máy chấm): chỉ người sửa được bài có danh sách máy online có kho của bài; người khác danh sách rỗng. Widget mặc định là ô ẩn (theo code đọc được không thấy ô chọn hiển thị; chưa kiểm tra trên giao diện).
  - Không có test thì hiện "This problem does not have test data."; không có máy thì "No judge is available for this problem." và không có nút nộp.
  - Bài đã lưu trữ lạnh hiện cảnh báo "Archived problem".
  - Nộp xong chuyển tới trang kết quả bài nộp.
- **Ai dùng được:** Người đã đăng nhập và xem được bài.
- **Mã nguồn:** `judge/views/problem.py:250-345`, `judge/views/problem.py:808-814`, `judge/views/problem.py:831-876`, `judge/forms.py:391-450`, `judge/views/widgets.py:69-80`, `templates/problem/submit-form.html`, `templates/problem/submit-js.html`, trang `problem_submit`, `language_template_ajax`

### CB-31. Nộp lại (resubmit)
- **Làm gì:** Mở form nộp với mã nguồn và ngôn ngữ của một bài nộp cũ.
- **Cách VNOJ làm:**
  - URL `/problem/<code>/resubmit/<id bài nộp>` (cùng tên URL `problem_submit`).
  - Không áp dụng cho ngôn ngữ chỉ nộp file (404).
  - Chỉ chủ bài nộp, hoặc người có `judge.resubmit_other`.
  - Link "Resubmit" có trên trang kết quả và trang mã nguồn.
- **Ai dùng được:** Chủ bài nộp; quyền `judge.resubmit_other` cho bài người khác.
- **Mã nguồn:** `judge/views/problem.py:880-894`, `judge/views/problem.py:283-284`, `judge/views/problem.py:299-301`, `templates/submission/status.html:76-78`, trang `problem_submit`

### CB-32. Các kiểm tra khi nộp
- **Làm gì:** Chặn các lần nộp không hợp lệ hoặc quá nhiều.
- **Cách VNOJ làm:**
  - Giới hạn đang chờ: nếu người dùng đã có ≥ `DMOJ_SUBMISSION_LIMIT = 2` bài chưa chấm xong (không phải `D`, `IE`, `CE`, `AB`, và không phải bài đang chấm lại) thì trả HTTP 429 "You submitted too many submissions." Quyền `judge.spam_submission` bỏ qua.
  - Ngôn ngữ phải thuộc `allowed_languages` của bài, nếu không trả 403.
  - Người trong `banned_users` của bài (trừ superuser) bị chặn với thông báo "persona non grata".
  - Giới hạn số lần nộp trong kỳ thi (`max_submissions`) và thông báo số lần còn lại: xem 04. Bài `IE` không tính vào số lần nộp kỳ thi.
  - Hạn mức credit của tổ chức khi `VNOJ_ENABLE_ORGANIZATION_CREDIT_LIMITATION = True` (mặc định tắt); thời gian chạy của bài trừ vào credit.
  - Không xem được bài thì trả 403 và ghi log "Naughty user".
  - Khi `VNOJ_OFFICIAL_CONTEST_MODE = True`, mỗi lần nộp ghi log `username, IP, mã bài`.
- **Ai dùng được:** Áp dụng cho mọi người nộp.
- **Mã nguồn:** `judge/views/problem.py:57-59`, `judge/views/problem.py:347-447`, `judge/views/problem.py:864-876`, `judge/models/submission.py:192-212`, `dmoj/settings.py:252-253`

## Bài nộp

### CB-33. Mô hình bài nộp, trạng thái và mã kết quả
- **Làm gì:** Lưu mỗi lần nộp cùng trạng thái chấm và kết quả cuối.
- **Cách VNOJ làm:**
  - Trường `Submission`: `user`, `problem`, `date`, `time` (giây, lớn nhất qua các test), `memory` (KB, lớn nhất), `points` (điểm bài), `language`, `status`, `result`, `error` (log biên dịch hoặc lỗi), `current_testcase`, `batch`, `case_points`, `case_total`, `judged_on`, `judged_date`, `rejudged_date`, `is_pretested`, `contest_object`, `locked_after`.
  - Mã nguồn ở bảng riêng `SubmissionSource` (tối đa 65536 ký tự).
  - Trạng thái (`status`): `QU` đang chờ, `P` máy đã nhận, `G` đang chấm, `D` xong, `IE` lỗi nội bộ, `CE` lỗi biên dịch, `AB` đã hủy.
  - Kết quả (`result`): `AC` đúng, `PAC` đúng một phần, `WA` sai, `TLE` quá thời gian, `MLE` quá bộ nhớ, `OLE` quá độ dài output, `IR` mã thoát khác 0 (Invalid Return), `RTE` lỗi khi chạy, `CE` lỗi biên dịch, `IE` lỗi nội bộ, `SC` bỏ qua do dừng sớm (Short Circuited), `AB` đã hủy.
  - `SC` xuất hiện khi bài bật `short_circuit` (xem 02): sau test sai đầu tiên, các test còn lại không chạy.
  - Lịch sử thay đổi lưu bằng django-reversion; mỗi lần chấm lại tạo một bản ghi "Rejudged" kèm người chấm lại.
  - Quyền định nghĩa trên model: `abort_any_submission`, `rejudge_submission`, `rejudge_submission_lot`, `spam_submission`, `view_all_submission`, `resubmit_other`, `lock_submission`.
  - Admin bài nộp: danh sách lọc theo ngôn ngữ, trạng thái (thêm "Not done", "Exceptional"), kết quả (thêm "Unaccepted"); tìm theo mã bài, tên bài, username; sửa mã nguồn bằng Ace; xem kết quả từng test. Người không có `edit_all_problem` chỉ thấy bài nộp của bài mình là tác giả/curator.
- **Ai dùng được:** Hệ thống; admin theo quyền trên.
- **Mã nguồn:** `judge/models/submission.py:21-311`, `judge/admin/submission.py:25-159`

### CB-34. Kết quả từng test và cách gộp kết quả
- **Làm gì:** Lưu kết quả mỗi test và tính kết quả, điểm của cả bài.
- **Cách VNOJ làm:**
  - `SubmissionTestCase`: `case` (vị trí), `status`, `time`, `memory`, `points`, `total`, `batch` (số nhóm), `feedback` (ngắn, tối đa 50 ký tự, cắt bớt), `extended_feedback` (dài), `output` (output đã cắt của thí sinh).
  - Mã test lấy từ cờ bit máy chấm gửi, theo thứ tự ưu tiên: TLE, MLE, OLE, RTE, IR, WA, SC; không cờ nào thì AC, hoặc PAC nếu điểm < tối đa.
  - Khi máy báo xong: nhóm lấy điểm nhỏ nhất và tổng lớn nhất trong nhóm; test ngoài nhóm cộng thẳng. `case_points`, `case_total` làm tròn 3 chữ số.
  - Kết quả bài là mã "nặng" nhất theo thứ tự `SC < AC < PAC < WA < MLE < TLE < IR < RTE < OLE`.
  - Điểm bài = `case_points / case_total × Problem.points`, làm tròn 3 chữ số. Bài không cho điểm từng phần mà không đạt đủ thì 0. Cập nhật điểm người dùng, thống kê bài, điểm kỳ thi và credit tổ chức sau đó (xem 04, 05).
  - Gói `compile-error` đặt `CE` và lưu log; `compile-message` lưu cảnh báo biên dịch vào `error` mà vẫn chấm tiếp.
- **Ai dùng được:** Hệ thống.
- **Mã nguồn:** `judge/models/submission.py:314-344`, `judge/bridge/judge_handler.py:372-478`, `judge/bridge/judge_handler.py:526-581`

### CB-35. Trang kết quả bài nộp
- **Làm gì:** Hiện tiến trình chấm và kết quả từng test của một bài nộp.
- **Cách VNOJ làm:**
  - URL `/submission/<id>`. Cần đăng nhập và quyền xem chi tiết (giống quyền xem mã nguồn, CB-38). Bị từ chối thì báo 403, có gợi ý "Solve X in order to view it" nếu bài ở chế độ "xem khi đã giải".
  - Đầu trang: thời điểm nộp, ngôn ngữ; người sửa bài thấy thêm tên máy chấm và link Admin.
  - Link: View source (ẩn với ngôn ngữ chỉ nộp file trừ superuser), Download (ngôn ngữ chỉ nộp file), Resubmit, Rejudge (có hỏi xác nhận), "Diff this submission".
  - Trạng thái chờ: "We are waiting for a suitable judge..." (`QU`), "Your submission is being processed..." (`P`).
  - `CE`: tiêu đề "Compilation Error" và log biên dịch có màu ANSI. Có cảnh báo biên dịch thì hiện "Compilation Warnings" trước kết quả.
  - Dãy biểu tượng tóm tắt: dấu tích cho AC/PAC, gạch cho SC, dấu X (bấm để nhảy tới test) cho test sai. Hơn 10 test liên tiếp cùng kết quả được gộp thành một biểu tượng "×N".
  - Từng nhóm: "Batch #N (điểm/tổng)", sau đó các test. Mỗi test: số thứ tự ("Case #", "Pretest #" hoặc "Test case #"), kết quả và feedback ngắn, thời gian (TLE ghi ">giới hạn"), bộ nhớ, điểm test ngoài nhóm.
  - Bấm một test để mở phần mở rộng: input/đáp án (CB-18), output đã cắt, "Judge feedback" (CB-36).
  - Cuối trang: "Resources" (thời gian, bộ nhớ), "Final score" `case_points/case_total` và điểm bài (hoặc điểm kỳ thi khi đang thi). Bài đã hủy ghi "Submission aborted!".
  - Chấm xong mà không có test nào thì báo bài đã được lưu, có thể là bài chấm offline.
  - Trang tự cập nhật khi có event daemon (CB-45): tải lại phần test qua `/widgets/submission_testcases?id=`, tối đa một lần mỗi 0,5 giây, tự cuộn xuống cuối nếu đang ở cuối.
- **Ai dùng được:** Người có quyền xem chi tiết bài nộp.
- **Mã nguồn:** `judge/views/submission.py:62-108`, `judge/views/submission.py:170-287`, `templates/submission/status.html`, `templates/submission/status-testcases.html`, `templates/submission/info-base.html`, trang `submission_status`, `submission_testcases_query`

### CB-36. Mức hiển thị kết quả test và feedback
- **Làm gì:** Cho người ra đề quyết định thí sinh thấy chi tiết tới mức nào.
- **Cách VNOJ làm:**
  - Trường bài `testcase_result_visibility_mode` (xem 02): `A` hiện mọi test (mặc định), `B` chỉ hiện kết quả từng nhóm, `S` chỉ hiện kết quả cuối của bài. Superuser luôn thấy mọi test.
  - Ở chế độ khác `A`: danh sách bài nộp không hiện "Case #N" đang chấm, và bridge không đẩy sự kiện từng test.
  - Feedback ngắn (`feedback`) luôn hiện cạnh kết quả test.
  - Feedback dài (`extended_feedback`) hiện khi: người xem xem được test (CB-18); hoặc bài bật `allow_view_feedback`; hoặc superuser; hoặc người xem không đang thi và test nằm trong `min(3, số test − 1)` test đầu. Bài trong kỳ thi chưa kết thúc thì phần "3 test đầu" bị tắt.
  - Output của thí sinh chỉ hiện khi người xem xem được test; được escape ký tự đặc biệt và cắt theo `output_prefix_override` của kỳ thi nếu có.
- **Ai dùng được:** Người sửa bài đặt chế độ; áp dụng cho người xem.
- **Mã nguồn:** `judge/models/problem.py:142-145`, `judge/models/problem.py:162-166`, `judge/models/problem.py:241-244`, `judge/models/problem.py:260-263`, `judge/views/submission.py:246-268`, `judge/bridge/judge_handler.py:583-603`, `templates/submission/status-testcases.html:15-17`, `templates/submission/status-testcases.html:82-158`, `templates/submission/row.html:21-38`

### CB-37. Xử lý lỗi nội bộ (IE)
- **Làm gì:** Đánh dấu bài nộp hỏng do lỗi hệ thống chấm, không phải lỗi của thí sinh.
- **Cách VNOJ làm:**
  - Bài thành `IE` khi: site không gửi được tới bridge; bridge trả lời sai; máy chấm gửi `internal-error` (lưu thông điệp vào `error`); máy ngắt khi đang chấm; máy xác nhận sai id bài; bridge khởi động lại khi bài đang `QU`/`P`/`G`.
  - Trang kết quả ghi "An internal error occurred while grading" (chủ bài thấy thêm câu "administrators have been notified"). Người sửa bài thấy traceback có tô màu.
  - `IE` không tính vào giới hạn bài đang chờ (CB-32) và không tính vào số lần nộp trong kỳ thi.
  - Lọc theo `IE` trong danh sách bài nộp chỉ dành cho staff/superuser.
  - Không có cơ chế tự chấm lại; dùng chấm lại thủ công (CB-41, CB-42).
- **Ai dùng được:** Hệ thống; xem traceback: người sửa bài.
- **Mã nguồn:** `judge/judgeapi.py:105-111`, `judge/bridge/daemon.py:22-23`, `judge/bridge/judge_handler.py:101-103`, `judge/bridge/judge_handler.py:285-288`, `judge/bridge/judge_handler.py:480-496`, `templates/submission/internal-error-message.html`, `judge/views/submission.py:447-454`

### CB-38. Xem mã nguồn, bản raw, tải file và quyền xem
- **Làm gì:** Trang hiện mã nguồn có tô màu, bản thô và tải file nộp.
- **Cách VNOJ làm:**
  - `/src/<id>`: mã nguồn tô màu bằng Pygments theo `Language.pygments`, có nút sao chép. Ngôn ngữ chỉ nộp file thì chỉ superuser xem (người khác nhận 404 "This source cannot be viewed by normal users.").
  - `/src/<id>/raw`: trả `text/plain`; bị từ chối thì 404.
  - `/src/<id>/download`: chỉ cho ngôn ngữ chỉ nộp file; tên file `<mã bài>_<username>_<id>.<đuôi>`.
  - Quyền xem chi tiết (`can_see_detail`): người sửa bài; quyền `judge.view_all_submission`; chủ bài nộp; tác giả/curator của kỳ thi chứa bài nộp; còn lại theo chế độ của bài.
  - Chế độ bài `submission_source_visibility_mode` (xem 02): `F` theo setting chung, `A` ai cũng xem, `S` xem khi đã AC bài (và bài công khai hoặc người xem là tester), `O` chỉ bài của mình (tester của bài vẫn xem được). Setting chung `DMOJ_SUBMISSION_SOURCE_VISIBILITY = 'all-solved'` (giá trị `all`, `all-solved`, `only-own`).
  - Danh sách bài nộp dùng hàm `submission_layout` với logic gần giống để ẩn/hiện link xem.
- **Ai dùng được:** Như trên.
- **Mã nguồn:** `judge/models/submission.py:146-171`, `judge/models/problem.py:129-133`, `judge/models/problem.py:519-527`, `judge/views/submission.py:111-134`, `judge/views/submission.py:290-323`, `judge/jinja2/submission.py:12-41`, `dmoj/settings.py:256-257`, trang `submission_source`, `submission_source_raw`, `submission_source_download`

### CB-39. So sánh mã nguồn hai bài nộp
- **Làm gì:** Hiện khác biệt giữa mã nguồn của hai bài nộp.
- **Cách VNOJ làm:**
  - URL `/submissions/diff?first_id=&second_id=`. Cần đăng nhập.
  - Hai bài phải không thuộc ngôn ngữ chỉ nộp file, và người xem phải xem được chi tiết cả hai (nếu không thì 403).
  - Dùng thư viện jsdiff và diff2html ở trình duyệt, có tô màu.
  - Vào từ bảng so sánh theo test (CB-19).
- **Ai dùng được:** Người xem được chi tiết cả hai bài.
- **Mã nguồn:** `judge/views/submission.py:137-167`, `templates/submission/source-diff.html`, trang `diff_submissions`

### CB-40. Hủy chấm (abort)
- **Làm gì:** Dừng một bài đang chờ hoặc đang chấm.
- **Cách VNOJ làm:**
  - Nút "Abort" trên trang kết quả khi bài chưa chấm xong; phím tắt `Ctrl-Enter`/`Cmd-Enter`. Gửi POST `/submission/<id>/abort`.
  - Chủ bài được hủy, trừ khi bài đang được chấm lại (`rejudged_date` có giá trị) hoặc site đang ở `VNOJ_OFFICIAL_CONTEST_MODE`. Quyền `judge.abort_any_submission` hủy được mọi bài.
  - Bài đã `D` thì không làm gì.
  - Bài đang chấm: bridge gửi `terminate-submission` tới máy; máy báo `submission-terminated` thì đặt `AB`, điểm 0. Bài còn trong hàng đợi: bridge gỡ khỏi hàng đợi và site đặt `AB` ngay.
- **Ai dùng được:** Chủ bài; quyền `judge.abort_any_submission`.
- **Mã nguồn:** `judge/views/submission.py:326-333`, `judge/judgeapi.py:125-137`, `judge/bridge/judge_list.py:177-191`, `judge/bridge/judge_handler.py:498-509`, `templates/submission/status.html:54-65`, `templates/submission/status.html:109-123`, trang `submission_abort`

### CB-41. Chấm lại một hoặc vài bài
- **Làm gì:** Đưa bài nộp đã chấm vào hàng đợi chấm lại.
- **Cách VNOJ làm:**
  - Link "Rejudge" trên trang kết quả (hỏi xác nhận), trang mã nguồn và từng dòng danh sách bài nộp. Gửi POST `/widgets/rejudge`.
  - Điều kiện: quyền `judge.rejudge_submission` và sửa được bài; bài không bị xóa, không lưu trữ lạnh; bài nộp không bị khóa (CB-46).
  - Khi chấm lại: xóa kết quả test cũ, đặt lại thời gian/điểm/kết quả, `status = QU`, ghi `rejudged_date`. Bài đang `P`/`G` thì không chấm lại. Ưu tiên mức 2.
  - Admin bài nộp có hành động "Rejudge the selected submissions" (ưu tiên mức 3) và nút "Rejudge" từng dòng. Cần `rejudge_submission` và `edit_own_problem`. Chọn hơn `DMOJ_SUBMISSIONS_REJUDGE_LIMIT = 10` bài cần thêm `rejudge_submission_lot`.
  - Admin còn có hành động "Rescore the selected submissions": tính lại điểm từ `case_points/case_total`, tính lại điểm người dùng và kết quả kỳ thi liên quan.
- **Ai dùng được:** Người sửa bài có `judge.rejudge_submission`.
- **Mã nguồn:** `judge/views/widgets.py:19-42`, `judge/models/problem.py:361-362`, `judge/models/submission.py:129-139`, `judge/judgeapi.py:56-82`, `judge/admin/submission.py:164-213`, `judge/admin/submission.py:245-267`, `dmoj/settings.py:254`, trang `submission_rejudge`

### CB-42. Chấm lại hàng loạt theo bài (có xem trước) và tính lại điểm
- **Làm gì:** Trang quản lý bài nộp của một bài: chấm lại nhiều bài theo bộ lọc, tính lại điểm, so sánh theo người dùng.
- **Cách VNOJ làm:**
  - URL `/problem/<code>/manage/submission`. Hiện tổng số bài nộp của bài.
  - Bộ lọc chấm lại: khoảng id (bật bằng ô "use_range", kiểm tra start ≤ end), nhiều ngôn ngữ, nhiều kết quả. Luôn bỏ bài bị khóa và bài đang `QU`/`P`/`G`.
  - Bấm nút thì gọi `/rejudge/preview` để đếm, hỏi "You are about to rejudge N submissions", đồng ý thì gửi.
  - Chạy bằng tác vụ Celery `rejudge_problem_filter`, có trang tiến trình, xong báo "Successfully scheduled N submissions for rejudging". Ưu tiên mức 3.
  - "Rescore all": tác vụ `rescore_problem` tính lại `points` mọi bài nộp theo điểm bài hiện tại, cập nhật kỳ thi, rồi tính lại điểm từng người dùng và xóa cache.
  - Ô chọn người dùng để mở bảng so sánh theo test (CB-19).
- **Ai dùng được:** Trang và Rescore: `is_staff` cộng quyền `judge.rejudge_submission` cộng sửa được bài. Chấm lại hàng loạt: thêm `judge.rejudge_submission_lot`.
- **Mã nguồn:** `judge/views/problem_manage.py:22-133`, `judge/tasks/submission.py:13-71`, `judge/models/problem.py:364-365`, `templates/problem/manage_submission.html`, trang `problem_manage_submissions`, `problem_submissions_rejudge`, `problem_submissions_rejudge_preview`, `problem_submissions_rejudge_success`, `problem_submissions_rescore_all`, `problem_submissions_rescore_success`

### CB-43. Danh sách bài nộp và bộ lọc
- **Làm gì:** Các trang liệt kê bài nộp mới nhất trước, có lọc và biểu đồ.
- **Cách VNOJ làm:**
  - Các trang: tất cả (`/submissions/`), của một người (`/submissions/user/<user>/`), của một bài (`/problem/<code>/submissions/`), của một người cho một bài (`/problem/<code>/submissions/<user>/`). Bản trong kỳ thi và trong tổ chức: xem 04 và phần tổ chức.
  - 50 bài mỗi trang. Trang tất cả, theo người, theo bài dùng phân trang "vô hạn" (không đếm tổng).
  - Mỗi dòng: điểm `case_points/case_total` (hoặc `---` khi IE/CE/AB), mã kết quả, ngôn ngữ, bài, người nộp, thời gian, biểu tượng kỳ thi, "Case #N" khi đang chấm, link view/source/download/rejudge/diff theo quyền.
  - Bộ lọc: nhiều trạng thái, nhiều ngôn ngữ, một tổ chức. `SC` không lọc được. Người không phải staff không lọc được `IE`, `QU`, `P`, `G`, `D`.
  - Biểu đồ tròn theo kết quả (màu `DMOJ_STATS_SUBMISSION_RESULT_COLORS`), lấy JSON qua `?results`. Trang tất cả không lọc thì cache 3600 giây.
  - Chỉ hiện bài nộp của bài mà người xem thấy được. Bài nộp trong kỳ thi chỉ hiện nếu là của mình, hoặc người xem là tác giả/curator, hoặc bảng điểm công khai, hoặc kỳ thi đã kết thúc (trừ người có `judge.see_private_contest`).
  - Chế độ tiết kiệm `VNOJ_LOW_POWER_MODE` (mặc định tắt): tối đa 5 trang, mỗi lần lọc một trạng thái và một ngôn ngữ, không lọc tổ chức, không biểu đồ. Superuser không bị áp dụng.
  - Trang đầu tự chèn/cập nhật bài nộp mới qua event daemon (CB-45).
- **Ai dùng được:** Mọi người (theo quyền xem bài và kỳ thi).
- **Mã nguồn:** `judge/views/submission.py:336-712`, `judge/views/submission.py:753-781`, `templates/submission/list.html`, `templates/submission/row.html`, `dmoj/settings.py:176-184`, trang `all_submissions`, `all_user_submissions`, `chronological_submissions`, `user_submissions`

### CB-44. Bài nộp tốt nhất (ranked)
- **Làm gì:** Mỗi người một bài nộp tốt nhất cho một bài, xếp theo điểm rồi thời gian chạy.
- **Cách VNOJ làm:**
  - URL `/problem/<code>/rank/`. Chỉ cho bài công khai.
  - Chỉ lấy bài nộp có điểm > 0, bỏ người dùng ẩn (`is_unlisted`).
  - Với mỗi người lấy bài có điểm cao nhất, hòa thì thời gian nhỏ nhất, hòa nữa thì id nhỏ nhất. Sắp theo điểm giảm, thời gian tăng.
  - Không có bộ lọc, biểu đồ, cập nhật trực tiếp.
  - Bản trong kỳ thi dùng điểm kỳ thi (xem 04).
- **Ai dùng được:** Người xem được bài.
- **Mã nguồn:** `judge/views/ranked_submission.py:15-103`, trang `ranked_submissions`, `contest_ranked_submissions`

### CB-45. Cập nhật thời gian thực (event daemon)
- **Làm gì:** Đẩy sự kiện chấm bài tới trình duyệt để trang tự cập nhật.
- **Cách VNOJ làm:**
  - Bật bằng `EVENT_DAEMON_USE` (mặc định `False`). Tắt thì không có cập nhật trực tiếp ở trang kết quả và danh sách bài nộp.
  - Daemon Node.js (`websocket/daemon.js`): cổng nhận lệnh đăng từ site (`EVENT_DAEMON_POST`, mặc định `ws://localhost:9997/`), cổng websocket cho trình duyệt (`EVENT_DAEMON_GET`, `ws://localhost:9996/`), và HTTP long-poll ở `/channels/<kênh1|kênh2>?last=<id>` (`EVENT_DAEMON_POLL`). Có thể dùng AMQP thay websocket khi đặt `EVENT_DAEMON_AMQP` (exchange `dmoj-events`).
  - Daemon giữ 50 tin gần nhất; mỗi client theo dõi tối đa 5 kênh; lệnh tối đa 200 byte; long-poll hết hạn sau 60 giây (trả 504 và client gọi lại).
  - Kênh `sub_<id_secret>` (id_secret = 16 ký tự đầu của HMAC-SHA512 id với `EVENT_DAEMON_SUBMISSION_KEY` cộng id dạng hex 8 ký tự): các loại `processing`, `grading-begin`, `test-case`, `compile-message`, `compile-error`, `internal-error`, `aborted`, `grading-end`. Tin `test-case` bị giới hạn 5 tin mỗi 0,5 giây cho một bài, và chỉ gửi khi chế độ hiển thị test là `A`.
  - Kênh `submissions` (chỉ bài công khai): `update-submission` / `done-submission` kèm id, kỳ thi, người dùng, bài, trạng thái, ngôn ngữ, tổ chức. Danh sách bài nộp lọc theo các trường này rồi tải lại một dòng qua `/widgets/single_submission?id=`.
  - Kênh `contest_<id>` loại `update` khi chấm xong bài trong kỳ thi (xem 04).
  - Phía trình duyệt: dùng WebSocket; trình duyệt không có WebSocket thì dùng long-poll (lỗi thì thử lại sau 2 giây). Trang danh sách bài nộp hiện thông báo gợi ý tải lại khi mất kết nối WebSocket.
  - Danh sách bài nộp bỏ qua tin `test-case` khi tab bị ẩn; biểu đồ cập nhật lại khi tab hiện.
- **Ai dùng được:** Mọi người xem trang.
- **Mã nguồn:** `judge/event_poster.py`, `judge/event_poster_ws.py`, `judge/event_poster_amqp.py`, `websocket/daemon.js:15-286`, `resources/event.js:1-120`, `judge/template_context.py:45-54`, `judge/models/submission.py:238-245`, `judge/bridge/judge_handler.py:24-25`, `judge/bridge/judge_handler.py:654-665`, `judge/judgeapi.py:17-26`, `judge/views/submission.py:715-750`, `templates/submission/list.html:145-258`, `dmoj/settings.py:736-746`, trang `submission_single_query`

### CB-46. Khóa bài nộp (`locked_after`)
- **Làm gì:** Sau một thời điểm, bài nộp không chấm lại được nữa.
- **Cách VNOJ làm:**
  - Trường `locked_after`. `is_locked` đúng khi thời điểm này đã qua.
  - Bài nộp trong kỳ thi chính thức nhận `locked_after` của kỳ thi lúc nộp (xem 04).
  - Bài bị khóa: `judge()` bỏ qua trừ khi `force_judge`; chấm lại hàng loạt bỏ qua; nút Rejudge ẩn trên trang kết quả và hiện "locked" màu xám trong danh sách; admin hiện nút "Locked" bị vô hiệu.
  - Sửa `locked_after` trong admin cần quyền `judge.lock_submission`.
- **Ai dùng được:** Hệ thống; sửa tay: quyền `judge.lock_submission`.
- **Mã nguồn:** `judge/models/submission.py:98`, `judge/models/submission.py:125-137`, `judge/views/problem.py:410-413`, `judge/tasks/submission.py:21-22`, `judge/admin/submission.py:134-138`, `judge/admin/submission.py:245-251`, `templates/submission/row.html:63-75`
