# 02. Bài tập

Nguồn: `VNOI-Admin/OJ` commit `209a32e` (04/11/2026), thư mục `reference/vnoj-src/site/`. Mô hình dữ liệu bài nằm ở `judge/models/problem.py`. Các trang về bài nằm ở `judge/views/problem.py`, form ở `judge/forms.py`, trang quản trị ở `judge/admin/problem.py`, giao diện ở `templates/problem/`.

## Bảng quyết định

| Mã | Chức năng | Quyết định | Ghi chú |
|---|---|---|---|
| BT-01 | Mã bài (code) và đổi mã | | |
| BT-02 | Tên bài và nội dung đề Markdown | | |
| BT-03 | Đề bài dạng file PDF | | |
| BT-04 | Nguồn bài (source) | | |
| BT-05 | Tác giả, người quản lý, người thử | | |
| BT-06 | Dạng bài và nhóm bài | | |
| BT-07 | Thẻ bài của tổ chức | | |
| BT-08 | Giới hạn thời gian và bộ nhớ (kể cả theo ngôn ngữ) | | |
| BT-09 | Điểm, chấm từng phần, dừng sớm | | |
| BT-10 | Ngôn ngữ được phép nộp | | |
| BT-11 | Công khai bài và ngày đăng | | |
| BT-12 | Quản lý dữ liệu thủ công | | |
| BT-13 | Cấm người dùng nộp bài | | |
| BT-14 | Giấy phép và trang giấy phép | | |
| BT-15 | Thống kê bài (số người giải, tỉ lệ AC) | | |
| BT-16 | Quyền Markdown đầy đủ (is_full_markup) | | |
| BT-17 | Chế độ xem mã nguồn bài nộp | | |
| BT-18 | Chế độ xem dữ liệu test | | |
| BT-19 | Chế độ xem kết quả từng test | | |
| BT-20 | Cho xem phản hồi của trình chấm | | |
| BT-21 | Nơi lưu dữ liệu bài (storage) | | |
| BT-22 | Mô hình quyền xem và sửa bài | | |
| BT-23 | Trang danh sách bài: cột, sắp xếp, phân trang | | |
| BT-24 | Tìm kiếm và bộ lọc danh sách bài | | |
| BT-25 | Tìm kiếm toàn văn | | |
| BT-26 | Dấu đã giải / đã thử | | |
| BT-27 | Bài ngẫu nhiên | | |
| BT-28 | Bài nổi bật (hot problems) | | |
| BT-29 | Trang chi tiết bài | | |
| BT-30 | Xem đề dạng PDF và bản in | | |
| BT-31 | Bản dịch đề | | |
| BT-32 | Làm rõ đề (clarification) | | |
| BT-33 | Lời giải (editorial) | | |
| BT-34 | Tạo bài mới | | |
| BT-35 | Sửa bài trên trang | | |
| BT-36 | Trang quản trị bài và lịch sử sửa | | |
| BT-37 | Sửa dạng/nhóm cho mọi bài | | |
| BT-38 | Nhân bản bài | | |
| BT-39 | Xóa bài (xóa mềm và dọn rác) | | |
| BT-40 | Lưu trữ lạnh (archive) | | |
| BT-41 | Nhập và cập nhật bài từ Polygon | | |
| BT-42 | Tải gói bài | | |
| BT-43 | Trình soạn Markdown (martor) | | |
| BT-44 | Hiển thị đề: Markdown, công thức toán, lọc HTML, ký tự cấm | | |
| BT-45 | Chia sẻ và SEO: ảnh OpenGraph, tóm tắt, RSS/Atom, sitemap | | |
| BT-46 | Trang bài nộp tốt nhất (/rank/) | | |
| BT-47 | Điểm nối sang khu vực khác (tổ chức, bình luận, ticket, bài nộp) | | |

## Chi tiết

### BT-01. Mã bài (code) và đổi mã
- **Làm gì:** Mỗi bài có một mã ngắn, duy nhất, dùng trong URL `/problem/<mã>`.
- **Cách VNOJ làm:**
  - Trường `code`: tối đa 32 ký tự, duy nhất, chỉ nhận `^[a-z0-9_]+$` (chữ thường, số, gạch dưới).
  - Thông báo lỗi trên form trang: "Only accept alphanumeric characters (a-z, 0-9) and underscore (_)". Gợi ý: `voi19_post`.
  - Bài của tổ chức phải bắt đầu bằng tiền tố = các ký tự chữ-số trong slug tổ chức (viết thường) + `_`. Slug là tên ngắn dùng trong URL. Sai tiền tố thì báo lỗi `problem_id_invalid_prefix`.
  - Khi tạo bài cho tổ chức, ô mã được điền sẵn tiền tố này.
  - Đổi mã bài sẽ tự đổi tên thư mục dữ liệu test theo mã mới (qua `problem_data._update_code` hoặc `problem_data_storage.rename`).
  - URL `/problem/<mã>/` (có dấu `/` cuối) chuyển hướng vĩnh viễn (301) về `/problem/<mã>`.
- **Ai dùng được:** Người sửa được bài (xem BT-22).
- **Mã nguồn:** `judge/models/problem.py:168-170`, `judge/models/problem.py:621-633`, `judge/forms.py:212-221`, `judge/forms.py:269`, `judge/forms.py:276-280`, `judge/views/organization.py:969-973`, `dmoj/urls.py:141`.

### BT-02. Tên bài và nội dung đề Markdown
- **Làm gì:** Lưu tên đầy đủ và đề bài viết bằng Markdown (cú pháp định dạng văn bản đơn giản) kèm công thức LaTeX.
- **Cách VNOJ làm:**
  - `name`: tối đa 100 ký tự, có chỉ mục, hiện trong danh sách bài. Gợi ý: "VOI19 - A cong B".
  - `description`: văn bản Markdown, được để trống.
  - Cả hai đều qua bộ kiểm tra ký tự cấm (xem BT-44).
  - Khi tạo bài trên trang, ô đề bài được điền sẵn bằng mẫu `description_example` lấy từ cấu hình `MiscConfig` (cấu hình chung sửa được trong admin).
  - Đề được soạn bằng trình soạn martor có nút xem trước, gọi `problem_preview` (xem BT-43).
- **Ai dùng được:** Người sửa được bài.
- **Mã nguồn:** `judge/models/problem.py:171-181`, `judge/forms.py:258`, `judge/forms.py:270-271`, `judge/views/problem.py:973-976`.

### BT-03. Đề bài dạng file PDF
- **Làm gì:** Cho phép bài có đề là file PDF thay cho, hoặc kèm theo, đề Markdown.
- **Cách VNOJ làm:**
  - Trường `pdf_url` (tối đa 200 ký tự) lưu đường dẫn PDF.
  - Trên form trang có ô tải file `statement_file`. Chỉ nhận đuôi trong `PDF_STATEMENT_SAFE_EXTS = {'pdf'}`. Kích thước tối đa `PDF_STATEMENT_MAX_FILE_SIZE = 5242880` byte (5 MB).
  - File được lưu vào thư mục `PDF_STATEMENT_UPLOAD_MEDIA_DIR = 'pdf'` với tên ngẫu nhiên UUID. URL có tiền tố `PDF_STATEMENT_UPLOAD_URL_PREFIX = '/pdf'`.
  - Có ô "Delete" để gỡ PDF; khi tick, `pdf_url` bị xóa trống.
  - Tải file cần quyền `judge.upload_file_statement`. Thiếu quyền thì báo lỗi.
  - Trong admin, `pdf_url` là ô nhập URL tự do.
  - Trang chi tiết nhúng PDF bằng thẻ `<object>` và kèm dòng "In case the statement didn't load correctly, you can download the statement here". Đề Markdown vẫn hiện ngay bên dưới.
  - Ở chế độ thi chính thức (`VNOJ_OFFICIAL_CONTEST_MODE`), dùng `pdf_url` gốc. Ngoài chế độ này, dùng URL tuyệt đối ghép với `SITE_FULL_URL`.
- **Ai dùng được:** Người sửa được bài có quyền `judge.upload_file_statement` (tải lên). Mọi người xem được bài thì xem được PDF.
- **Mã nguồn:** `judge/models/problem.py:174-176`, `judge/models/problem.py:286-288`, `judge/forms.py:176-182`, `judge/forms.py:190-192`, `judge/forms.py:223-236`, `judge/views/widgets.py:58-66`, `judge/views/problem.py:954-957`, `judge/views/problem.py:1117-1122`, `templates/problem/problem-detail.html:1-10`, `dmoj/settings.py:704-707`.

### BT-04. Nguồn bài (source)
- **Làm gì:** Ghi nguồn gốc bài, ví dụ kỳ thi gốc.
- **Cách VNOJ làm:**
  - Trường `source`: tối đa 200 ký tự, có chỉ mục, được để trống.
  - Hiện trong khung thông tin là "Problem source:".
  - Nếu `source` có dạng `c:<mã kỳ thi>` và kỳ thi đó đã kết thúc, trang bài hiện tên kỳ thi thành liên kết `contest_view`. Trang còn hiện danh sách các bài của kỳ thi đó để chuyển nhanh.
  - Tìm kiếm thường trong danh sách bài có so khớp cả `source` (BT-24).
  - Kỳ thi có thao tác hàng loạt đặt nguồn cho các bài (`contest_problems_set_source`, xem 04).
- **Ai dùng được:** Người sửa được bài.
- **Mã nguồn:** `judge/models/problem.py:177-179`, `judge/views/problem.py:474-480`, `templates/problem/problem.html:357-369`, `dmoj/urls.py:255`.

### BT-05. Tác giả, người quản lý, người thử
- **Làm gì:** Gán người dùng vào ba vai trò trên một bài.
- **Cách VNOJ làm:**
  - `authors` (tác giả): sửa được bài và được ghi tên là tác giả trên trang bài.
  - `curators` (người quản lý): sửa được bài nhưng không được ghi tên.
  - `testers` (người thử): xem được bài khi bài còn ẩn, nhưng không sửa được.
  - Quyền sửa vẫn cần thêm quyền Django `judge.edit_own_problem` (xem BT-22).
  - Danh sách tác giả hiện trên trang bài, được lưu đệm (cache) 86400 giây. Bị ẩn khi bài nằm trong kỳ thi bật `hide_problem_authors`.
  - Trên form sửa ở trang, chỉ có ô `testers`. Ô này cho dán một danh sách tên người dùng. `authors` và `curators` chỉ sửa trong admin.
  - Với bài của tổ chức, ô `testers` đổi nhãn thành "Private users" ("If private, only these users may see the problem") và chỉ tìm thành viên tổ chức (`organization_profile_select2`).
  - Người tạo bài trên trang tự được thêm làm `curators`. Người tạo bài tổ chức tự được thêm làm `authors`.
  - Admin có bộ lọc danh sách theo tác giả (`creator`) và tìm theo tên đăng nhập tác giả/người quản lý.
- **Ai dùng được:** Người sửa được bài (gán `testers` trên trang); người có quyền vào admin bài (gán cả ba).
- **Mã nguồn:** `judge/models/problem.py:182-190`, `judge/models/problem.py:300-312`, `judge/forms.py:200-210`, `judge/forms.py:259-262`, `judge/admin/problem.py:62-72`, `judge/admin/problem.py:157`, `templates/problem/problem.html:339-355`, `judge/views/problem.py:962`, `judge/views/organization.py:985`.

### BT-06. Dạng bài và nhóm bài
- **Làm gì:** Phân loại bài theo dạng (nhiều dạng mỗi bài) và theo một nhóm.
- **Cách VNOJ làm:**
  - `ProblemType`: `name` (mã, tối đa 20, duy nhất) và `full_name` (tên hiển thị, tối đa 100). Sắp theo `full_name`. Tên hiển thị được dịch qua bảng dịch người dùng (`user_gettext`).
  - `ProblemGroup`: cùng cấu trúc. Hiện ở cột "Category" trong danh sách bài.
  - `types` là quan hệ nhiều-nhiều, bắt buộc. `group` là khóa ngoại, bắt buộc.
  - Khi tạo bài, mặc định nhóm là `Uncategorized` (hoặc nhóm có id nhỏ nhất) và dạng là `uncategorized` (hoặc dạng có id nhỏ nhất).
  - Trang bài hiện mục "Problem types" dạng thu gọn (mặc định đóng). Ẩn khi bài nằm trong kỳ thi bật `hide_problem_tags`.
  - Với bài riêng của tổ chức, chỗ hiện dạng bài được thay bằng thẻ tổ chức (BT-07).
  - Bài tổ chức không có ô `types` trên form; ô `group` bị ẩn.
  - Quản lý danh mục dạng và nhóm trong admin (`ProblemTypeAdmin`, `ProblemGroupAdmin`).
- **Ai dùng được:** Người sửa được bài; quản trị viên (danh mục).
- **Mã nguồn:** `judge/models/problem.py:35-58`, `judge/models/problem.py:191-194`, `judge/models/problem.py:290-295`, `judge/views/problem.py:979-986`, `judge/forms.py:200-201`, `judge/admin/taxon.py:4-9`, `templates/problem/problem.html:371-384`.

### BT-07. Thẻ bài của tổ chức
- **Làm gì:** Tổ chức tự đặt thẻ để phân loại bài của mình.
- **Cách VNOJ làm:**
  - `OrganizationProblemTag`: `name` tối đa 50 ký tự, duy nhất trong một tổ chức.
  - Trường `tags` trên bài chỉ chọn được thẻ của tổ chức sở hữu bài. Bài không thuộc tổ chức thì danh sách thẻ trống.
  - Trên form sửa bài tổ chức có nút "Create new tag" mở hộp thoại tạo thẻ ngay (`organization_tag_add`).
  - Danh sách bài của tổ chức lọc được theo thẻ, có lựa chọn "Uncategorized". Chi tiết xem 07.
- **Ai dùng được:** Người sửa được bài thuộc tổ chức; quản trị tổ chức quản lý thẻ (xem 07).
- **Mã nguồn:** `judge/models/problem.py:61-73`, `judge/models/problem.py:195-197`, `judge/forms.py:194-199`, `judge/admin/problem.py:237-241`, `templates/problem/editor.html:85-130`, `templates/problem/search-form.html:49-60`, `dmoj/urls.py:301-304`.

### BT-08. Giới hạn thời gian và bộ nhớ (kể cả theo ngôn ngữ)
- **Làm gì:** Đặt giới hạn thời gian chạy và bộ nhớ chung cho bài, và giới hạn riêng cho từng ngôn ngữ.
- **Cách VNOJ làm:**
  - `time_limit` tính bằng giây, nhận số lẻ (ví dụ 1.5). Phạm vi `DMOJ_PROBLEM_MIN_TIME_LIMIT = 0.01` đến `DMOJ_PROBLEM_MAX_TIME_LIMIT = 60`.
  - `memory_limit` tính bằng kilobyte. Phạm vi `DMOJ_PROBLEM_MIN_MEMORY_LIMIT = 0` đến `DMOJ_PROBLEM_MAX_MEMORY_LIMIT = 1048576` (1 GB). Mặc định khi tạo trên trang: 262144 (256 MB).
  - Trên form trang, thời gian không được vượt `VNOJ_PROBLEM_TIMELIMIT_LIMIT = 5` giây, trừ khi người dùng có quyền `judge.high_problem_timelimit`. Lỗi `problem_timelimit_too_long`.
  - Giới hạn riêng theo ngôn ngữ (`LanguageLimit`): mỗi cặp (bài, ngôn ngữ) có `time_limit` và `memory_limit` riêng, cùng phạm vi như trên. Quy tắc 5 giây cũng áp dụng.
  - Form trang có bảng "Language-specific resource limit" với ghi chú "Only use this feature if you really need to!". Thêm/xóa dòng được. Admin có bảng tương ứng.
  - Trang bài hiện giới hạn chung và các giới hạn riêng khác giá trị chung. Nếu mọi phiên bản của một ngôn ngữ cùng giới hạn thì gộp thành một dòng theo tên chung (ví dụ "C++"). Kết quả được lưu đệm theo khóa `problem_tls:<id>` và `problem_mls:<id>`.
  - Bộ nhớ hiển thị theo bộ lọc `kbsimpleformat` (đổi sang MB/GB).
- **Ai dùng được:** Người sửa được bài. Vượt 5 giây cần `judge.high_problem_timelimit`.
- **Mã nguồn:** `judge/models/problem.py:198-207`, `judge/models/problem.py:542-582`, `judge/models/problem.py:720-733`, `judge/forms.py:147-166`, `judge/forms.py:238-245`, `judge/views/problem.py:977`, `templates/problem/editor.html:236-253`, `templates/problem/problem.html:293-316`, `dmoj/settings.py:116`, `dmoj/settings.py:230-233`.

### BT-09. Điểm, chấm từng phần, dừng sớm
- **Làm gì:** Đặt số điểm của bài và cách tính điểm khi chỉ đúng một phần.
- **Cách VNOJ làm:**
  - `points`: số thực, phạm vi `DMOJ_PROBLEM_MIN_PROBLEM_POINTS = 0.01` đến `DMOJ_PROBLEM_MAX_PROBLEM_POINTS = 2`. Gợi ý trên form: 0.5 tương đương bài 1 VOI, 1 tương đương bài 2, 1.5 tương đương bài 3.
  - `partial` (cho điểm từng phần): mặc định của model là `False`; khi tạo trên trang mặc định là `True`. Trang bài hiện chữ "(partial)" sau số điểm.
  - `short_circuit` (dừng chấm ngay khi sai một test): mỗi lần lưu, hệ thống tự đặt `short_circuit = not partial`. Giá trị nhập tay trong admin bị ghi đè.
  - Đổi `points` thì tự chạy tác vụ chấm lại điểm `rescore_problem`. Trong admin, đổi `is_public`, `is_organization_private` hoặc `partial` cũng chạy tác vụ này. Cách tính điểm người dùng xem 05.
  - Trong kỳ thi, trang bài hiện điểm của bài trong kỳ thi thay cho điểm bài (xem 04).
- **Ai dùng được:** Người sửa được bài.
- **Mã nguồn:** `judge/models/problem.py:208-214`, `judge/models/problem.py:612-648`, `judge/forms.py:272-274`, `judge/views/problem.py:978`, `judge/admin/problem.py:244-250`, `templates/problem/problem.html:283-292`, `dmoj/settings.py:234-235`.

### BT-10. Ngôn ngữ được phép nộp
- **Làm gì:** Chọn các ngôn ngữ lập trình được dùng để nộp bài.
- **Cách VNOJ làm:**
  - `allowed_languages`: nhiều-nhiều tới `Language`.
  - Khi tạo bài trên trang, tạo từ tổ chức hoặc nhập từ Polygon, danh sách được đặt bằng mọi ngôn ngữ có `include_in_problem=True`.
  - Form trang không có ô này. Chỉ sửa trong admin, dạng danh sách ô tick có nút chọn tất cả.
  - Trang bài chỉ hiện mục "Allowed languages" khi bài không cho phép toàn bộ ngôn ngữ. Ngôn ngữ không có máy chấm trực tuyến bị gạch ngang, kèm chú thích "No ... judge online".
  - Ngôn ngữ dùng được thực tế (`usable_languages`) = ngôn ngữ được phép có máy chấm đang trực tuyến và gắn với nơi lưu dữ liệu của bài (BT-21).
  - Nộp bằng ngôn ngữ ngoài danh sách bị từ chối (403). Chi tiết ngôn ngữ và máy chấm xem 03.
- **Ai dùng được:** Người vào được admin bài.
- **Mã nguồn:** `judge/models/problem.py:215-216`, `judge/models/problem.py:297-298`, `judge/models/problem.py:483-492`, `judge/views/problem.py:963`, `judge/views/problem.py:361-362`, `judge/views/problem.py:486`, `judge/admin/problem.py:229-232`, `templates/problem/problem.html:385-403`.

### BT-11. Công khai bài và ngày đăng
- **Làm gì:** Bật/tắt việc bài hiện cho mọi người, và ghi ngày đăng.
- **Cách VNOJ làm:**
  - `is_public`: mặc định `False`.
  - Form trang chỉ có ô `is_public` với bài thuộc tổ chức. Ghi chú: nếu muốn dùng bài trong kỳ thi thì để riêng tư, nếu không người dùng xem được bài mà không cần vào kỳ thi.
  - Bài không thuộc tổ chức chỉ đổi được trong admin. Trong admin, ô `is_public` chỉ đọc nếu thiếu quyền `judge.change_public_visibility`.
  - Admin có hai thao tác hàng loạt (cần `judge.change_public_visibility`): "Mark problems as public and set publish date to now" (đặt `is_public=True`, `date` = bây giờ, chấm lại điểm) và "Mark problems as private" (đặt `is_public=False`, chấm lại điểm).
  - `date` ("date of publishing"): có chỉ mục, được để trống. Ghi chú trong mã: trường này không tự đăng bài khi tới ngày. Được đặt bằng thời điểm hiện tại khi tạo bài, nhân bản bài, hoặc khi dùng thao tác công khai.
  - `date` dùng làm thứ tự mặc định của danh sách bài (mới trước) và thứ tự RSS.
  - Kỳ thi có thao tác hàng loạt công khai các bài sau kỳ thi (`contest_problems_make_public`, xem 04).
- **Ai dùng được:** Quản trị viên có `judge.change_public_visibility`; người sửa bài tổ chức (trên trang).
- **Mã nguồn:** `judge/models/problem.py:217`, `judge/models/problem.py:220-222`, `judge/forms.py:194-197`, `judge/forms.py:264-268`, `judge/admin/problem.py:165-180`, `judge/admin/problem.py:201-218`, `judge/views/problem.py:964`, `dmoj/urls.py:253-254`.

### BT-12. Quản lý dữ liệu thủ công
- **Làm gì:** Đánh dấu bài có dữ liệu test do quản trị đặt tay trên máy chấm, không qua trang web.
- **Cách VNOJ làm:**
  - `is_manually_managed`: mặc định `False`, có chỉ mục.
  - Khi bật, trang bài ẩn liên kết "Edit test data".
  - Khi bật, khung thông tin không hiện cách nhập/xuất (stdin/stdout hoặc tên file).
  - Khi bài chưa có `init.yml`, nút nộp vẫn bật nếu bài là quản lý thủ công.
  - Trong admin, ô này chỉ đọc nếu thiếu quyền `judge.change_manually_managed`.
  - Nội dung test dữ liệu xem 03.
- **Ai dùng được:** Quản trị viên có `judge.change_manually_managed`.
- **Mã nguồn:** `judge/models/problem.py:218-219`, `judge/models/problem.py:588-591`, `judge/views/problem.py:332-335`, `judge/admin/problem.py:181-182`, `templates/problem/problem.html:253-255`.

### BT-13. Cấm người dùng nộp bài
- **Làm gì:** Chặn từng người dùng cụ thể nộp vào một bài.
- **Cách VNOJ làm:**
  - `banned_users` ("personae non gratae"): nhiều-nhiều tới `Profile`.
  - Người bị cấm nộp bài sẽ nhận trang "Banned from submitting": "You have been declared persona non grata for this problem. You are permanently barred from submitting to this problem."
  - Superuser không bị chặn dù có trong danh sách.
  - Chỉ sửa trong admin, mục "Justice".
- **Ai dùng được:** Người vào được admin bài.
- **Mã nguồn:** `judge/models/problem.py:223-224`, `judge/views/problem.py:364-367`, `judge/admin/problem.py:151`.

### BT-14. Giấy phép và trang giấy phép
- **Làm gì:** Gắn giấy phép bản quyền cho đề bài và có trang xem nội dung giấy phép.
- **Cách VNOJ làm:**
  - Model `License`: `key` (tối đa 20, duy nhất, `^[-\w.]+$`), `link` (URL nguồn), `name` (tên đầy đủ), `display` (tên ngắn hiện trên trang bài), `icon` (URL biểu tượng), `text` (nội dung Markdown).
  - Trường `license` trên bài: khóa ngoại, được để trống. Xóa giấy phép thì bài về trống (`SET_NULL`).
  - Cuối đề bài hiện liên kết tới giấy phép bằng `display`, hoặc `name` nếu `display` trống.
  - Trang `/license/<key>` (tên URL `license`): hiện nội dung Markdown theo kiểu `license`, lưu đệm 3600 giây. Có liên kết "Visit source" tới `link`. Người có `judge.change_license` thấy nút "Edit" vào admin.
  - Sửa giấy phép trong admin (`LicenseAdmin`), có xem trước `license_preview`. Lưu giấy phép thì xóa bộ đệm trang.
  - Gán giấy phép cho bài chỉ làm trong admin.
- **Ai dùng được:** Mọi người xem trang giấy phép. Quản trị viên tạo/sửa giấy phép.
- **Mã nguồn:** `judge/models/problem.py:76-94`, `judge/models/problem.py:225-226`, `judge/views/license.py:7-14`, `templates/license.html`, `templates/problem/problem-detail.html:16-22`, `judge/admin/interface.py:124-132`, `judge/signals.py:101-103`, `dmoj/urls.py:360`.

### BT-15. Thống kê bài (số người giải, tỉ lệ AC)
- **Làm gì:** Lưu số người đã giải và tỉ lệ bài nộp đúng.
- **Cách VNOJ làm:**
  - `user_count`: số người dùng khác nhau có bài nộp AC (đúng hoàn toàn). Mặc định 0.
  - `ac_rate`: 100 × số bài nộp AC / tổng số bài nộp. Mặc định 0.
  - Cả hai bỏ qua người dùng ẩn danh sách (`is_unlisted`).
  - Được tính lại mỗi khi chấm xong một bài nộp và khi xóa bài nộp.
  - Hiện trong danh sách bài: cột "% AC" (1 chữ số thập phân) và "# AC". Số "# AC" là liên kết tới trang bài nộp tốt nhất (bài công khai) hoặc danh sách bài nộp (bài ẩn).
  - Nhân bản bài thì đặt lại cả hai về 0.
- **Ai dùng được:** Mọi người xem; hệ thống tự cập nhật.
- **Mã nguồn:** `judge/models/problem.py:230-232`, `judge/models/problem.py:529-540`, `judge/bridge/judge_handler.py:442-443`, `judge/signals.py:136-142`, `templates/problem/list.html:254-259`.

### BT-16. Quyền Markdown đầy đủ (is_full_markup)
- **Làm gì:** Cho phép đề bài dùng HTML tùy ý, không qua bộ lọc HTML.
- **Cách VNOJ làm:**
  - `is_full_markup`: mặc định `False`.
  - Khi bật, đề hiển thị theo kiểu `problem-full` (`MARKDOWN_ADMIN_EDITABLE_STYLE`: `safe_mode=False`, không có bộ lọc thẻ). Khi tắt, dùng kiểu `problem` (có bộ lọc, xem BT-44).
  - Trong admin, ô này chỉ đọc nếu thiếu quyền `judge.problem_full_markup`. Nếu bài đã bật mà người sửa thiếu quyền, ô đề bài cũng chỉ đọc.
  - Người thiếu quyền cũng không thêm/sửa/xóa được bản dịch của bài đã bật.
- **Ai dùng được:** Quản trị viên có `judge.problem_full_markup`.
- **Mã nguồn:** `judge/models/problem.py:233`, `judge/models/problem.py:584-586`, `judge/admin/problem.py:128-133`, `judge/admin/problem.py:183-186`, `dmoj/settings.py:622-625`, `dmoj/settings.py:672`.

### BT-17. Chế độ xem mã nguồn bài nộp
- **Làm gì:** Chọn ai được xem mã nguồn bài nộp của người khác trong bài này.
- **Cách VNOJ làm:**
  - Trường `submission_source_visibility_mode`, mặc định `F`. Bốn giá trị:
    - `F` "Follow global setting": theo cấu hình `DMOJ_SUBMISSION_SOURCE_VISIBILITY` (mặc định `'all-solved'`). Giá trị cấu hình `all` → `A`, `all-solved` → `S`, `only-own` → `O`.
    - `A` "Always visible": ai đăng nhập cũng xem được.
    - `S` "Visible if problem solved": xem được nếu đã AC bài này và bài công khai hoặc mình là người thử.
    - `O` "Only own submissions": chỉ xem bài của mình; người thử của bài vẫn xem được.
  - Luôn xem được, bất kể chế độ: người sửa được bài, người có `judge.view_all_submission`, chủ bài nộp, người sửa kỳ thi chứa bài nộp.
  - Có trên form trang và admin.
- **Ai dùng được:** Người sửa được bài đặt chế độ.
- **Mã nguồn:** `judge/models/problem.py:129-133`, `judge/models/problem.py:149-154`, `judge/models/problem.py:234-236`, `judge/models/problem.py:519-527`, `judge/models/submission.py:144-170`, `dmoj/settings.py:257`.

### BT-18. Chế độ xem dữ liệu test
- **Làm gì:** Chọn ai được xem nội dung test (input/output) trên trang kết quả bài nộp.
- **Cách VNOJ làm:**
  - Trường `testcase_visibility_mode`, mặc định `O`. Ba giá trị:
    - `O` "Visible for authors": chỉ người sửa được bài.
    - `C` "Visible if user is not in a contest": người đăng nhập và không đang trong kỳ thi nào.
    - `A` "Always visible": mọi người, kể cả khách.
  - Người sửa được bài luôn xem được.
  - Dùng ở trang trạng thái bài nộp (xem 03).
  - Có trên form trang và admin.
- **Ai dùng được:** Người sửa được bài đặt chế độ.
- **Mã nguồn:** `judge/models/problem.py:136-139`, `judge/models/problem.py:156-160`, `judge/models/problem.py:237-239`, `judge/models/problem.py:367-381`, `judge/views/submission.py:257-261`.

### BT-19. Chế độ xem kết quả từng test
- **Làm gì:** Chọn mức chi tiết kết quả chấm hiện cho người nộp.
- **Cách VNOJ làm:**
  - Trường `testcase_result_visibility_mode`, mặc định `A`. Ba giá trị:
    - `A` "Show all testcase result": hiện kết quả từng test.
    - `B` "Show batch result only": chỉ hiện kết quả theo từng nhóm test (batch).
    - `S` "Show submission result only": chỉ hiện kết quả cuối của bài nộp.
  - Superuser luôn thấy kết quả từng test.
  - Khi khác `A`, máy chủ cầu nối không đẩy cập nhật trực tiếp từng test lên trang trong lúc chấm.
  - Chỉ sửa trong admin (không có trên form trang).
- **Ai dùng được:** Người vào được admin bài.
- **Mã nguồn:** `judge/models/problem.py:142-145`, `judge/models/problem.py:162-166`, `judge/models/problem.py:241-244`, `judge/views/submission.py:263-266`, `judge/bridge/judge_handler.py:584-585`, `templates/submission/row.html:20`.

### BT-20. Cho xem phản hồi của trình chấm
- **Làm gì:** Cho người nộp xem thông điệp phản hồi (feedback) do trình chấm (checker) trả về.
- **Cách VNOJ làm:**
  - `allow_view_feedback`: mặc định `False`.
  - Khi `True`, mọi người xem được bài nộp thì thấy phản hồi. Khi `False`, chỉ superuser thấy.
  - Chỉ sửa trong admin.
- **Ai dùng được:** Người vào được admin bài.
- **Mã nguồn:** `judge/models/problem.py:260-263`, `judge/views/submission.py:268-269`, `judge/admin/problem.py:142`.

### BT-21. Nơi lưu dữ liệu bài (storage)
- **Làm gì:** Chọn kho lưu dữ liệu test cho từng bài khi hệ thống có nhiều kho.
- **Cách VNOJ làm:**
  - `storage`: chuỗi tối đa 100 ký tự. Để trống thì dùng kho mặc định.
  - Admin hiện danh sách lựa chọn: "Default (<tên kho mặc định>)" và các kho trong cấu hình.
  - Chỉ máy chấm đang trực tuyến có khai báo kho này mới chấm được bài. Danh sách ngôn ngữ dùng được và danh sách máy chấm trên trang bài đều lọc theo kho.
  - Chi tiết kho và máy chấm xem 03.
- **Ai dùng được:** Người vào được admin bài.
- **Mã nguồn:** `judge/models/problem.py:264-272`, `judge/models/problem.py:487-492`, `judge/admin/problem.py:22-26`, `judge/admin/problem.py:41-46`, `judge/views/problem.py:482-485`.

### BT-22. Mô hình quyền xem và sửa bài
- **Làm gì:** Quy định ai thấy, ai sửa, ai nhân bản, ai xóa bài.
- **Cách VNOJ làm:**
  - **Xem một bài (`is_accessible_by`)**, theo thứ tự:
    - Nếu người dùng đang trong một kỳ thi chưa vào được (`can_join` sai), trả về không xem được, với mọi bài.
    - Nếu đang trong kỳ thi có chứa bài, xem được.
    - Bài công khai và không riêng tổ chức: mọi người xem được, kể cả khách.
    - Bài công khai và riêng tổ chức: cần quyền `judge.see_organization_problem` hoặc là thành viên tổ chức.
    - Ngoài ra cần đăng nhập và một trong: quyền `judge.see_private_problem`; sửa được bài; là tác giả/người quản lý; là người thử.
    - Không xem được thì trang trả về "No such problem" (404).
  - **Sửa bài (`is_editable_by`)**: phải đăng nhập và có `judge.edit_own_problem`, rồi thêm một trong: `judge.edit_all_problem`; `judge.edit_public_problem` và bài đang công khai; là tác giả hoặc người quản lý.
  - **Danh sách bài sửa được (`get_editable_problems`)**: dùng cho admin. Cùng quy tắc như trên.
  - **Danh sách bài thấy được (`get_visible_problems`)**: dùng cho ô chọn bài và kỳ thi. Người có `see_private_problem` hoặc (`edit_own_problem` + `edit_all_problem`) thấy hết. Người khác thấy bài công khai (lọc thêm theo tổ chức trừ khi có `see_organization_problem` hoặc `edit_public_problem`), cộng các bài mình là tác giả/quản lý/người thử. Mặc định bỏ bài đã xóa.
  - **Rejudge**: cần `judge.rejudge_submission` và sửa được bài. **Quản lý bài nộp**: thêm điều kiện là nhân viên (`is_staff`). Chi tiết xem 03.
  - Danh sách quyền Django riêng của bài:
    - `see_private_problem` – xem bài ẩn.
    - `edit_own_problem` – sửa bài của mình (điều kiện nền cho mọi quyền sửa).
    - `create_organization_problem` – tạo bài tổ chức.
    - `edit_all_problem` – sửa mọi bài.
    - `edit_public_problem` – sửa mọi bài công khai.
    - `problem_full_markup` – sửa bài dùng Markdown đầy đủ.
    - `clone_problem` – nhân bản bài.
    - `upload_file_statement` – tải đề PDF.
    - `change_public_visibility` – đổi `is_public`.
    - `change_manually_managed` – đổi `is_manually_managed`.
    - `see_organization_problem` – xem bài riêng của tổ chức.
    - `import_polygon_package` – nhập gói Polygon.
    - `edit_type_group_all_problem` – sửa dạng và nhóm của mọi bài.
  - Quyền liên quan khác: `judge.add_problem` (tạo bài, quyền mặc định của Django), `judge.see_private_solution` (xem lời giải ẩn), `judge.high_problem_timelimit` (đặt thời gian trên 5 giây), `judge.can_upload_image` (tải ảnh lên qua martor).
  - Xóa bài: cần sửa được bài (BT-39).
- **Ai dùng được:** Áp dụng cho mọi người dùng.
- **Mã nguồn:** `judge/models/problem.py:300-461`, `judge/models/problem.py:668-683`, `judge/models/problem.py:763-766`, `judge/models/profile.py:549-550`, `judge/views/problem.py:79-107`.

### BT-23. Trang danh sách bài: cột, sắp xếp, phân trang
- **Làm gì:** Trang `/problems/` liệt kê bài để người dùng duyệt.
- **Cách VNOJ làm:**
  - Tên URL `problem_list`. Mỗi trang 50 bài. Phân trang kiểu "vô hạn" (`InfinitePaginationMixin`).
  - Chỉ hiện bài chưa xóa và (công khai, không riêng tổ chức) hoặc bài mình là tác giả/quản lý/người thử. Người có `see_private_problem` không thấy thêm bài ẩn ở trang này.
  - Các cột: dấu đã giải (khi đăng nhập), "ID" (mã bài), "Problem" (tên theo ngôn ngữ giao diện), "Category" (nhóm; ẩn ở danh sách tổ chức), "Types" (khi bật "Show problem types"), "Points" (2 chữ số thập phân), "% AC", "# AC", cột lời giải (biểu tượng sách; có liên kết khi có lời giải công khai).
  - Sắp xếp được theo: `points`, `ac_rate`, `user_count`, `code`, `date`, `name`, `group`, `solved`, `type` (chỉ khi hiện dạng bài), `editorial`.
  - Mặc định `-date` (mới trước). `points`, `ac_rate`, `user_count` mặc định giảm dần khi bấm.
  - Sắp theo `solved`: đã giải > đã thử > chưa làm.
  - Khi bật `VNOJ_LOW_POWER_MODE` (mặc định `False`), chỉ còn sắp được theo `points` và `user_count`.
  - Có tab "Create new problem" (người có `judge.add_problem`), "List", "Admin" (superuser).
- **Ai dùng được:** Mọi người, kể cả khách.
- **Mã nguồn:** `judge/views/problem.py:612-659`, `judge/views/problem.py:677-689`, `judge/views/problem.py:772-777`, `templates/problem/list.html:160-273`, `templates/problem/problem-list-tabs.html`, `dmoj/urls.py:115`, `dmoj/settings.py:177`.

### BT-24. Tìm kiếm và bộ lọc danh sách bài
- **Làm gì:** Lọc danh sách bài theo nhiều tiêu chí.
- **Cách VNOJ làm:**
  - Ô tìm kiếm `search`: tìm không phân biệt hoa thường trong `code`, `name`, `source`, và tên bản dịch ở ngôn ngữ giao diện hiện tại.
  - "Hide solved problems" (`hide_solved`, chỉ khi đăng nhập): bỏ bài mình đã có bài nộp AC.
  - "Has editorial" (`has_public_editorial`): chỉ bài có lời giải công khai đã tới ngày đăng.
  - "Show problem types" (`show_types`): hiện cột dạng bài.
  - "Category" (`category`): lọc theo một nhóm bài.
  - "Problem types" (`type`, chọn nhiều): bài thuộc bất kỳ dạng nào được chọn. Danh sách dạng được xếp theo bảng chữ cái tiếng Việt.
  - "Point range" (`point_start`, `point_end`): thanh kéo hai đầu, bước 0.01, phạm vi từ `DMOJ_PROBLEM_MIN_PROBLEM_POINTS` đến `DMOJ_PROBLEM_MAX_PROBLEM_POINTS`. Khi ô tìm kiếm có chữ, thanh điểm bị bỏ qua (phía trình duyệt).
  - Bốn ô tick (`hide_solved`, `show_types`, `full_text`, `has_public_editorial`) được lưu vào phiên (session). Mở trang không có tham số thì dùng lại giá trị đã lưu.
  - Nút "Go" để lọc, nút "Random" để mở bài ngẫu nhiên (BT-27).
  - Danh sách bài tổ chức thay bộ lọc dạng bằng bộ lọc thẻ tổ chức (xem 07).
- **Ai dùng được:** Mọi người; "Hide solved" cần đăng nhập.
- **Mã nguồn:** `judge/views/problem.py:687-724`, `judge/views/problem.py:757-805`, `templates/problem/search-form.html`, `templates/problem/list.html:26-127`.

### BT-25. Tìm kiếm toàn văn
- **Làm gì:** Tìm bài theo nội dung đề, không chỉ theo tên.
- **Cách VNOJ làm:**
  - Bật bằng cấu hình `ENABLE_FTS` (mặc định `False`). Khi bật, form có ô tick "Full text search".
  - Dùng chỉ mục toàn văn của MySQL/MariaDB trên `code`, `name`, `description`, chế độ `IN BOOLEAN MODE` (cho dùng toán tử như `+`, `-`). Kết quả xếp theo độ liên quan.
  - Nếu chuỗi tìm có chữ CJK (Trung, Nhật, Hàn), chuyển sang so khớp `LIKE` từng từ trên `code`, `name`, `description`.
  - Cú pháp sai thì trả trang lỗi "FTS syntax error" (400).
- **Ai dùng được:** Mọi người, khi máy chủ bật cấu hình.
- **Mã nguồn:** `judge/fulltext.py:7-40`, `judge/models/problem.py:97-99`, `judge/views/problem.py:667-675`, `judge/views/problem.py:709-713`, `judge/views/problem.py:789-795`, `dmoj/settings.py:725`.

### BT-26. Dấu đã giải / đã thử
- **Làm gì:** Đánh dấu trên danh sách và trang bài những bài người dùng đã giải hoặc đã thử.
- **Cách VNOJ làm:**
  - "Đã giải" = có ít nhất một bài nộp AC. "Đã thử" = có ít nhất một bài nộp bất kỳ.
  - Hai tập này được lưu đệm 86400 giây theo khóa `user_complete:<id>` và `user_attempted:<id>`.
  - Biểu tượng: dấu tích xanh (đã giải), mặt buồn (đã thử), ổ khóa (bài không công khai). Biểu tượng là liên kết tới danh sách bài nộp của mình cho bài đó (`user_submissions`).
  - Hiện ở cột đầu danh sách bài và cạnh tiêu đề trang bài.
- **Ai dùng được:** Người đã đăng nhập.
- **Mã nguồn:** `judge/utils/problems.py:35-60`, `judge/views/problem.py:110-129`, `templates/problem/list.html:206-236`, `templates/problem/problem.html:147-165`.

### BT-27. Bài ngẫu nhiên
- **Làm gì:** Mở một bài ngẫu nhiên thỏa bộ lọc hiện tại.
- **Cách VNOJ làm:**
  - Trang `/problems/random/` (tên URL `problem_random`). Dùng đúng bộ lọc của danh sách bài.
  - Không có bài nào khớp thì quay về danh sách với cùng tham số.
  - Người đang trong kỳ thi nhận 404.
  - Nút "Random" mở bài trong tab mới.
  - Danh sách tổ chức có bản riêng `problem_random_organization` (xem 07).
- **Ai dùng được:** Mọi người không đang trong kỳ thi.
- **Mã nguồn:** `judge/views/problem.py:817-828`, `templates/problem/list.html:71-77`, `dmoj/urls.py:116`, `dmoj/urls.py:312-313`.

### BT-28. Bài nổi bật (hot problems)
- **Làm gì:** Hiện danh sách bài đang được nhiều người làm ở cột phải danh sách bài.
- **Cách VNOJ làm:**
  - Số bài: `DMOJ_PROBLEM_HOT_PROBLEM_COUNT = 7`. Cửa sổ thời gian: 1 ngày.
  - Tác vụ nền `update_hot_problems` chạy mỗi 10 phút. Kết quả lưu đệm 30 phút.
  - Chỉ xét bài công khai, không riêng tổ chức, có điểm > 0 và có bài nộp trong 1 ngày.
  - Bỏ bài có số người nộp ≤ max(số người của bài đông nhất / 3, 1).
  - Xếp theo công thức: `0.5 × points × (0.4 × ac_volume / submission_volume + 0.6 × ac_rate) + 100 × e^(unique_user_count / mx)`. Trong đó `mx` là số người của bài đông nhất; `submission_volume` không đếm lỗi biên dịch.
  - Danh sách bài tổ chức không hiện mục này.
- **Ai dùng được:** Mọi người xem.
- **Mã nguồn:** `judge/utils/problems.py:91-131`, `judge/tasks/problem.py:23-25`, `dmoj/celery.py:40-46`, `judge/views/problem.py:730-731`, `templates/problem/list.html:146-157`, `dmoj/settings.py:236`.

### BT-29. Trang chi tiết bài
- **Làm gì:** Trang `/problem/<mã>` hiện đề, thông tin bài, nút nộp và các liên kết.
- **Cách VNOJ làm:**
  - Tên URL `problem_detail`.
  - **Dòng tiêu đề:** dấu đã giải/đã thử; tên bài (theo bản dịch nếu có); nhãn ổ khóa + tên tổ chức nếu bài riêng tổ chức; nút "View as PDF" (BT-30); nút "Request clarification" mở ticket mới (đăng nhập và không bị cấm nói).
  - **Cột phải, phần liên kết:**
    - "Submit solution" (luôn hiện). Trong kỳ thi có giới hạn số lần nộp: hiện số lần còn lại; hết lượt thì nút bị khóa.
    - "My submissions" (khi đã có bài nộp), "All submissions", "Best submissions" (chỉ bài công khai). Trong kỳ thi, các liên kết này trỏ về bản của kỳ thi.
    - "Read editorial" khi xem được lời giải và không đang trong kỳ thi.
    - Người sửa được bài: "Manage tickets" (kèm số ticket mở), "Edit problem", "Delete problem", "Edit test data" (trừ bài quản lý thủ công).
    - Người khác có ticket: "My tickets".
    - "Edit type group" (quyền `edit_type_group_all_problem`), "Manage submissions" (BT-22), "Clone problem" (quyền `clone_problem` và sửa được bài).
  - **Cột phải, phần thông tin:** điểm (và "(partial)"); giới hạn thời gian và bộ nhớ kèm giới hạn theo ngôn ngữ; cách nhập/xuất (`stdin`/`stdout` hoặc tên file, lấy từ cấu hình grader); tác giả; nguồn; dạng bài; ngôn ngữ được phép; danh sách bài cùng kỳ thi (khi trong kỳ thi hoặc bài có kỳ thi gốc); danh sách máy chấm khả dụng (chỉ người sửa được bài thấy).
  - **Thân trang:** đề PDF nhúng (nếu có), đề Markdown, liên kết giấy phép, nút "Request clarification".
  - Đề Markdown được lưu đệm 86400 giây theo bài, cách hiển thị công thức và ngôn ngữ. Lưu bài thì xóa bộ đệm.
  - **Hai tab dưới cùng:** "Submit Solution" (khi đăng nhập, mặc định mở) có form nộp ngay trên trang; "Comments" tải bình luận khi bấm vào (lazy-load).
  - Form nộp hiện cảnh báo khi bài đã lưu trữ lạnh, khi ngôn ngữ mặc định không dùng được, khi bài chưa có test ("This problem does not have test data.") hoặc không có máy chấm ("No judge is available for this problem.").
  - Điều kiện nộp: đăng nhập, ngôn ngữ được phép, không bị cấm (BT-13), còn lượt nộp trong kỳ thi, tổ chức còn credit. Chi tiết xem 03.
  - Trang nộp riêng: `/problem/<mã>/submit` và `/problem/<mã>/resubmit/<id>` (tên `problem_submit`, xem 03).
  - Bài đã xóa mềm hiện trang "This problem has been deleted."
- **Ai dùng được:** Người xem được bài (BT-22).
- **Mã nguồn:** `judge/views/problem.py:452-548`, `templates/problem/problem.html:145-510`, `templates/problem/problem-detail.html`, `templates/problem/submit-form.html`, `templates/problem/deleted.html`, `dmoj/urls.py:122`, `dmoj/urls.py:133-134`.

### BT-30. Xem đề dạng PDF và bản in
- **Làm gì:** Cho tải đề dưới dạng PDF hoặc in đề.
- **Cách VNOJ làm:**
  - Trang `/problem/<mã>/raw` (tên `problem_raw`): bản đề tối giản gồm tên, giới hạn thời gian/bộ nhớ (kể cả theo ngôn ngữ) và đề. Công thức hiện bằng MathJax 3.2.0. Đường dẫn được đổi thành tuyệt đối. Chỉ nhúng được trong iframe cùng tên miền.
  - Khi cấu hình `DMOJ_PDF_PDFOID_URL` (mặc định `None`): nút "View as PDF" mở `/problem/<mã>/pdf` hoặc `/problem/<mã>/pdf/<ngôn ngữ>` (tên `problem_pdf`). Máy chủ gửi trang raw tới dịch vụ pdfoid để dựng PDF. Tên file `<mã>.<ngôn ngữ>.pdf`.
  - Ngôn ngữ phải nằm trong `LANGUAGES` (`en`, `vi`), sai thì 404.
  - `DMOJ_PDF_PROBLEM_CACHE`: thư mục lưu PDF đã dựng. `DMOJ_PDF_PROBLEM_INTERNAL`: URL nội bộ để máy chủ web gửi file (X-Accel-Redirect). Lưu bài thì xóa PDF đã lưu cho mọi ngôn ngữ.
  - Khi không cấu hình pdfoid: nút "View as PDF" tải trang raw vào iframe ẩn, chờ MathJax xong rồi gọi hộp thoại in của trình duyệt.
  - Lệnh quản trị `render_pdf <mã> [-l ngôn ngữ]` dựng PDF từ dòng lệnh.
- **Ai dùng được:** Người xem được bài.
- **Mã nguồn:** `judge/views/problem.py:218-243`, `judge/views/problem.py:555-609`, `templates/problem/raw.html`, `templates/problem/problem.html:84-95`, `templates/problem/problem.html:177-187`, `judge/utils/pdfoid.py:11-44`, `judge/signals.py:56-59`, `judge/management/commands/render_pdf.py`, `dmoj/settings.py:283-287`, `dmoj/urls.py:128-130`.

### BT-31. Bản dịch đề
- **Làm gì:** Lưu tên và đề bài bằng ngôn ngữ khác.
- **Cách VNOJ làm:**
  - Model `ProblemTranslation`: `problem`, `language` (chọn trong `LANGUAGES`: `en`, `vi`), `name` (tối đa 100), `description` (qua kiểm tra ký tự cấm). Mỗi bài tối đa một bản dịch cho mỗi ngôn ngữ.
  - Không có ô chọn ngôn ngữ riêng trên trang bài. Bản dịch được chọn theo ngôn ngữ giao diện của người xem (đổi qua `i18n/`). Nếu không có bản dịch thì dùng tên và đề gốc.
  - Áp dụng ở trang bài, trang raw, PDF, danh sách bài (tên và sắp xếp theo tên), tiêu đề trang nộp, tìm kiếm thường.
  - Chỉ thêm/sửa trong admin (khối "problem translations"). Nhập Polygon cũng tạo bản dịch (BT-41).
  - Bị khóa với người thiếu `problem_full_markup` nếu bài bật `is_full_markup`.
- **Ai dùng được:** Người vào được admin bài (soạn); mọi người xem.
- **Mã nguồn:** `judge/models/problem.py:101-112`, `judge/models/problem.py:494-513`, `judge/models/problem.py:701-711`, `judge/views/problem.py:504-515`, `judge/views/problem.py:629-634`, `judge/admin/problem.py:117-133`, `dmoj/settings.py:588-591`, `dmoj/urls.py:106`.

### BT-32. Làm rõ đề (clarification)
- **Làm gì:** Ban tổ chức đăng thông báo làm rõ đề cho thí sinh trong kỳ thi.
- **Cách VNOJ làm:**
  - Model `ProblemClarification`: `problem`, `description` (Markdown, qua kiểm tra ký tự cấm), `date` (tự đặt khi tạo).
  - Chỉ tạo trong admin, khối "clarifications" của bài. Ô soạn dùng xem trước kiểu bình luận.
  - Chỉ hiện khi người xem đang trong một kỳ thi chứa bài và kỳ thi bật `use_clarifications`. Khi đó tab bình luận bị khóa và thay bằng danh sách "Clarifications" (mới nhất trước). Không có thì hiện "No clarifications have been made at this time."
  - Trang kỳ thi cũng gom các clarification của mọi bài (xem 04).
- **Ai dùng được:** Người vào được admin bài (tạo); thí sinh kỳ thi (xem).
- **Mã nguồn:** `judge/models/problem.py:714-717`, `judge/models/problem.py:515-517`, `judge/views/problem.py:175-215`, `judge/admin/problem.py:86-95`, `templates/problem/comments-tab.html`, `judge/views/contests.py:359-361`.

### BT-33. Lời giải (editorial)
- **Làm gì:** Mỗi bài có thể có một bài lời giải riêng.
- **Cách VNOJ làm:**
  - Model `Solution`: `problem` (một-một), `is_public` (mặc định `False`), `publish_on` (ngày đăng, bắt buộc), `authors` (nhiều người), `content` (Markdown, kiểu hiển thị `solution`, qua kiểm tra ký tự cấm).
  - Xem được khi: `is_public` và `publish_on` đã qua; hoặc có quyền `judge.see_private_solution`; hoặc sửa được bài.
  - Người đang trong kỳ thi luôn nhận 404, kể cả trang bình luận lời giải.
  - Trang `/problem/<mã>/editorial` (tên `problem_editorial`): tiêu đề "Editorial for <tên bài>". Người chưa giải bài thấy cảnh báo: chỉ dùng khi bí, không chép code; nộp lời giải chính thức trước khi tự giải là vi phạm có thể bị khóa tài khoản. Hiện danh sách tác giả lời giải. Người sửa được bài thấy nút "Edit" vào admin.
  - Bình luận riêng cho lời giải, khóa trang `s:<mã>`, tải qua `problem_editorial_comments`.
  - Soạn trên trang sửa bài (khối "Editorial": `is_public`, `publish_on` dạng ô ngày, `authors`, `content`) hoặc trong admin.
  - Danh sách bài có cột và bộ lọc lời giải (BT-23, BT-24).
- **Ai dùng được:** Người sửa được bài (soạn); người xem theo điều kiện trên.
- **Mã nguồn:** `judge/models/problem.py:736-768`, `judge/views/problem.py:62-71`, `judge/views/problem.py:132-172`, `judge/forms.py:136-144`, `judge/admin/problem.py:98-114`, `templates/problem/editorial.html`, `templates/problem/editor.html:256-257`, `dmoj/urls.py:126-127`.

### BT-34. Tạo bài mới
- **Làm gì:** Tạo bài từ trang web.
- **Cách VNOJ làm:**
  - Trang `/problems/create` (tên `problem_create`). Cần quyền `judge.add_problem`.
  - Form gồm: `code`, `name`, `time_limit`, `memory_limit`, `points`, `partial`, `statement_file`, `source`, `types`, `group`, `submission_source_visibility_mode`, `testcase_visibility_mode`, `description`, `testers`.
  - Giá trị mặc định: đề = mẫu `description_example`; `memory_limit` = 262144; `partial` = bật; nhóm `Uncategorized`; dạng `uncategorized`.
  - Sau khi lưu: người tạo thành `curators`; ngôn ngữ được phép = mọi ngôn ngữ có `include_in_problem`; `date` = bây giờ; bài mặc định ẩn (`is_public=False`). Ghi một bản lịch sử "Created on site".
  - Người có `judge.import_polygon_package` thấy liên kết nhập gói Polygon.
  - Tạo bài trong tổ chức dùng trang `problem_create_organization`, cần `judge.create_organization_problem`, có kiểm tra hạn mức số bài/dung lượng, bài tự thành riêng tổ chức, người tạo thành `authors`, có gửi webhook `on_new_problem` (xem 07).
  - Lệnh quản trị `create_problem <code> <name> <body> <type> <group>` tạo bài rỗng từ dòng lệnh.
- **Ai dùng được:** Người có `judge.add_problem`.
- **Mã nguồn:** `judge/views/problem.py:937-987`, `judge/forms.py:247-251`, `templates/problem/create.html`, `judge/views/organization.py:955-998`, `judge/management/commands/create_problem.py`, `dmoj/urls.py:117`.

### BT-35. Sửa bài trên trang
- **Làm gì:** Sửa bài bằng form trên trang thay vì admin.
- **Cách VNOJ làm:**
  - Trang `/problem/<mã>/edit` (tên `problem_edit`). Không sửa được thì hiện "Can't edit problem" (403).
  - Cùng các trường như form tạo (BT-34). Bài tổ chức có thêm `is_public` và `tags`, không có `types`.
  - Kèm bảng giới hạn theo ngôn ngữ (BT-08) và khối lời giải (BT-33). Ba phần được lưu cùng lúc.
  - Ghi lịch sử "Edited from site".
  - Nhân viên thấy liên kết "Edit problem in admin panel for more options". Người có `import_polygon_package` thấy liên kết cập nhật từ Polygon.
  - Lưu xong chuyển về trang bài.
- **Ai dùng được:** Người sửa được bài.
- **Mã nguồn:** `judge/views/problem.py:1072-1149`, `judge/forms.py:175-280`, `templates/problem/editor.html:212-261`, `dmoj/urls.py:124`.

### BT-36. Trang quản trị bài và lịch sử sửa
- **Làm gì:** Giao diện admin Django để sửa mọi trường của bài.
- **Cách VNOJ làm:**
  - Các nhóm trường: chung (`code`, `name`, `is_public`, `is_manually_managed`, `date`, `authors`, `curators`, `testers`, `is_organization_private`, `organization`, ba chế độ hiển thị, `allow_view_feedback`, `is_full_markup`, `pdf_url`, `source`, `description`, `license`); "Social Media" (thu gọn); "Taxonomy"; "Points"; "Limits"; "Language"; "Justice"; "Storage"; "History".
  - Khối con: giới hạn theo ngôn ngữ, clarification, lời giải, bản dịch.
  - Danh sách: cột mã, tên, tác giả, điểm, công khai, liên kết "View on site". Lọc theo `is_public` và tác giả. Tìm theo mã, tên, tên đăng nhập tác giả/quản lý. Phân cấp theo `date`.
  - Chỉ hiện các bài người dùng sửa được. Không cho xóa hàng loạt (`NoBatchDeleteMixin`).
  - Lịch sử phiên bản bằng django-reversion (lưu lại từng lần sửa và cho xem/khôi phục). Ô "Edit reason" (tối đa 256 ký tự) để ghi lý do sửa.
- **Ai dùng được:** Nhân viên có `judge.edit_own_problem` và sửa được bài.
- **Mã nguồn:** `judge/admin/problem.py:29-59`, `judge/admin/problem.py:136-255`.

### BT-37. Sửa dạng/nhóm cho mọi bài
- **Làm gì:** Cho người phân loại sửa dạng và nhóm của bất kỳ bài nào, không cần quyền sửa bài.
- **Cách VNOJ làm:**
  - Trang `/problem/<mã>/edit-type-group` (tên `problem_edit_type_group`). Form chỉ có `types` và `group`.
  - Ghi lịch sử "Edited types/group from site".
  - Trang bài hiện liên kết "Edit type group" cho người có quyền.
- **Ai dùng được:** Người có `judge.edit_type_group_all_problem` (và xem được bài).
- **Mã nguồn:** `judge/views/problem.py:1152-1174`, `judge/forms.py:283-290`, `templates/problem/problem.html:265-267`, `dmoj/urls.py:125`.

### BT-38. Nhân bản bài
- **Làm gì:** Tạo bài mới bằng cách sao chép một bài có sẵn.
- **Cách VNOJ làm:**
  - Trang `/problem/<mã>/clone` (tên `problem_clone`). Chỉ hỏi mã mới. Mã phải đúng quy tắc và chưa tồn tại.
  - Sao chép các trường thường của bài (tên, đề, giới hạn, điểm, nguồn, nhóm, các chế độ…), dạng bài, ngôn ngữ được phép, tổ chức.
  - Đặt lại: `is_public=False`, `ac_rate=0`, `user_count=0`, `date` = bây giờ. Người nhân bản thành `curators`.
  - Không sao chép: tác giả, người quản lý cũ, người thử, người bị cấm, thẻ tổ chức, bản dịch, lời giải, clarification, dữ liệu test.
  - Giới hạn theo ngôn ngữ được gán bằng `language_limits.set(...)` trên quan hệ khóa ngoại ngược. Theo cách Django xử lý lệnh này, các bản ghi giới hạn có thể bị chuyển sang bài mới thay vì sao chép (chưa kiểm tra bằng cách chạy).
  - Ghi lịch sử "Cloned problem from <mã cũ>". Xong thì chuyển tới trang sửa bài mới.
- **Ai dùng được:** Người có `judge.clone_problem` và sửa được bài gốc.
- **Mã nguồn:** `judge/views/problem.py:897-934`, `judge/forms.py:690-697`, `templates/problem/clone.html`, `dmoj/urls.py:131`.

### BT-39. Xóa bài (xóa mềm và dọn rác)
- **Làm gì:** Xóa bài theo hai bước: đánh dấu xóa, rồi xóa hẳn sau một thời gian chờ.
- **Cách VNOJ làm:**
  - Trang `/problem/<mã>/delete` (tên `problem_delete`). Trang xác nhận ghi "This action cannot be undone." và liệt kê các kỳ thi đang dùng bài. Không có kỳ thi nào thì ghi "This problem is not used in any contests."
  - Bấm xóa thì đặt `deleted_at` = bây giờ (xóa mềm) và ghi lịch sử "Marked as deleted". Bài thuộc tổ chức thì xóa bộ đệm biểu đồ dung lượng của tổ chức.
  - Bài đã xóa mềm: biến mất khỏi danh sách và tìm kiếm (`Problem.available`); mở trang bài thì thấy "This problem has been deleted."
  - Không có chức năng khôi phục trên trang hay trong admin.
  - Tác vụ nền `problem_garbage_collect` chạy theo `VNOJ_PROBLEM_GARBAGE_COLLECTOR_CRONTAB_KWARGS = {'minute': 0, 'hour': 0}` (0 giờ mỗi ngày). Nó xóa hẳn các bài có `deleted_at` cũ hơn `VNOJ_PROBLEM_DELETION_GRACE_PERIOD = 7 ngày`. Mỗi lần chạy tối đa `VNOJ_PROBLEM_GARBAGE_COLLECTOR_TIME_LIMIT = 1 giờ`.
  - Khi xóa hẳn: xóa kết quả test của bài nộp, xóa bài (kéo theo bài nộp), không tính lại điểm người dùng và kết quả kỳ thi. Sau đó xóa dữ liệu test trên ổ đĩa.
  - Tổ chức có thao tác xóa hàng loạt tối đa 200 bài (xem 07).
- **Ai dùng được:** Người sửa được bài.
- **Mã nguồn:** `judge/views/problem.py:1177-1211`, `judge/models/problem.py:118-126`, `judge/models/problem.py:246`, `judge/models/problem.py:650-666`, `judge/tasks/problem.py:13-20`, `judge/utils/problems.py:134-147`, `judge/signals.py:62-64`, `templates/problem/confirm_delete.html`, `dmoj/celery.py:33-39`, `dmoj/settings.py:238-245`, `dmoj/urls.py:132`.

### BT-40. Lưu trữ lạnh (archive)
- **Làm gì:** Chuyển dữ liệu test của bài lâu không ai nộp sang kho lưu trữ rẻ, và cho khôi phục.
- **Cách VNOJ làm:**
  - `archived_at`: khi có giá trị, dữ liệu test của bài đã nằm ở kho lạnh.
  - Việc chuyển dữ liệu do một dịch vụ bên ngoài làm. Site gọi dịch vụ qua `VNOJ_PROBLEM_ARCHIVE_SERVICE_URL` và `VNOJ_PROBLEM_ARCHIVE_SERVICE_TOKEN` (mặc định `None`), với ba lệnh: `/archive`, `/restore`, `/download`.
  - Thông báo trên form nộp: "This problem has been archived because it has had no submissions in the past 6 months." Quản trị tổ chức thấy liên kết khôi phục; người khác được bảo liên hệ quản trị tổ chức.
  - `VNOJ_PROBLEM_ARCHIVE_RETENTION = 180 ngày`: chỉ dùng để báo cho người dùng khi nào dữ liệu lưu trữ hết hạn.
  - Bài đã lưu trữ: không mở được trang sửa test, không rejudge được.
  - Khôi phục: quản trị tổ chức bấm khôi phục ở trang `organization_archived_problems`; có kiểm tra hạn mức tổ chức. Chi tiết xem 07.
  - Tải dữ liệu đã lưu trữ: xem BT-42.
- **Ai dùng được:** Hệ thống (lưu trữ); quản trị tổ chức (khôi phục).
- **Mã nguồn:** `judge/models/problem.py:247-248`, `judge/models/problem.py:654-656`, `judge/utils/problem_archive.py:15-87`, `templates/problem/submit-form.html:1-11`, `judge/views/problem_data.py:198-203`, `judge/views/widgets.py:32-33`, `judge/views/organization.py:1218-1275`, `dmoj/settings.py:198-199`, `dmoj/settings.py:240-242`.

### BT-41. Nhập và cập nhật bài từ Polygon
- **Làm gì:** Tạo hoặc cập nhật bài từ gói đầy đủ (full package) xuất từ Codeforces Polygon, một hệ thống soạn đề.
- **Cách VNOJ làm:**
  - Trang nhập: `/problems/import-polygon` (tên `problem_import_polygon`). Trang cập nhật: `/problem/<mã>/update-polygon` (tên `problem_update_polygon`), mã bị khóa.
  - Form: mã bài, file zip, "Ignore zero-point batches", "Ignore zero-point cases", "Append main solution to tutorial" (mặc định bật), ngôn ngữ lời giải chính, và bảng ghép ngôn ngữ đề Polygon với ngôn ngữ site.
  - Máy chủ cần `pandoc` phiên bản ≥ 3.0.0 để đổi LaTeX sang Markdown.
  - Kiểm tra: mã hợp lệ; nhập mới thì mã chưa tồn tại, cập nhật thì mã phải tồn tại; có `problem.xml`; có testset `tests`; có ít nhất một test; gói phải là gói đầy đủ.
  - Đề được ghép từ các phần: legend, Input, Output, Interaction, Scoring, các Sample Input/Output, Notes. Ảnh trong đề được tải lên kho ảnh martor (khử trùng theo SHA1). Lỗi giữa chừng thì xóa ảnh đã tải.
  - Một ngôn ngữ đề là đề chính; các ngôn ngữ khác thành bản dịch (BT-31).
  - Lời giải (tutorial) được tạo ở trạng thái ẩn, `publish_on` = bây giờ. Có thể nối thêm code lời giải chính trong khối spoiler.
  - Giới hạn thời gian và bộ nhớ lấy từ gói (đổi ms → giây, byte → KB, kẹp trong phạm vi cho phép).
  - Giá trị đặt cho bài: `points = 0.01`, nhóm và dạng có id nhỏ nhất, ngôn ngữ có `include_in_problem`, người nhập thành `authors`. Bản dịch và lời giải cũ bị thay hoàn toàn.
  - Phần test, checker, interactor, batch, điểm và sinh `init.yml` xem 03.
  - Lệnh quản trị `import_polygon_package <gói> <mã> [--update] [--authors ...] [--curators ...]`.
- **Ai dùng được:** Người có `judge.import_polygon_package`. Cập nhật cần thêm quyền sửa bài.
- **Mã nguồn:** `judge/views/problem.py:990-1069`, `judge/forms.py:293-320`, `judge/utils/codeforces_polygon.py:269-345`, `judge/utils/codeforces_polygon.py:638-850`, `judge/utils/codeforces_polygon.py:851-895`, `templates/problem/import-polygon.html`, `judge/management/commands/import_polygon_package.py`, `dmoj/urls.py:118`, `dmoj/urls.py:135`.

### BT-42. Tải gói bài
- **Làm gì:** Cho người sửa bài tải toàn bộ bài về máy.
- **Cách VNOJ làm:**
  - `/problem/<mã>/download/package` (tên `problem_download_full_package`): file `<mã>_package.zip` gồm `statement.md` (đề Markdown), `statement.pdf` (tải từ `pdf_url`, chờ tối đa 10 giây), file zip test, checker, grader, header tùy chỉnh nếu có. Lỗi từng phần được ghi vào file `*_error.txt` trong gói.
  - `/problem/<mã>/download/archive` (tên `problem_download_archived_data`): chỉ cho bài đã lưu trữ lạnh. Chuyển hướng tới URL tải tạm do dịch vụ lưu trữ cấp. Lỗi thì báo và quay lại trang trước.
  - Bài không sửa được thì trả 404.
  - Liên kết tải nằm ở bảng bài của tổ chức (xem 07).
- **Ai dùng được:** Người đăng nhập sửa được bài.
- **Mã nguồn:** `judge/views/problem_download.py:21-123`, `templates/organization/problem-table.html:81-89`, `dmoj/urls.py:148-151`.

### BT-43. Trình soạn Markdown (martor)
- **Làm gì:** Ô soạn đề, lời giải, giấy phép, clarification có thanh công cụ và xem trước.
- **Cách VNOJ làm:**
  - Thư viện martor (bản nhúng trong thư mục `martor/`), dựa trên trình soạn Ace.
  - Thanh công cụ: tiêu đề, đậm, nghiêng, gạch, trích dẫn, code, khối code, danh sách có/không thứ tự, đường kẻ, liên kết, chèn ảnh bằng link, tải ảnh lên, nhắc tên người dùng, công thức toán trong dòng và khối, LaTeX, phóng to toàn màn hình, trợ giúp.
  - Xem trước: gửi nội dung tới URL xem trước tương ứng: `problem_preview`, `solution_preview`, `license_preview`, `comment_preview`…
  - Tải ảnh: `/widgets/martor/upload-image` (tên `martor_image_uploader`). Cần đăng nhập và là nhân viên hoặc có `judge.can_upload_image`. Đuôi hợp lệ `MARTOR_UPLOAD_SAFE_EXTS = {'.jpg', '.png', '.gif', '.svg'}`; đuôi khác bị đổi thành `.png`. Lưu vào `MARTOR_UPLOAD_MEDIA_DIR = 'martor'`, tên UUID, URL tiền tố `/martor`.
  - Nhắc tên: gõ `[user:` để gợi ý tên. Gợi ý lấy từ `/widgets/martor/search-user` (cần đăng nhập, tìm người dùng đang hoạt động có tên chứa chuỗi gõ).
  - `MARTOR_ENABLE_CONFIGS`: `imgur` bật, `mention` bật, `living` (xem trước trực tiếp) tắt, `hljs` tắt.
- **Ai dùng được:** Người soạn nội dung; tải ảnh cần nhân viên hoặc `judge.can_upload_image`.
- **Mã nguồn:** `martor/templates/martor/toolbar.html`, `martor/views.py:11-42`, `martor/static/martor/js/martor.js:107-113`, `judge/views/widgets.py:45-55`, `judge/views/widgets.py:83-93`, `judge/views/preview.py:17-50`, `dmoj/settings.py:688-702`, `dmoj/urls.py:380-397`.

### BT-44. Hiển thị đề: Markdown, công thức toán, lọc HTML, ký tự cấm
- **Làm gì:** Biến Markdown của đề thành HTML an toàn và hiện công thức toán.
- **Cách VNOJ làm:**
  - Dùng thư viện `markdown2` (bản sửa của VNOI) với các phần mở rộng: `vnoj-latex`, `spoiler`, `fenced-code-blocks`, `cuddled-lists`, `tables`, `strike`, `nofollow`.
  - Tiêu đề trong đề bị hạ 2 cấp (`#` thành `<h3>`). Bảng có class `table`.
  - Kiểu `problem` và `solution` (`MARKDOWN_EMBEDDED_ALLOWED_STYLE`): cho HTML trong danh sách thẻ an toàn, thêm `object` và `iframe`, cho thuộc tính `style` trong giới hạn. Liên kết ngoài có `nofollow`.
  - Bộ lọc HTML (sanitizer) dùng thư viện `nh3`: chỉ giữ thẻ và thuộc tính trong `MARKDOWN_SAFE_TAGS`, `MARKDOWN_SAFE_ATTRS`; URL chỉ nhận `http`, `https`, `mailto`.
  - Ảnh có thể đi qua proxy camo (máy chủ trung gian tải ảnh ngoài) khi cấu hình (`use_camo`).
  - Chuỗi `[user:tên]` và `[ruser:tên]` được đổi thành liên kết tên người dùng có màu theo hạng (bộ lọc `reference`).
  - Công thức: MathJax 3.2.0 chạy ở trình duyệt, gói `color`. Công thức trong dòng viết `~...~` hoặc `\(...\)`.
  - Người dùng chọn cách hiện công thức trong hồ sơ: `tex` (để nguyên LaTeX), `svg`, `mml`, `jax` (MathJax), `auto` (mặc định; chọn `mml` nếu có `MATHOID_URL` và trình duyệt hỗ trợ MathML, ngược lại `jax`). Giá trị này được dùng làm khóa bộ đệm và để quyết định có nạp MathJax hay không. Hàm `markdown` hiện không dùng tham số `math_engine`, và không có mã nào gọi `judge/utils/mathoid.py`; cách hiện công thức ở chế độ `svg`/`mml` (chưa kiểm tra), có thể nằm trong phần mở rộng `vnoj-latex` của bản `markdown2` của VNOI.
  - Ký tự cấm: `DMOJ_PROBLEM_STATEMENT_DISALLOWED_CHARACTERS = {'“', '”', '‘', '’', '−', 'ﬀ', 'ﬁ', 'ﬂ', 'ﬃ', 'ﬄ'}` (ngoặc kép cong, dấu trừ Unicode, chữ ghép). Áp dụng cho tên bài, đề, bản dịch, clarification, lời giải. Có ký tự cấm thì lưu bị lỗi "Disallowed characters: ...".
- **Ai dùng được:** Áp dụng cho mọi người xem; cách hiện công thức do từng người chọn.
- **Mã nguồn:** `judge/jinja2/markdown/__init__.py:22-143`, `judge/jinja2/reference.py:17-63`, `judge/models/problem.py:28-32`, `judge/template_context.py:129-139`, `judge/models/choices.py:59-67`, `resources/mathjax_config.js`, `templates/mathjax-load.html`, `dmoj/settings.py:247`, `dmoj/settings.py:593-686`.

### BT-45. Chia sẻ và SEO: ảnh OpenGraph, tóm tắt, RSS/Atom, sitemap
- **Làm gì:** Cung cấp mô tả và ảnh khi chia sẻ bài lên mạng xã hội, nguồn tin bài mới và sơ đồ trang cho máy tìm kiếm.
- **Cách VNOJ làm:**
  - `og_image` (tối đa 150 ký tự): ảnh OpenGraph (thẻ meta dùng khi chia sẻ link).
  - `summary`: văn bản thuần, dùng cho thẻ meta description.
  - Nếu trống, hệ thống tự lấy đoạn văn đầu tiên của đề (cắt 60 từ) và ảnh đầu tiên trong đề. Kết quả lưu đệm 86400 giây theo ngôn ngữ.
  - Hai trường này chỉ sửa trong admin, nhóm "Social Media".
  - RSS `/feed/problems/rss/` (tên `problem_rss`) và Atom `/feed/problems/atom/` (tên `problem_atom`): 25 bài công khai, không riêng tổ chức, mới nhất theo `date`. Mỗi mục có 500 ký tự đầu của đề đã dựng HTML, lưu đệm 86400 giây.
  - Sitemap: mọi bài công khai, tần suất `weekly`, độ ưu tiên 0.8.
- **Ai dùng được:** Người vào được admin bài (sửa); mọi người (xem).
- **Mã nguồn:** `judge/models/problem.py:227-229`, `judge/views/problem.py:517-521`, `judge/utils/opengraph.py:8-24`, `judge/feed.py:12-39`, `judge/sitemap.py:9-17`, `judge/admin/problem.py:146`, `dmoj/urls.py:401-402`.

### BT-46. Trang bài nộp tốt nhất (/rank/)
- **Làm gì:** Xếp hạng bài nộp tốt nhất của mỗi người cho một bài.
- **Cách VNOJ làm:**
  - Trang `/problem/<mã>/rank/` (tên `ranked_submissions`), có phân trang.
  - Chỉ có cho bài công khai; bài ẩn trả 404.
  - Mỗi người lấy một bài nộp: điểm cao nhất, nếu bằng thì thời gian chạy ít nhất, rồi id nhỏ nhất. Chỉ tính bài nộp có điểm > 0. Bỏ người dùng ẩn danh sách.
  - Xếp theo điểm giảm dần, rồi thời gian chạy tăng dần.
  - Tiêu đề "Best solutions for <tên bài>". Không có thanh lọc và biểu đồ.
  - Bản của kỳ thi: `contest_ranked_submissions` (xem 04). Các trang danh sách bài nộp khác xem 03.
- **Ai dùng được:** Người xem được bài (theo kiểm tra quyền của trang bài nộp).
- **Mã nguồn:** `judge/views/ranked_submission.py:15-78`, `dmoj/urls.py:137`, `dmoj/urls.py:258-259`.

### BT-47. Điểm nối sang khu vực khác (tổ chức, bình luận, ticket, bài nộp)
- **Làm gì:** Ghi lại các chức năng gắn với bài nhưng thuộc tài liệu khác.
- **Cách VNOJ làm:**
  - **Bài riêng của tổ chức:** `organization` (khóa ngoại, `SET_NULL`) và `is_organization_private` (mặc định `False`). Khi bật, chỉ thành viên tổ chức hoặc người có `see_organization_problem` xem được bài công khai này. Danh sách bài chung không hiện bài riêng tổ chức. Tổ chức có danh sách bài, hạn mức số bài (`VNOJ_ORGANIZATION_DEFAULT_MAX_PROBLEMS = 1000`), credit chấm bài, xóa hàng loạt, lưu trữ. Xem 07.
  - **Bình luận bài:** tab "Comments" trên trang bài, khóa trang `p:<mã>`, trang riêng `/problem/<mã>/comments` (tên `problem_comments`). Bị khóa khi đang dùng clarification của kỳ thi. Xem 06.
  - **Ticket của bài:** nút "Request clarification" mở `/problem/<mã>/tickets/new` (tên `new_problem_ticket`); danh sách `problem_ticket_list`. Người sửa bài thấy mọi ticket, người khác chỉ thấy ticket của mình. Xem 06.
  - **Bài nộp, dữ liệu test, rejudge, rescore, quản lý bài nộp:** `chronological_submissions`, `user_submissions`, `problem_data`, `problem_manage_submissions`… Xem 03.
  - **Bài trong kỳ thi:** điểm riêng, giới hạn lượt nộp, ẩn tác giả/dạng bài, nhãn bài. Xem 04.
- **Ai dùng được:** Xem các tài liệu tương ứng.
- **Mã nguồn:** `judge/models/problem.py:255-258`, `judge/views/problem.py:189-195`, `judge/views/problem.py:493-498`, `templates/problem/problem.html:188-191`, `templates/problem/problem.html:244-263`, `dmoj/urls.py:123`, `dmoj/urls.py:138-166`, `dmoj/settings.py:163`.
