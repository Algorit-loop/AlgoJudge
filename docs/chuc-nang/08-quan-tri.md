# 08. Quản trị và vận hành

Nguồn: `VNOI-Admin/OJ` commit `209a32e` (04/11/2026), thư mục `reference/vnoj-src/site/`. Phần quản trị nằm ở trang quản trị Django (`judge/admin/`, `templates/admin/`), các trang riêng cho superuser (`judge/views/misc_config.py`, `judge/views/status.py`, `judge/views/stats.py`, `judge/views/tasks.py`). Phần vận hành nằm ở `dmoj/settings.py`, `dmoj/celery.py`, `judge/tasks/`, `judge/management/commands/`, `judge/middleware.py`, `websocket/` và các tệp ở gốc thư mục.

## Bảng quyết định

| Mã | Chức năng | Quyết định | Ghi chú |
|---|---|---|---|
| QT-01 | Trang quản trị Django: khung chung | | |
| QT-02 | Quản trị bài | | |
| QT-03 | Quản trị bài nộp (chấm lại, tính lại điểm) | | |
| QT-04 | Quản trị máy chấm và ngôn ngữ | | |
| QT-05 | Quản trị kỳ thi và lượt tham gia | | |
| QT-06 | Quản trị người dùng và hồ sơ | | |
| QT-07 | Quản trị bình luận | | |
| QT-08 | Quản trị blog | | |
| QT-09 | Quản trị nội dung tĩnh: trang phẳng, menu, giấy phép, huy hiệu, chuyển hướng | | |
| QT-10 | Quản trị phân loại bài | | |
| QT-11 | Quản trị ticket | | |
| QT-12 | Nhật ký thao tác và lịch sử phiên bản | | |
| QT-13 | Hệ thống phân quyền | | |
| QT-14 | Đăng nhập thay người khác (impersonate) | | |
| QT-15 | Cấu hình trang trên giao diện (`misc_config`) | | |
| QT-16 | Tác vụ nền và trang trạng thái tác vụ | | |
| QT-17 | Danh sách tác vụ Celery và lịch chạy định kỳ | | |
| QT-18 | Webhook Discord và cảnh báo vận hành | | |
| QT-19 | Lệnh quản trị dòng lệnh (management commands) | | |
| QT-20 | Bộ nhớ đệm (cache) | | |
| QT-21 | Khóa bảng CSDL | | |
| QT-22 | Máy chủ sự kiện thời gian thực (websocket) | | |
| QT-23 | Tiến trình bridge, balancer và cách chạy web | | |
| QT-24 | Email | | |
| QT-25 | Đa ngôn ngữ | | |
| QT-26 | Múi giờ | | |
| QT-27 | Cờ cấu hình toàn site | | |
| QT-28 | Chế độ thi chính thức | | |
| QT-29 | Chế độ tiết kiệm tài nguyên | | |
| QT-30 | Ghi log | | |
| QT-31 | Rút gọn URL | | |
| QT-32 | Trang trạng thái máy chấm | | |
| QT-33 | Trang thống kê OJ cho superuser | | |
| QT-34 | Middleware bảo mật và xác thực | | |
| QT-35 | Giới hạn tần suất | | |
| QT-36 | Tải dữ liệu người dùng và kỳ thi (phía vận hành) | | |
| QT-37 | Sitemap và robots.txt | | |
| QT-38 | Sao lưu | | |
| QT-39 | Thành phần triển khai trong repo | | |

## Chi tiết

### QT-01. Trang quản trị Django: khung chung
- **Làm gì:** Giao diện quản trị dữ liệu dựng sẵn của Django, có tùy biến cho VNOJ.
- **Cách VNOJ làm:**
  - Đường dẫn `/admin/`. Menu người dùng trên site hiện link "Admin" cho staff và superuser.
  - Các mô hình được đăng ký: `BlogPost`, `BlogPostTag`, `Comment`, `CommentLock`, `Contest`, `ContestParticipation`, `ContestTag`, `FlatPage`, `Judge`, `Language`, `License`, `LogEntry`, `MiscConfig`, `Badge`, `NavigationBar`, `Organization`, `OrganizationProblemTag`, `OrganizationRequest`, `Problem`, `ProblemGroup`, `ProblemType`, `Profile`, `Submission`, `Ticket`, `User`. Các app ngoài tự đăng ký thêm mô hình của chúng, ví dụ `Group`, `Site`, `Redirect`, `RegistrationProfile` (theo menu `wpadmin`; danh sách đầy đủ chưa kiểm tra). App `urlshortener` không có `admin.py`, nên không có màn hình trong admin.
  - Nếu cài gói `wpadmin`, menu trái được nhóm sẵn: Bài (kèm nhóm, dạng, giấy phép), Bài nộp, Ngôn ngữ (kèm máy chấm), Kỳ thi (kèm lượt tham gia, nhãn kỳ thi), Ticket, Người dùng (kèm hồ sơ, huy hiệu, nhóm, đăng ký), Tổ chức (kèm yêu cầu), Thanh menu (kèm Site, Redirect), Blog (kèm nhãn), Bình luận (kèm khóa), Trang phẳng, MiscConfig.
  - Nhiều màn hình dùng `VersionAdmin` (gói `django-reversion`): mỗi lần lưu tạo một phiên bản, xem và khôi phục được.
  - `AdminFastPaginationMixin` (bài, bài nộp, kỳ thi): không đếm `COUNT(*)`, chỉ lấy thêm 1 dòng để biết có trang sau. Thêm `?count_all=1` để đếm thật.
  - `NoBatchDeleteMixin` (bài, kỳ thi, hồ sơ): bỏ thao tác "xóa các mục đã chọn".
  - Trang `base_site.html` thêm cơ chế "action-link": các nút như Chấm lại, Ngắt kết nối gửi bằng POST kèm CSRF.
  - Token API (Bearer) không vào được `/admin/` (trả 403).
- **Ai dùng được:** Người có `is_staff`; từng màn hình cần quyền Django tương ứng.
- **Mã nguồn:** `judge/admin/__init__.py:21-47`, `dmoj/settings.py:355-443`, `judge/admin/utils.py`, `judge/utils/views.py:41-46`, `templates/admin/base_site.html`, `judge/middleware.py:162-163`, `templates/base.html:340-341`, `dmoj/urls.py:105`.

### QT-02. Quản trị bài
- **Làm gì:** Sửa mọi thuộc tính bài trong admin Django.
- **Cách VNOJ làm:**
  - Nhóm trường: chung (mã, tên, công khai, quản lý tay, ngày, tác giả, curator, tester, riêng tổ chức, tổ chức, các chế độ hiển thị mã nguồn/test/kết quả, xem phản hồi checker, full markup, URL PDF, nguồn, đề, giấy phép), Mạng xã hội, Phân loại (dạng, nhóm, nhãn tổ chức), Điểm, Giới hạn, Ngôn ngữ, "Justice" (người bị cấm nộp), Lưu trữ, Lịch sử (ghi chú thay đổi).
  - Bảng con: giới hạn theo ngôn ngữ, làm rõ đề, lời giải, bản dịch đề.
  - Cột danh sách: mã, tên, tác giả, điểm, công khai, link xem. Lọc theo công khai và theo người tạo. Tìm theo mã, tên, tác giả, curator. Phân cấp theo ngày.
  - Thao tác hàng loạt (cần `judge.change_public_visibility`): "Mark problems as public and set publish date to now", "Mark problems as private". Cả hai đặt lịch tính lại điểm bài.
  - Trường bị khóa nếu thiếu quyền: `is_public` (`change_public_visibility`), `is_manually_managed` (`change_manually_managed`), `is_full_markup` và đề bài full markup (`problem_full_markup`).
  - Chỉ liệt kê bài người dùng sửa được. Lưu thay đổi `is_public`, `is_organization_private`, `partial` thì tự tính lại điểm.
  - Trang sửa có nút "View Submissions" mở danh sách bài nộp lọc theo mã bài.
  - Chi tiết nghiệp vụ bài: xem 02.
- **Ai dùng được:** Staff có `judge.edit_own_problem` (bài của mình) hoặc quyền rộng hơn.
- **Mã nguồn:** `judge/admin/problem.py:62-73`, `judge/admin/problem.py:136-252`, `templates/admin/judge/problem/change_form.html`.

### QT-03. Quản trị bài nộp (chấm lại, tính lại điểm)
- **Làm gì:** Xem, sửa, chấm lại và tính lại điểm bài nộp.
- **Cách VNOJ làm:**
  - Cột: id, mã bài, tên bài, người nộp, thời gian, bộ nhớ, điểm, ngôn ngữ, trạng thái, kết quả, nút Chấm lại (hoặc "Locked" nếu bài nộp bị khóa).
  - Lọc theo ngôn ngữ, trạng thái (gồm "None", "Not done", "Exceptional"), kết quả (gồm "None", "Unaccepted"). Tìm theo mã bài, tên bài, tên người dùng.
  - Bảng con: mã nguồn, kết quả từng test, thông tin kỳ thi.
  - Không thêm mới được. Trường `locked_after` chỉ sửa được với quyền `judge.lock_submission`.
  - Thao tác "Rejudge the selected submissions": cần `judge.rejudge_submission` và `judge.edit_own_problem`. Quá `DMOJ_SUBMISSIONS_REJUDGE_LIMIT = 10` bài thì cần thêm `judge.rejudge_submission_lot`. Người không có `judge.edit_all_problem` chỉ chấm lại bài nộp vào bài mình là tác giả/curator.
  - Thao tác "Rescore the selected submissions": tính lại điểm từ `case_points/case_total`, cập nhật điểm người dùng, xóa bộ đệm bài đã giải, tính lại kết quả kỳ thi.
  - Nút chấm lại một bài nộp: URL admin `judge_submission_rejudge` (POST).
- **Ai dùng được:** Staff có `judge.edit_own_problem`; chỉ thấy bài nộp vào bài của mình nếu thiếu `judge.edit_all_problem`.
- **Mã nguồn:** `judge/admin/submission.py:25-58`, `judge/admin/submission.py:121-260`, `dmoj/settings.py:253-254`, `templates/admin/judge/submission/change_form.html`.

### QT-04. Quản trị máy chấm và ngôn ngữ
- **Làm gì:** Đăng ký máy chấm, ngắt kết nối, tạm tắt, quản lý ngôn ngữ.
- **Cách VNOJ làm:**
  - Máy chấm (`JudgeAdmin`): trường `name`, `auth_key` (có nút "Regenerate" tạo khóa ngẫu nhiên 75 byte base64 ngay trong trình duyệt), `is_blocked`, `is_disabled`, `tier`, mô tả. Chỉ đọc: thời điểm tạo, online, IP cuối, thời gian khởi động, ping, tải, runtime.
  - Nút trên trang sửa: "Disconnect", "Terminate" (ngắt cưỡng bức), "Disable"/"Enable" (đảo `is_disabled`).
  - Không đổi tên khi máy chấm đang online. Không xóa được máy chấm đang online.
  - Ngôn ngữ (`LanguageAdmin`): `key`, `name`, `short_name`, `common_name`, `file_only`, `file_size_limit`, `include_in_problem`, `ace`, `pygments`, `info`, `extension`, mô tả, mẫu mã. Tạo ngôn ngữ mới có `include_in_problem` thì tự gán cho mọi bài.
  - Logic điều phối chấm: xem 03.
- **Ai dùng được:** Staff có quyền thay đổi `Judge` / `Language`.
- **Mã nguồn:** `judge/admin/runtime.py:23-128`, `templates/admin/judge/judge/change_form.html`.

### QT-05. Quản trị kỳ thi và lượt tham gia
- **Làm gì:** Sửa kỳ thi, xếp hạng rating, khóa bài nộp, quản lý lượt tham gia.
- **Cách VNOJ làm:**
  - Thao tác hàng loạt: "Mark contests as visible/hidden" (cần `judge.change_contest_visibility` hoặc `judge.create_private_contest`), "Lock/Unlock contest submissions" (cần `judge.lock_contest`).
  - URL riêng: tính rating tất cả (`judge_contest_rate_all`), tính rating một kỳ thi, xóa dữ liệu replay, chấm lại hoặc tính lại điểm một bài trong kỳ thi, gửi lại thông báo.
  - Lượt tham gia: thao tác "Recalculate results"; đổi `is_disqualified` thì gọi `set_disqualified`.
  - Chi tiết: xem 04.
- **Ai dùng được:** Staff; chỉ thấy kỳ thi của mình nếu thiếu `judge.edit_all_contest`.
- **Mã nguồn:** `judge/admin/contest.py:148-386`, `judge/admin/contest.py:396-433`.

### QT-06. Quản trị người dùng và hồ sơ
- **Làm gì:** Sửa tài khoản Django và hồ sơ VNOJ của người dùng.
- **Cách VNOJ làm:**
  - Hồ sơ (`ProfileAdmin`): trường `display_rank`, huy hiệu, mô tả, tổ chức, `vnoj_points`, múi giờ, ngôn ngữ, giao diện, IP cuối, `mute`, `is_unlisted`, ghi chú nội bộ, tên hiển thị thay thế, lý do cấm, 2FA, `ip_auth`, script người dùng (trình soạn Ace), kỳ thi hiện tại.
  - Người có `judge.totp` thấy và sửa được `totp_key`, `scratch_codes`, `is_totp_enabled`.
  - Cột: tên, email, 2FA, múi giờ, ngày tham gia, lần truy cập cuối, IP. Tìm theo tên, IP, email. Lọc theo ngôn ngữ, múi giờ.
  - Thao tác: "Recalculate scores", "Recalulate contribution points" (giữ nguyên lỗi chính tả trong mã).
  - Không thêm hồ sơ trực tiếp. Nút xóa bị ẩn.
  - Người dùng (`UserAdmin`): ô chọn quyền hiển thị dạng `app.codename | tên`. Tạo `User` mới thì tự tạo `Profile`.
  - Hai trang sửa có nút chuyển qua lại giữa `User` và `Profile`.
  - Chi tiết tài khoản: xem 01.
- **Ai dùng được:** Staff có quyền tương ứng.
- **Mã nguồn:** `judge/admin/profile.py:39-161`, `judge/admin/profile.py:164-185`, `templates/admin/judge/profile/change_form.html`, `templates/admin/auth/user/change_form.html`.

### QT-07. Quản trị bình luận
- **Làm gì:** Ẩn, hiện, sửa bình luận.
- **Cách VNOJ làm:**
  - Cột: tác giả, trang liên kết, thời gian, điểm, ẩn. Lọc theo ẩn. Tìm theo tác giả, trang, nội dung. Sắp mới nhất trước.
  - Thao tác: "Hide comments", "Unhide comments". Mã gọi `queryset.author.calculate_contribution_points()` sau khi cập nhật; `queryset` không có thuộc tính `author` nên dòng này có thể gây lỗi (chưa kiểm tra chạy thực tế).
  - `CommentLock` đăng ký dạng mặc định (khóa bình luận theo trang).
- **Ai dùng được:** Staff có quyền thay đổi `Comment`.
- **Mã nguồn:** `judge/admin/comments.py:22-60`, `judge/admin/__init__.py:24`.

### QT-08. Quản trị blog
- **Làm gì:** Sửa bài blog và nhãn blog.
- **Cách VNOJ làm:**
  - Trường: tiêu đề, slug (tự điền), tác giả, tổ chức, `global_post`, nhãn, hiển thị, ghim, ngày đăng, nội dung, ảnh OG, tóm tắt.
  - Cột: id, tiêu đề, tác giả, hiển thị, toàn cục, ghim, ngày đăng. Phân cấp theo ngày đăng.
  - Chỉ sửa được bài mà `is_editable_by` cho phép.
  - Nhãn blog: tên, slug; tìm theo tên, slug.
- **Ai dùng được:** Staff có `judge.change_blogpost`.
- **Mã nguồn:** `judge/admin/interface.py:59-108`.

### QT-09. Quản trị nội dung tĩnh: trang phẳng, menu, giấy phép, huy hiệu, chuyển hướng
- **Làm gì:** Quản lý các nội dung ít thay đổi của site.
- **Cách VNOJ làm:**
  - Trang phẳng (`FlatPage`): nội dung soạn bằng Markdown (martor), có lịch sử phiên bản. Phục vụ qua `FlatpageFallbackMiddleware`. Lưu đệm 86400 giây, xóa đệm khi lưu.
  - Thanh menu (`NavigationBar`): cây kéo-thả (MPTT). Trường `key`, `label`, `path`, `order`, `regex`, `parent`. Sau khi sắp xếp lại thì dựng lại cây trong khóa bảng (QT-21) và xóa bộ đệm `navigation_bar`.
  - Giấy phép (`License`): `key`, `link`, `name`, `display`, `icon`, `text` (Markdown).
  - Huy hiệu (`Badge`): tên, URL ảnh nhỏ, URL ảnh lớn. Đăng ký dạng mặc định.
  - Chuyển hướng (`django.contrib.redirects`): phục vụ qua `RedirectFallbackMiddleware`.
  - `Site` (`django.contrib.sites`): tên miền site, dùng cho email và sitemap.
- **Ai dùng được:** Staff có quyền tương ứng.
- **Mã nguồn:** `judge/admin/interface.py:19-56`, `judge/admin/interface.py:124-132`, `judge/signals.py:176-189`, `dmoj/settings.py:475-495`.

### QT-10. Quản trị phân loại bài
- **Làm gì:** Quản lý nhóm bài, dạng bài, nhãn bài tổ chức.
- **Cách VNOJ làm:**
  - `ProblemGroup`, `ProblemType`: trường `name`, `full_name`.
  - `OrganizationProblemTag`: `name`, `organization`; tìm theo tên nhãn, tên tổ chức (xem 07, TC-16).
- **Ai dùng được:** Staff có quyền tương ứng.
- **Mã nguồn:** `judge/admin/taxon.py`.

### QT-11. Quản trị ticket
- **Làm gì:** Xem và sửa ticket hỗ trợ.
- **Cách VNOJ làm:**
  - Trường: tiêu đề, thời gian (chỉ đọc), người gửi, người được giao, đối tượng liên kết, ghi chú. Bảng con là các tin nhắn trong ticket.
  - Cột: tiêu đề, người gửi, thời gian, đối tượng liên kết. Phân cấp theo thời gian.
- **Ai dùng được:** Staff có quyền thay đổi `Ticket`.
- **Mã nguồn:** `judge/admin/ticket.py:10-46`.

### QT-12. Nhật ký thao tác và lịch sử phiên bản
- **Làm gì:** Ghi lại ai đã thay đổi gì trong admin.
- **Cách VNOJ làm:**
  - `LogEntry` (nhật ký có sẵn của Django) được mở thành màn hình xem. Cột: mô tả, thời điểm, người làm, loại đối tượng, link tới đối tượng (nếu chưa bị xóa). Lọc theo người làm (chỉ staff) và loại đối tượng. Tìm theo tên đối tượng và nội dung thay đổi.
  - Không thêm, không xóa, không sửa được. Chỉ superuser mở được danh sách.
  - Lịch sử phiên bản (reversion) có ở bài, bài nộp, kỳ thi, hồ sơ, tổ chức, bình luận, blog, máy chấm, ngôn ngữ, trang phẳng. Các thao tác trên site (tạo tổ chức, xóa bài hàng loạt, tạo bài tổ chức) cũng ghi phiên bản kèm người làm và ghi chú.
- **Ai dùng được:** Superuser (nhật ký); staff có quyền sửa đối tượng (lịch sử phiên bản).
- **Mã nguồn:** `judge/admin/interface.py:135-170`.

### QT-13. Hệ thống phân quyền
- **Làm gì:** Kiểm soát ai được làm gì trên site và trong admin.
- **Cách VNOJ làm:**
  - Dùng hệ quyền của Django. `is_superuser`: có mọi quyền. `is_staff`: được vào `/admin/`, thấy mọi máy chấm ở trang trạng thái, tải ảnh lên trực tiếp, bị buộc giữ 2FA (QT-34). Quyền gán cho người dùng hoặc cho nhóm (`Group`).
  - Mỗi mô hình có sẵn bốn quyền `add_`, `change_`, `delete_`, `view_`. Ví dụ dùng trực tiếp: `judge.add_organization`, `judge.change_organization`, `judge.add_organizationquota`, `judge.change_blogpost`, các quyền `urlshortener.*_urlshortener`.
  - Nhóm có tên cố định trong mã: `Org Admin` (`GROUP_PERMISSION_FOR_ORG_ADMIN`), admin tổ chức tự được thêm vào. Repo không tạo sẵn nhóm nào.
  - Quyền tự định nghĩa:

    | Mô hình | Mã quyền | Ý nghĩa |
    |---|---|---|
    | `Profile` | `test_site` | Thấy tính năng đang phát triển (ví dụ chủ đề Ace theo giao diện tối) |
    | `Profile` | `totp` | Sửa thiết lập TOTP của người khác trong admin |
    | `Profile` | `can_upload_image` | Tải ảnh lên máy chủ qua trình soạn martor |
    | `Profile` | `high_problem_timelimit` | Đặt giới hạn thời gian bài vượt `VNOJ_PROBLEM_TIMELIMIT_LIMIT = 5` giây |
    | `Profile` | `long_contest_duration` | Đặt kỳ thi dài hơn `VNOJ_CONTEST_DURATION_LIMIT = 14` ngày |
    | `Profile` | `create_mass_testcases` | Tạo quá `VNOJ_TESTCASE_HARD_LIMIT = 100` test |
    | `Profile` | `ban_user` | Cấm người dùng |
    | `Organization` | `organization_admin` | Quản trị tổ chức (sửa admin, credit) |
    | `Organization` | `edit_all_organization` | Sửa mọi tổ chức |
    | `Organization` | `change_open_organization` | Đổi `is_open` (khai báo, không dùng) |
    | `Organization` | `spam_organization` | Tạo tổ chức không giới hạn |
    | `Problem` | `see_private_problem` | Xem bài ẩn |
    | `Problem` | `edit_own_problem` | Sửa bài của mình |
    | `Problem` | `create_organization_problem` | Tạo bài tổ chức |
    | `Problem` | `edit_all_problem` | Sửa mọi bài |
    | `Problem` | `edit_public_problem` | Sửa mọi bài công khai |
    | `Problem` | `problem_full_markup` | Sửa bài dạng full markup |
    | `Problem` | `clone_problem` | Nhân bản bài |
    | `Problem` | `upload_file_statement` | Tải đề dạng tệp |
    | `Problem` | `change_public_visibility` | Đổi `is_public` |
    | `Problem` | `change_manually_managed` | Đổi `is_manually_managed` |
    | `Problem` | `see_organization_problem` | Xem bài riêng của mọi tổ chức |
    | `Problem` | `import_polygon_package` | Nhập gói Codeforces Polygon |
    | `Problem` | `edit_type_group_all_problem` | Sửa dạng và nhóm cho mọi bài |
    | `Solution` | `see_private_solution` | Xem lời giải ẩn |
    | `Submission` | `abort_any_submission` | Hủy mọi bài nộp |
    | `Submission` | `rejudge_submission` | Chấm lại bài nộp |
    | `Submission` | `rejudge_submission_lot` | Chấm lại nhiều bài nộp |
    | `Submission` | `spam_submission` | Nộp không giới hạn hàng đợi |
    | `Submission` | `view_all_submission` | Xem mọi bài nộp |
    | `Submission` | `resubmit_other` | Nộp lại bài của người khác |
    | `Submission` | `lock_submission` | Đổi trạng thái khóa bài nộp |
    | `Contest` | `see_private_contest` | Xem kỳ thi riêng |
    | `Contest` | `edit_own_contest` | Sửa kỳ thi của mình |
    | `Contest` | `edit_all_contest` | Sửa mọi kỳ thi |
    | `Contest` | `clone_contest` | Nhân bản kỳ thi |
    | `Contest` | `moss_contest` | Chạy MOSS (kiểm tra đạo mã) |
    | `Contest` | `contest_rating` | Tính rating |
    | `Contest` | `contest_access_code` | Đặt mã truy cập kỳ thi |
    | `Contest` | `create_private_contest` | Tạo kỳ thi riêng |
    | `Contest` | `change_contest_visibility` | Đổi hiển thị kỳ thi |
    | `Contest` | `contest_problem_label` | Sửa script đặt nhãn bài |
    | `Contest` | `lock_contest` | Đổi trạng thái khóa kỳ thi |
    | `Contest` | `view_contest_balloons` | Xem trang bóng bay |
    | `BlogPost` | `edit_all_post` | Sửa mọi bài blog |
    | `BlogPost` | `edit_organization_post` | Sửa bài blog tổ chức |
    | `BlogPost` | `mark_global_post` | Đánh dấu bài toàn cục |
    | `BlogPost` | `pin_post` | Ghim bài |
    | `BlogPost` | `manage_magazine_post` | Quản lý bài tạp chí |
    | `Comment` | `view_all_user_comment` | Xem mọi bình luận của một người |
    | `CommentLock` | `override_comment_lock` | Bình luận dù trang bị khóa |

  - Lệnh `update_permissions` tạo quyền còn thiếu và cập nhật tên quyền theo tiếng Anh (`--apps`, `--create-only`, `--update-only`).
- **Ai dùng được:** Superuser hoặc staff có quyền sửa `User`/`Group` để gán quyền.
- **Mã nguồn:** `judge/models/profile.py:188-193`, `judge/models/profile.py:546-554`, `judge/models/problem.py:669-683`, `judge/models/problem.py:764-766`, `judge/models/submission.py:248-256`, `judge/models/contest.py:603-616`, `judge/models/interface.py:142-148`, `judge/models/comment.py:40-42`, `judge/models/comment.py:205-207`, `judge/management/commands/update_permissions.py`, `dmoj/settings.py:111-125`.

### QT-14. Đăng nhập thay người khác (impersonate)
- **Làm gì:** Superuser xem site dưới danh nghĩa một người dùng khác.
- **Cách VNOJ làm:**
  - Dùng gói `django-impersonate`, URL `/impersonate/`. `IMPERSONATE_REQUIRE_SUPERUSER = True`. `IMPERSONATE_DISABLE_LOGGING = True` (gói không ghi log phiên).
  - Nút "Impersonate" ở trang người dùng, chỉ hiện cho superuser, không hiện với chính mình và với superuser khác.
  - Khi đang đăng nhập thay: thanh menu đổi màu tím; mục "Log out" đổi thành "Stop impersonating"; không chạy script người dùng; không cập nhật lần truy cập cuối và IP của người bị đóng vai; log uWSGI ghi "<người thật> as <người bị đóng vai>".
- **Ai dùng được:** Superuser.
- **Mã nguồn:** `dmoj/settings.py:467`, `dmoj/settings.py:489-490`, `dmoj/settings.py:497-498`, `judge/middleware.py:119-129`, `dmoj/urls.py:468-469`, `templates/user/user-tabs.html:15-17`, `templates/base.html:61-66`, `templates/base.html:199`, `templates/base.html:344-345`.

### QT-15. Cấu hình trang trên giao diện (`misc_config`)
- **Làm gì:** Sửa các đoạn văn bản và hình ảnh toàn site mà không cần sửa mã.
- **Cách VNOJ làm:**
  - Mô hình `MiscConfig`: cặp `key` (tối đa 30, duy nhất) và `value` (văn bản).
  - Tra khóa theo thứ tự ưu tiên: `<tên miền>:<khóa>.<ngôn ngữ>`, `<tên miền>:<khóa>`, `<khóa>.<ngôn ngữ>`, `<khóa>`. Vì vậy có thể đặt giá trị riêng theo ngôn ngữ và theo site.
  - Trang `misc_config` (chỉ superuser, người khác nhận 404) có các ô:

    | Khóa | Hiện ở đâu |
    |---|---|
    | `site_logo` (tải tệp) | Logo góc trái trên, ảnh OG mặc định |
    | `site_favicon` (tải tệp) | Lưu được, nhưng `base.html` vẫn dùng favicon tĩnh (không thấy chỗ đọc khóa này) |
    | `meta_keywords` | Thẻ meta keywords mọi trang |
    | `meta_description` | Thẻ meta description trang chủ |
    | `analytics` | HTML/JS chèn vào mọi trang |
    | `top_notification` | Biểu ngữ đầu mọi trang, hỗ trợ cú pháp template Django |
    | `announcement` | Thông báo toàn site (HTML thô) |
    | `footer` | Chân trang (HTML thô) |
    | `home_page_top` | Phần đầu trang chủ, hỗ trợ template Django, có biến số người dùng, số bài, số bài nộp, số ngôn ngữ |
    | `discord_invite_link`, `discord_invite_shieldio` | Link và huy hiệu Discord |
    | `description_example` | Đề bài mẫu điền sẵn khi tạo bài |
  - Ảnh tải lên được lưu vào `STATIC_UPLOAD_MEDIA_DIR = 'static-upload'` với tên UUID.
  - Để trống một ô văn bản thì xóa khóa đó.
  - Staff thấy link "Configure in admin panel for more options" tới admin `MiscConfig` (sửa khóa tự do).
  - Toàn bộ bảng được đệm 86400 giây dưới khóa `misc_config`; lưu hoặc xóa một dòng thì xóa đệm.
- **Ai dùng được:** Superuser (trang site); staff có quyền `MiscConfig` (admin).
- **Mã nguồn:** `judge/models/interface.py:18-27`, `judge/middleware.py:189-229`, `judge/views/misc_config.py`, `templates/misc_config/edit.html`, `judge/views/widgets.py:96-104`, `judge/signals.py:166-173`, `templates/base.html:6-7`, `templates/base.html:194-195`, `templates/base.html:398-434`, `templates/home.html:3-9`, trang `misc_config`.

### QT-16. Tác vụ nền và trang trạng thái tác vụ
- **Làm gì:** Chạy việc nặng ở nền (Celery) và cho người dùng theo dõi tiến độ.
- **Cách VNOJ làm:**
  - Tác vụ báo tiến độ qua lớp `Progress`: trạng thái `PROGRESS` với `done`, `total`, `stage`.
  - Trang `task_status` nhận id tác vụ (UUID), hiện thanh tiến độ và thông điệp. Khi xong và có tham số `redirect` (kiểm tra cùng host) thì chuyển tới đó.
  - Trang `task_status_ajax?id=...` trả JSON: `PROGRESS`, `SUCCESS`, `FAILURE` (kèm lỗi), hoặc `WORKING`. Trang này bỏ qua các middleware (`short_circuit_middleware`).
  - Hai trang trên không kiểm tra quyền; ai biết UUID là xem được.
  - Ba tác vụ thử: `/tasks/success`, `/tasks/failure`, `/tasks/progress` (chờ 10 giây). Chỉ superuser chạy được.
  - Cấu hình Celery đọc từ settings với tiền tố `CELERY_`. Có thể đặt `CELERY_BROKER_URL_SECRET`, `CELERY_RESULT_BACKEND_SECRET`. `CELERY_TIMEZONE = 'UTC'`. Lỗi tác vụ được ghi vào logger `judge.celery`.
- **Ai dùng được:** Người khởi chạy tác vụ (qua link chuyển hướng); superuser cho tác vụ thử.
- **Mã nguồn:** `judge/views/tasks.py`, `judge/utils/celery.py`, `judge/tasks/demo.py`, `dmoj/celery.py:8-60`, `dmoj_celery.py`, `dmoj/urls.py:448-454`, trang `task_status`, `task_status_ajax`.

### QT-17. Danh sách tác vụ Celery và lịch chạy định kỳ
- **Làm gì:** Liệt kê các việc chạy nền và các việc chạy theo lịch.
- **Cách VNOJ làm:**
  - Lịch định kỳ (Celery beat):

    | Tên lịch | Tác vụ | Lịch | Việc làm |
    |---|---|---|---|
    | `daily-queue-time-stats` | `queue_time_stats` | 00:00 hằng ngày | Vẽ biểu đồ thời gian chờ chấm ngày trước, gửi Discord |
    | `problem-garbage-collector` | `problem_garbage_collect` | `VNOJ_PROBLEM_GARBAGE_COLLECTOR_CRONTAB_KWARGS = {'minute': 0, 'hour': 0}` | Xóa hẳn bài đã xóa mềm quá 7 ngày; dừng sau `VNOJ_PROBLEM_GARBAGE_COLLECTOR_TIME_LIMIT = 1 giờ` |
    | `update-hot-problems` | `update_hot_problems` | mỗi 10 phút | Tính lại 7 bài "hot" trong 1 ngày |
    | `organization-monthly-reset` | `organization_monthly_reset` | 00:00 ngày 1 hằng tháng | Chốt credit tháng của tổ chức (xem 07) |

  - Tác vụ gọi theo sự kiện:

    | Tác vụ | Tệp | Việc làm |
    |---|---|---|
    | `rejudge_problem_filter` | `submission.py` | Chấm lại bài nộp của một bài theo bộ lọc (khoảng id, ngôn ngữ, kết quả) |
    | `rescore_problem` | `submission.py` | Tính lại điểm mọi bài nộp của một bài |
    | `rescore_contest` | `contest.py` | Tính lại điểm kỳ thi |
    | `run_moss` | `contest.py` | Gửi mã kỳ thi lên MOSS |
    | `prepare_contest_data` | `contest.py` | Đóng gói dữ liệu kỳ thi để tải (QT-36) |
    | `send_contest_announcement` | `contest.py` | Gửi thông báo kỳ thi |
    | `prepare_user_data` | `user.py` | Đóng gói dữ liệu người dùng để tải (QT-36) |
    | `restore_organization_archived_problems` | `organization.py` | Khôi phục bài lưu trữ lạnh của tổ chức |
    | `on_new_ticket`, `on_new_ticket_message`, `on_new_comment`, `on_new_problem`, `on_new_contest`, `on_new_blogpost`, `on_long_queue` | `webhook.py` | Gửi webhook Discord (QT-18) |
    | `success`, `failure`, `progress` | `demo.py` | Tác vụ thử |
- **Ai dùng được:** Tự động.
- **Mã nguồn:** `dmoj/celery.py:25-54`, `judge/tasks/__init__.py`, `judge/tasks/problem.py`, `judge/tasks/submission.py:26-43`, `judge/tasks/contest.py:24-154`, `judge/tasks/user.py:46`, `judge/tasks/organization.py`, `judge/tasks/webhook.py`, `dmoj/settings.py:243-245`.

### QT-18. Webhook Discord và cảnh báo vận hành
- **Làm gì:** Gửi thông báo sự kiện và lỗi tới kênh Discord.
- **Cách VNOJ làm:**
  - `DISCORD_WEBHOOK` là từ điển theo sự kiện: `default`, `on_new_ticket`, `on_new_comment`, `on_new_problem`, `on_new_blogpost`, `on_error`, `on_long_queue`, `queue_time_stats`. Mỗi giá trị là URL hoặc `{'url', 'thread_id'}`. Mặc định đều `None` (tắt).
  - Cần `SITE_FULL_URL` (ví dụ `https://oj.vnoi.info`) để tạo link trong tin nhắn.
  - Cảnh báo hàng đợi dài: bridge gọi `on_long_queue` khi số bài chờ (trừ chấm lại) đạt `VNOJ_LONG_QUEUE_ALERT_THRESHOLD = 10`. Tối đa 1 cảnh báo mỗi 5 phút.
  - Thống kê thời gian chờ hằng ngày: chia nhóm 0–1 s, 1–2 s, 2–5 s, 5–10 s, 10–30 s, 30 s–1 phút, 1–2 phút, 2–5 phút, 5–10 phút, trên 10 phút; vẽ bằng matplotlib.
  - Log lỗi qua `ThrottledDiscordWebhookHandler`: gửi traceback lên `on_error`, tối đa `VNOJ_DISCORD_WEBHOOK_THROTTLING = (10, 60)` tin trong 60 giây.
- **Ai dùng được:** Người vận hành cấu hình trong `local_settings.py`.
- **Mã nguồn:** `dmoj/settings.py:201-214`, `dmoj/settings.py:250`, `judge/tasks/webhook.py`, `dmoj/throttle_discord_webhook.py`, `judge/bridge/judge_list.py:43`, `judge/bridge/judge_list.py:241`.

### QT-19. Lệnh quản trị dòng lệnh (management commands)
- **Làm gì:** Các lệnh `python manage.py <lệnh>` cho người vận hành.
- **Cách VNOJ làm:**

  | Lệnh | Việc làm |
  |---|---|
  | `add_blog_navigation` | Thêm mục "Blog" vào thanh menu |
  | `addjudge <name> <auth_key>` | Tạo máy chấm |
  | `adduser <name> <email> <password> [language] [--superuser] [--staff]` | Tạo người dùng |
  | `batchadduser <input.csv> <output.csv>` | Tạo hàng loạt từ CSV (`username`, `fullname`); sinh mật khẩu 8 ký tự; ghi CSV kết quả kèm mật khẩu |
  | `backfill_current_credit` | Tính lại credit tháng hiện tại của mọi tổ chức |
  | `backfill_monthly_credit` | Tính lại lịch sử credit theo tháng từ 06/2023 |
  | `backfill_problem_data_size [--dry-run]` | Tính lại kích thước dữ liệu bài |
  | `camo <url>` | In URL qua proxy ảnh camo |
  | `copy_language <source> <target>` | Bài nào cho phép ngôn ngữ nguồn thì cho phép thêm ngôn ngữ đích |
  | `create_problem <code> <name> <body> <type> <group>` | Tạo bài rỗng |
  | `export_contest_submissions <key> <output_dir>` | Xuất mã nguồn bài nộp của kỳ thi |
  | `export_contest_submissions_details <key> <output>` | Xuất chi tiết bài nộp kỳ thi |
  | `export_event_feed <key> <output.xml> [--medal ...]` | Xuất CLICS XML Event Feed (cho ICPC Resolver) |
  | `generate_api_token <name>` | Tạo token API 48 ký tự; token bỏ qua 2FA và không vào được admin |
  | `generate_sitemap <dir> [-s site] [-p protocol] [-d subdir] [-P prefix]` | Ghi sitemap ra tệp tĩnh |
  | `import_polygon_package <zip> <code> [--update] [--authors] [--curators]` | Nhập gói Codeforces Polygon |
  | `makedmojmessages -l <locale> / --all` | Tạo tệp dịch `dmoj-user` từ nhãn menu và tên dạng bài |
  | `merge_replay_data <contest> <b_json>` | Ghép dữ liệu replay của kỳ thi khác vào dạng "bóng ma" |
  | `move_user_content <source> <target>` | Chuyển bài nộp, bình luận, phiếu bầu sang người khác; từ chối nếu nguồn có tham gia kỳ thi |
  | `render_pdf <code> [-l lang]` | Xuất PDF đề bài |
  | `runbalancer -c <config.yml>` | Chạy bộ cân bằng tải máy chấm |
  | `runbridged` | Chạy tiến trình bridge |
  | `runmoss <contest>` | Kiểm tra đạo mã bằng MOSS |
  | `submit_polygon_solutions <zip> <code> <submitter>` | Nộp lời giải trong gói Polygon |
  | `update_permissions` | Tạo và cập nhật quyền (QT-13) |
- **Ai dùng được:** Người có quyền truy cập máy chủ.
- **Mã nguồn:** `judge/management/commands/`.

### QT-20. Bộ nhớ đệm (cache)
- **Làm gì:** Lưu tạm kết quả tốn kém để trang nhanh hơn.
- **Cách VNOJ làm:**
  - `CACHES` mặc định rỗng (bộ nhớ cục bộ). README yêu cầu đổi sang memcached hoặc redis để site và bridge dùng chung đệm.
  - Session dùng `cached_db` (đệm + CSDL).
  - Đoạn template được đệm: `problem_html` (86400 s), `problem_authors` (86400 s), `contest_html` (3600 s), `organization_html` (3600 s), `post_content` và `post_summary` (86400 s), `post_modern_summary` (60 s), `user_about` (86400 s), `language_html` (86400 s), `license_html` (3600 s), `flatpage` (86400 s).
  - Khóa trong mã: `misc_config` (86400 s), `navigation_bar`, `lang:cn_map` (86400 s), `hot_problems:*`, `user_complete:*`, `user_attempted:*`, `contest_complete:*`, `contest_attempted:*`, `unread_notification_count<id>` (86400 s), `storage_pie_data_<org>` (7 ngày), `mathoid:mml:*`, `webhook:on_long_queue` (5 phút), các bộ đếm giới hạn tần suất.
  - Xóa đệm bằng tín hiệu khi lưu: bài, hồ sơ, kỳ thi, giấy phép, ngôn ngữ, máy chấm, bình luận, blog, tổ chức, `MiscConfig`, `NavigationBar`, trang phẳng. Lưu bài còn xóa tệp PDF đã đệm.
  - Chấm xong hoặc xóa bài nộp thì xóa đệm bài đã giải/đã thử của người đó (`finished_submission`).
  - Template Jinja bật bộ đệm bytecode.
- **Ai dùng được:** Tự động.
- **Mã nguồn:** `judge/caching.py`, `judge/signals.py:40-189`, `judge/utils/cache_helper.py`, `dmoj/settings.py:560-562`, `dmoj/settings.py:759`, `dmoj/settings.py:775`, `README.md`.

### QT-21. Khóa bảng CSDL
- **Làm gì:** Khóa bảng MySQL khi cần ghi nhất quán.
- **Cách VNOJ làm:**
  - `LockModel(write=..., read=...)` chạy `LOCK TABLES ... WRITE/READ`, khi thoát thì commit (hoặc rollback nếu lỗi) và `UNLOCK TABLES`. Chỉ chạy với MySQL.
  - Dùng khi dựng lại cây thanh menu (QT-09).
- **Ai dùng được:** Mã nội bộ.
- **Mã nguồn:** `judge/dblock.py`, `judge/admin/interface.py:39-49`.

### QT-22. Máy chủ sự kiện thời gian thực (websocket)
- **Làm gì:** Đẩy cập nhật (trạng thái chấm, bảng xếp hạng, thông báo) tới trình duyệt.
- **Cách VNOJ làm:**
  - Chương trình Node.js `websocket/daemon.js` (gói `ws`). Mở ba cổng: nhận tin từ Django (`post`), phát cho trình duyệt qua websocket (`get`), và HTTP long-poll ở đường dẫn `/channels/<kênh>|<kênh>`.
  - Giữ tối đa `max_queue = 50` tin gần nhất để client bắt kịp. Mỗi client theo dõi tối đa `max_filter = 5` kênh. Thân yêu cầu tối đa `max_body_size = 200`. Long-poll hết hạn sau 60000 ms.
  - Lệnh phía Django: `post` (kênh, nội dung) và `last-msg`. Đọc cấu hình từ `websocket/config.js`, tệp này không có trong repo.
  - Phía Django: bật bằng `EVENT_DAEMON_USE` (mặc định `False`). Địa chỉ `EVENT_DAEMON_POST = 'ws://localhost:9997/'`, `EVENT_DAEMON_GET = 'ws://localhost:9996/'`, `EVENT_DAEMON_POLL = '/channels/'`. Có thể đặt bản SSL (`EVENT_DAEMON_GET_SSL`, `EVENT_DAEMON_POLL_SSL`). Có thể dùng AMQP nếu đặt `EVENT_DAEMON_AMQP` (sàn `EVENT_DAEMON_AMQP_EXCHANGE = 'dmoj-events'`).
  - `EVENT_DAEMON_KEY`: Django gửi lệnh `auth` nếu khóa được đặt. `daemon.js` không có lệnh `auth`, nên sẽ trả lỗi "bad-command" (chưa kiểm tra chạy thực tế).
  - Các khóa bí mật cho kênh riêng: `EVENT_DAEMON_SUBMISSION_KEY`, `EVENT_DAEMON_CONTEST_KEY`, `EVENT_DAEMON_TICKET_KEY`, `EVENT_DAEMON_NOTIFICATION_KEY` (tạo tên kênh khó đoán bằng HMAC).
- **Ai dùng được:** Hạ tầng.
- **Mã nguồn:** `websocket/daemon.js`, `websocket/queue.js`, `judge/event_poster.py`, `judge/event_poster_ws.py`, `judge/template_context.py:45-54`, `dmoj/settings.py:736-746`, `package.json`.

### QT-23. Tiến trình bridge, balancer và cách chạy web
- **Làm gì:** Các tiến trình phải chạy song song với web.
- **Cách VNOJ làm:**
  - Bridge (cầu nối site và máy chấm): chạy bằng `manage.py runbridged` hoặc `python dmoj_bridge_async.py` (bản dùng gevent). Khi khởi động: đánh dấu mọi máy chấm offline; bài nộp đang chấm dở chuyển thành `IE` (lỗi nội bộ). Mở hai cổng: `BRIDGED_JUDGE_ADDRESS = [('localhost', 9999)]` cho máy chấm và `BRIDGED_DJANGO_ADDRESS = [('localhost', 9998)]` cho Django. Dừng khi nhận SIGINT, SIGQUIT, SIGTERM.
  - Balancer: `manage.py runbalancer -c <tệp YAML>`, cổng mặc định `BALANCER_JUDGE_ADDRESS = [('localhost', 8888)]`.
  - Celery worker: khởi chạy qua `dmoj_celery.py` (cài pymysql nếu thiếu MySQLdb).
  - Web: `dmoj/wsgi.py` (thường) và `dmoj/wsgi_async.py` (gevent). `additional_requirements.txt`: `uwsgi`, `websocket-client`, `watchdog`, `matplotlib`.
  - Chi tiết điều phối chấm: xem 03.
- **Ai dùng được:** Người vận hành.
- **Mã nguồn:** `judge/bridge/daemon.py:19-53`, `dmoj_bridge_async.py`, `judge/management/commands/runbridged.py`, `judge/management/commands/runbalancer.py`, `dmoj_celery.py`, `dmoj/wsgi.py`, `dmoj/wsgi_async.py`, `dmoj/settings.py:727-734`.

### QT-24. Email
- **Làm gì:** Gửi email kích hoạt, đặt lại mật khẩu, báo lỗi; kích hoạt tài khoản bằng email gửi đến.
- **Cách VNOJ làm:**
  - `settings.py` không đặt máy chủ SMTP. Các giá trị `EMAIL_*`, `SERVER_EMAIL`, `DEFAULT_FROM_EMAIL` phải đặt trong `local_settings.py`. `SITE_ADMIN_EMAIL = ''` được đưa vào template.
  - Kích hoạt qua Mailgun: URL `mailgun/mail_activate/`, bỏ kiểm tra CSRF. Chỉ hoạt động khi có `MAILGUN_ACCESS_KEY`. Kiểm chữ ký HMAC-SHA256 của `timestamp + token`. Tìm người dùng theo địa chỉ gửi; nếu nội dung thư chứa mã kích hoạt của người đó thì kích hoạt tài khoản. Các trường hợp khác trả 406. Ghi log vào `judge.mail.activate`.
  - Email báo lỗi cho admin: `ThrottledEmailHandler`, tối đa `DMOJ_EMAIL_THROTTLING = (10, 60)` thư trong 60 giây.
  - `SEND_ACTIVATION_EMAIL` (đọc bằng `getattr`, mặc định `True`): nếu `False`, tài khoản tự kích hoạt khi đăng ký. `ACCOUNT_ACTIVATION_DAYS = 7`.
  - `BAD_MAIL_PROVIDERS`, `BAD_MAIL_PROVIDER_REGEX`: chặn tên miền email khi đăng ký (xem 01).
  - Bản tin (`newsletter`) được nối URL nếu có trong `INSTALLED_APPS`. `DMOJ_NEWSLETTER_ID_ON_REGISTER = None`.
- **Ai dùng được:** Hạ tầng; Mailgun gọi vào endpoint.
- **Mã nguồn:** `judge/views/mailgun.py`, `dmoj/throttle_mail.py`, `judge/signals.py:212-226`, `dmoj/settings.py:36-37`, `dmoj/settings.py:249`, `dmoj/settings.py:334-337`, `dmoj/settings.py:500`, `dmoj/urls.py:362`, `dmoj/urls.py:466-467`, trang `mailgun_activate`.

### QT-25. Đa ngôn ngữ
- **Làm gì:** Hiển thị giao diện bằng nhiều ngôn ngữ.
- **Cách VNOJ làm:**
  - `LANGUAGES = [('en', 'English'), ('vi', 'Vietnamese')]`. `LANGUAGE_CODE = 'en'`. `LocaleMiddleware` chọn ngôn ngữ theo yêu cầu.
  - Thư mục `locale/` có `en` và `vi`, mỗi bên có `django.po` và `djangojs.po`. Số mục `msgid`: `vi/django.po` 2163, `en/django.po` 1680, `djangojs.po` 4 mỗi bên.
  - Đổi ngôn ngữ: ô chọn ở chân trang, gửi tới `set_language` (`/i18n/`). Chuỗi JavaScript được nhúng qua `statici18n`.
  - Dịch nội dung do admin nhập: miền dịch riêng `dmoj-user` (`judge/user_translations.py`). Dùng cho nhãn thanh menu và tên dạng bài, gọi bằng hàm template `user_trans`. Tệp nguồn sinh bằng lệnh `makedmojmessages`.
  - `judge/custom_translations.py` chứa các chuỗi cần dịch nhưng không xuất hiện trực tiếp trong mã (thông báo kiểm tra mật khẩu của Django, vài nhãn menu, chuỗi thời lượng).
  - `TICKET_AUTOFILL_REPLIES`: 12 câu trả lời mẫu cho ticket, mỗi câu có bản `en` và `vi`.
  - Template Jinja dùng `judge.utils.safe_translations` làm bộ dịch.
- **Ai dùng được:** Mọi người.
- **Mã nguồn:** `dmoj/settings.py:584-591`, `dmoj/settings.py:752-755`, `dmoj/settings.py:72-97`, `judge/user_translations.py`, `judge/custom_translations.py`, `judge/management/commands/makedmojmessages.py:107-130`, `templates/base.html:74`, `templates/base.html:436`, `locale/`.

### QT-26. Múi giờ
- **Làm gì:** Lưu giờ theo UTC, hiển thị theo múi giờ người dùng.
- **Cách VNOJ làm:**
  - `TIME_ZONE = 'UTC'`, `USE_TZ = True`.
  - `TimezoneMiddleware` dùng `Profile.timezone`. Khách dùng `DEFAULT_USER_TIME_ZONE = 'America/Toronto'`.
  - `TIMEZONE_MAP` là ảnh bản đồ dùng ở trang chọn múi giờ.
  - Hàm `from_database_time`, `to_database_time` đổi giờ theo múi giờ kết nối CSDL.
  - Lịch Celery chạy theo `CELERY_TIMEZONE = 'UTC'`.
- **Ai dùng được:** Mọi người.
- **Mã nguồn:** `judge/timezone.py`, `dmoj/settings.py:190`, `dmoj/settings.py:340`, `dmoj/settings.py:753-756`.

### QT-27. Cờ cấu hình toàn site
- **Làm gì:** Các biến trong `dmoj/settings.py` thay đổi hành vi site. Ghi đè trong `local_settings.py`.
- **Cách VNOJ làm:**
  - Nhận diện site và bảo mật:

    | Biến | Mặc định | Ý nghĩa |
    |---|---|---|
    | `SECRET_KEY` | chuỗi cố định trong repo | Khóa bí mật Django; phải đổi khi triển khai |
    | `DEBUG` | `True` | Chế độ gỡ lỗi |
    | `ALLOWED_HOSTS` | `[]` | Tên miền được phép |
    | `SITE_NAME`, `SITE_LONG_NAME` | `'DMOJ'`, `'DMOJ: Modern Online Judge'` | Tên site |
    | `SITE_FULL_URL` | `None` | URL đầy đủ, dùng cho webhook |
    | `DMOJ_CANONICAL` | `'oj.vnoi.info'` | Tên miền trong thẻ canonical |
    | `DMOJ_SSL` | `1` | 0: luôn HTTP; 1: theo yêu cầu; 2: luôn HTTPS cho link |
    | `DMOJ_REQUIRE_STAFF_2FA` | `True` | Staff không được tắt 2FA |
    | `DMOJ_2FA_HARDCORE` | `False` | Cảnh báo rằng admin sẽ không khôi phục 2FA |
    | `REGISTRATION_OPEN` | `True` | Cho đăng ký |
    | `OAUTH_ONLY` | `False` | Chỉ cho đăng nhập OAuth |
    | `IP_BASED_AUTHENTICATION_HEADER` | `'REMOTE_ADDR'` | Header lấy IP cho đăng nhập theo IP |
    | `WEBAUTHN_RP_ID` | `None` | Bật WebAuthn khi đặt |
    | `TERMS_OF_SERVICE_URL` | `None` | Link điều khoản |
    | `DESCRIPTION_MAX_LENGTH` | `200` | Độ dài mô tả meta |
  - Chế độ vận hành:

    | Biến | Mặc định | Ý nghĩa |
    |---|---|---|
    | `VNOJ_OFFICIAL_CONTEST_MODE` | `False` | Chế độ thi chính thức (QT-28) |
    | `VNOJ_LOW_POWER_MODE`, `VNOJ_LOW_POWER_MODE_CONFIG` | `False`, `{'max_page': 5, 'heat_map_limit': 20000}` | Chế độ tiết kiệm (QT-29) |
    | `VNOJ_ENABLE_SYNC_API`, `GLOBAL_API_KEY` | `False`, `'test-api-key-123'` | Bật API đồng bộ kỳ thi `api/v2/sync/` (xem 04) |
    | `ENABLE_FTS` | `False` | Tìm kiếm toàn văn đề bài |
    | `CROSS_ORGANIZATION_PROBLEM_SELECTION` | `False` | Ô chọn bài cho kỳ thi tìm trên mọi bài thay vì chia tab |
    | `EVENT_DAEMON_USE` | `False` | Bật máy chủ sự kiện (QT-22) |
    | `DMOJ_USER_DATA_DOWNLOAD`, `DMOJ_CONTEST_DATA_DOWNLOAD` | `False` | Cho tải dữ liệu (QT-36) |
  - Tổ chức (xem 07): `VNOJ_ORGANIZATION_ADMIN_LIMIT = 3`, `DMOJ_USER_MAX_ORGANIZATION_COUNT = 3`, `VNOJ_ORG_PP_STEP = 0.95`, `VNOJ_ORG_PP_ENTRIES = 100`, `VNOJ_ORG_PP_SCALE = 1`, `VNOJ_IGNORED_ORGANIZATION_SUBDOMAINS`, `VNOJ_ENABLE_ORGANIZATION_CREDIT_LIMITATION = False`, `VNOJ_MONTHLY_FREE_CREDIT = 10800`, `VNOJ_PRICE_PER_HOUR = 50`, `VNOJ_ORGANIZATION_DEFAULT_MAX_PROBLEMS = 1000`, `VNOJ_ORGANIZATION_DEFAULT_MAX_STORAGE = 5 GB`, `VNOJ_QUOTA_WARNING_THRESHOLD = 0.8`, `VNOJ_QUOTA_WARNING_SUFFIX = ''`, `VNOJ_QUOTA_ENFORCEMENT_ENABLED = False`, `VNOJ_QUOTA_PACKAGE_STORAGE = 5 GB`, `VNOJ_QUOTA_PACKAGE_PROBLEMS = 1000`, `GROUP_PERMISSION_FOR_ORG_ADMIN = 'Org Admin'`.
  - Giới hạn cho người không có quyền đặc biệt: `VNOJ_PROBLEM_TIMELIMIT_LIMIT = 5` giây, `VNOJ_CONTEST_DURATION_LIMIT = 14` ngày, `VNOJ_TESTCASE_HARD_LIMIT = 100`, `VNOJ_TESTCASE_SOFT_LIMIT = 50` (cảnh báo), `VNOJ_INTERACT_MIN_PROBLEM_COUNT = 5` (bình luận, bầu, sửa hồ sơ), `VNOJ_BLOG_MIN_PROBLEM_COUNT = 10`, `DMOJ_SUBMISSION_LIMIT = 2`, `DMOJ_SUBMISSIONS_REJUDGE_LIMIT = 10`, `MAX_CONTEST_PROBLEMS_COUNT = None`.
  - Bài: `DMOJ_PROBLEM_MIN_TIME_LIMIT = 0.01`, `DMOJ_PROBLEM_MAX_TIME_LIMIT = 60` giây; `DMOJ_PROBLEM_MIN_MEMORY_LIMIT = 0`, `DMOJ_PROBLEM_MAX_MEMORY_LIMIT = 1048576` KB; điểm 0.01–2; `DMOJ_PROBLEM_HOT_PROBLEM_COUNT = 7`; `VNOJ_PROBLEM_DELETION_GRACE_PERIOD = 7 ngày`; `VNOJ_PROBLEM_ARCHIVE_RETENTION = 180 ngày`; `DMOJ_PROBLEM_STATEMENT_DISALLOWED_CHARACTERS` (ngoặc kép cong, dấu trừ Unicode, chữ ghép ff/fi/fl...); `DMOJ_STORAGE_CONFIG_PATH`, `DMOJ_PROBLEM_DATA_ROOT` (cũ); `DATA_UPLOAD_MAX_NUMBER_FIELDS = 3000`; `VNOJ_TESTCASE_VISIBLE_LENGTH = 60`.
  - Bài nộp: `DMOJ_SUBMISSION_SOURCE_VISIBILITY = 'all-solved'` (`all`, `all-solved`, `only-own`).
  - Điểm và đóng góp: `DMOJ_PP_STEP = 0.98514`, `DMOJ_PP_ENTRIES = 300`, `DMOJ_PP_BONUS_FUNCTION = 0.05 * n`, `VNOJ_CP_COMMENT = 1`, `VNOJ_CP_TICKET = 10`, `DMOJ_RATING_COLORS = True`, `VNOJ_DISPLAY_RANKS` (user, setter, daor, staff, banned, admin, teacher).
  - Bình luận: `VNOJ_COMMENT_MIN_CONTRIBUTION = -20`, `VNOJ_COMMENT_MIN_LENGTH = 10`, `VNOJ_COMMENT_MAX_LENGTH = 8196`, `VNOJ_COMMENT_BLACKLIST_TERMS = []`, `VNOJ_COMMENT_RATE_LIMIT_COUNT = None`, `VNOJ_COMMENT_RATE_LIMIT_WINDOW = 600 s`, `DMOJ_COMMENT_VOTE_HIDE_THRESHOLD = -5`, `DMOJ_COMMENT_REPLY_TIMEFRAME = 365 ngày`.
  - Kỳ thi và gian lận: `VNOJ_SHOULD_BAN_FOR_CHEATING_IN_CONTESTS = False`, `VNOJ_MAX_DISQUALIFICATIONS_BEFORE_BANNING = 3`, `VNOJ_BAN_COUNT_FROM_DATE = 2026-01-01`, `VNOJ_CONTEST_CHEATING_BAN_MESSAGE`, `VNOJ_BALLOON_COLORS = {}`, `CONTEST_REPLAY_MEDIA_DIR`, `MOSS_API_KEY = None`.
  - Trang chủ và giao diện: `VNOJ_HOMEPAGE_TOP_USERS_COUNT = 5`, `DMOJ_BLOG_NEW_PROBLEM_COUNT = 7`, `VNOJ_MAGAZINE_TAG_SLUG = None`, `DMOJ_THEME_CSS`, `DMOJ_THEME_DEFAULT_ACE_THEME` (`github`/`twilight`), `SITE_THEME_COOKIE_NAME`, `SITE_THEME_COOKIE_AGE = 1 năm`, `DMOJ_STATS_LANGUAGE_THRESHOLD = 10`, `DMOJ_STATS_SUBMISSION_RESULT_COLORS`, `DMOJ_API_PAGE_SIZE = 1000`, `GOOGLE_SEARCH_ENGINE_URL = None`.
  - Dịch vụ ngoài: `MATHOID_*` (render công thức), `TEXOID_*`, `DMOJ_PDF_PDFOID_URL`, `DMOJ_PDF_PROBLEM_CACHE`, `DMOJ_PDF_PROBLEM_INTERNAL`, `DMOJ_CAMO_URL`, `DMOJ_CAMO_KEY`, `DMOJ_CAMO_HTTPS`, `DMOJ_CAMO_EXCLUDE` (proxy ảnh), `VNOJ_PROBLEM_ARCHIVE_SERVICE_URL/TOKEN`, `OJ_REQUESTS_TIMEOUT = 5`, `DISCORD_WEBHOOK`.
  - Markdown: `MARKDOWN_STYLES` gán kiểu lọc HTML cho từng loại nội dung (mặc định an toàn cho bình luận, hồ sơ, ticket, mô tả tổ chức; cho phép đầy đủ cho đề full markup và trang phẳng; cho phép `iframe`/`object` trong đề và lời giải). Tải ảnh: `MARTOR_UPLOAD_SAFE_EXTS = {.jpg, .png, .gif, .svg}`. PDF đề: tối đa `PDF_STATEMENT_MAX_FILE_SIZE = 5242880` byte.
- **Ai dùng được:** Người vận hành.
- **Mã nguồn:** `dmoj/settings.py:24-349`, `dmoj/settings.py:588-713`, `dmoj/settings.py:786-856`.

### QT-28. Chế độ thi chính thức
- **Làm gì:** Một công tắc khóa site cho kỳ thi tại chỗ (ví dụ thi ICPC).
- **Cách VNOJ làm:**
  - Bật bằng `VNOJ_OFFICIAL_CONTEST_MODE = True`. Gán vào `request.official_contest_mode`.
  - Tác dụng tìm thấy trong mã: không bắt đổi mật khẩu bị lộ; người dùng không sửa được mô tả, huy hiệu, tổ chức trong hồ sơ; không đổi được tên; không rời được tổ chức; không tạo blog; ảnh đại diện dùng biểu tượng nội bộ thay Gravatar; kỳ thi tạo mới bị buộc `push_announcements = True` và `disallow_virtual = True`; mỗi lần nộp bài ghi log IP vào `judge.user_submit_ip_logger`.
- **Ai dùng được:** Người vận hành bật; áp dụng cho mọi người.
- **Mã nguồn:** `dmoj/settings.py:60`, `judge/middleware.py:48`, `judge/middleware.py:65-70`, `judge/forms.py:69-74`, `judge/forms.py:126`, `judge/views/organization.py:300-302`, `judge/views/blog.py:391`, `judge/jinja2/gravatar.py:15-17`, `judge/views/contests.py:1531-1533`, `judge/views/problem.py:438-447`.

### QT-29. Chế độ tiết kiệm tài nguyên
- **Làm gì:** Giảm truy vấn nặng khi máy chủ quá tải.
- **Cách VNOJ làm:**
  - Bật bằng `VNOJ_LOW_POWER_MODE = True`.
  - Phân trang vô hạn bị giới hạn `max_page = 5` trang. Danh sách bài nộp chạy chế độ tiết kiệm với mọi người trừ superuser. Không vẽ bản đồ nhiệt cho người có hơn `heat_map_limit = 20000` bài nộp. Danh sách bài chỉ cho sắp xếp theo điểm và số người giải.
- **Ai dùng được:** Người vận hành bật.
- **Mã nguồn:** `dmoj/settings.py:176-183`, `judge/utils/infinite_paginator.py:56-151`, `judge/views/submission.py:497`, `judge/views/user.py:213`, `judge/views/problem.py:776`.

### QT-30. Ghi log
- **Làm gì:** Ghi lại hoạt động để điều tra sự cố.
- **Cách VNOJ làm:**
  - `settings.py` không khai báo `LOGGING`; cấu hình đầu ra đặt trong `local_settings.py`. `CELERY_WORKER_HIJACK_ROOT_LOGGER = False`.
  - `LogUserAccessMiddleware`: cập nhật `last_access` và `ip` của hồ sơ, tối đa mỗi 10 phút một lần trừ khi IP đổi. Khi IP đổi, ghi `<tên>,<IP cũ>,<IP mới>` vào logger `judge.user_log`. IP lấy từ `REMOTE_ADDR` (giả định nginx đã thay bằng IP thật).
  - Log JSON của bridge: logger `judge.json.bridge`, mỗi sự kiện chấm là một dòng JSON gồm tên máy chấm, địa chỉ, id bài nộp, hành động và số liệu (thời gian, bộ nhớ, điểm, kết quả...).
  - `judge.user`: ghi khi có người cố nộp vào bài không được phép. `judge.user_submit_ip_logger`: IP mỗi lần nộp, chỉ ở chế độ thi chính thức.
  - Nếu chạy dưới uWSGI, gán biến log `username` và `language` cho mỗi yêu cầu.
  - Các logger khác: `judge.bridge`, `judge.balancer`, `judge.celery`, `judge.mail.activate`, `judge.problem.archive`, `judge.problem.pdf`, `judge.mathoid`, `judge.texoid`, `judge.social_auth`, `judge.judgeapi`, `judge.html`.
  - Handler gửi lỗi qua email và Discord có giới hạn tần suất (QT-18, QT-24).
- **Ai dùng được:** Người vận hành.
- **Mã nguồn:** `judge/user_log.py`, `judge/bridge/judge_handler.py:21-22`, `judge/bridge/judge_handler.py:632-642`, `judge/views/problem.py:246-247`, `judge/views/problem.py:438-447`, `judge/views/problem.py:865-876`, `judge/middleware.py:51-53`.

### QT-31. Rút gọn URL
- **Làm gì:** Tạo link ngắn chuyển hướng tới URL dài.
- **Cách VNOJ làm:**
  - App riêng `urlshortener`. Mô hình `URLShortener`: `original_url`, `short_code` (slug, duy nhất), `created_time`, `last_access_time`, `access_count`, `is_active` (mặc định `True`). Sắp mới nhất trước.
  - Trang quản lý dưới `/shorteners/`: danh sách (20 mỗi trang), tạo, xem, sửa, xóa. Ô mã ngắn có nút sinh mã ngẫu nhiên.
  - Chuyển hướng: khi host bằng `URLSHORTENER_DOMAIN`, middleware `URLShortenerMiddleware` đổi bộ URL sang `urlshortener.urls_redirect`, dạng `<tên miền ngắn>/<mã>`. Chuyển hướng tạm thời (302), tăng `access_count`, cập nhật `last_access_time`. Mã không tồn tại hoặc bị tắt thì 404.
  - Middleware này không có trong `MIDDLEWARE` mặc định; phải tự thêm.
- **Ai dùng được:** Người có quyền `urlshortener.view/add/change/delete_urlshortener`.
- **Mã nguồn:** `urlshortener/models.py`, `urlshortener/views.py`, `urlshortener/urls.py`, `urlshortener/urls_redirect.py`, `urlshortener/middleware.py`, `urlshortener/forms.py`, `templates/urlshortener/`, `dmoj/urls.py:112`, trang `urlshortener_list`, `urlshortener_create`, `urlshortener_detail`, `urlshortener_edit`, `urlshortener_delete`.

### QT-32. Trang trạng thái máy chấm
- **Làm gì:** Cho biết máy chấm nào đang chạy và phiên bản trình biên dịch.
- **Cách VNOJ làm:**
  - `status_all` (`/status/`): danh sách máy chấm và phiên bản runtime. Staff và superuser thấy cả máy offline; người khác chỉ thấy máy online.
  - `status_table`: phần bảng của trang trên, để tải lại định kỳ.
  - `version_matrix` (`/runtimes/matrix/`): ma trận ngôn ngữ × máy chấm với phiên bản; gộp các máy cùng tiền tố tên có cùng phiên bản; đánh dấu phiên bản mới nhất.
- **Ai dùng được:** Mọi người.
- **Mã nguồn:** `judge/views/status.py:14-122`, `dmoj/urls.py:342-344`, `dmoj/urls.py:368`, trang `status_all`, `status_table`, `version_matrix`.

### QT-33. Trang thống kê OJ cho superuser
- **Làm gì:** Biểu đồ hoạt động của site theo khoảng thời gian.
- **Cách VNOJ làm:**
  - Trang `status_oj` (`/status/oj/`) có ô chọn khoảng thời gian (phút trước, giờ trước, hôm nay, hôm qua, 7/14/30/60/90 ngày, tùy chọn).
  - Dữ liệu lấy từ `stats_data_all` (POST, gửi `start_date`, `end_date`, `utc_offset` tính bằng phút).
  - Biểu đồ: bài nộp theo ngày (chồng theo kết quả AC/PAC/WA/TLE/CE/ERR), bài nộp theo ngôn ngữ, tỉ lệ kết quả, thời gian chờ chấm, bài nộp của tổ chức và số bài tổ chức mới theo ngày.
  - Người không phải superuser nhận lỗi 400 (trang) hoặc 403 (dữ liệu).
- **Ai dùng được:** Superuser.
- **Mã nguồn:** `judge/views/status.py:31-37`, `judge/views/stats.py:92-161`, `templates/status/oj-status.html`, `dmoj/urls.py:409`, trang `status_oj`, `stats_data_all`.

### QT-34. Middleware bảo mật và xác thực
- **Làm gì:** Các lớp xử lý mỗi yêu cầu liên quan tới đăng nhập và an toàn.
- **Cách VNOJ làm:**
  - Thứ tự `MIDDLEWARE`: `ShortCircuitMiddleware`, `CommonMiddleware`, `SessionMiddleware`, `LocaleMiddleware`, `APIMiddleware`, `CsrfViewMiddleware`, `AuthenticationMiddleware`, `MiscConfigMiddleware`, `DMOJLoginMiddleware`, `MessageMiddleware`, `XFrameOptionsMiddleware`, `LogUserAccessMiddleware`, `TimezoneMiddleware`, `ImpersonateMiddleware`, `DMOJImpersonationMiddleware`, `ContestMiddleware`, `FlatpageFallbackMiddleware`, `SocialAuthExceptionMiddleware`, `RedirectFallbackMiddleware`.
  - `ShortCircuitMiddleware`: view có đánh dấu `short_circuit_middleware` chạy ngay, bỏ qua mọi middleware sau.
  - `APIMiddleware`: đọc header `Authorization: Bearer <48 ký tự>`. Token sai định dạng trả 400; token sai trả 401. Bỏ qua kiểm tra CSRF và 2FA cho yêu cầu dùng token. Chặn `/admin/` (403). Bỏ qua đường dẫn `/o/` (OAuth2).
  - `DMOJLoginMiddleware`: người bật 2FA mà chưa qua bước 2FA thì bị chuyển tới trang 2FA. Người có mật khẩu bị lộ (kiểm tra qua Pwned Passwords) bị buộc đổi mật khẩu, trừ ở chế độ thi chính thức.
  - `DMOJ_REQUIRE_STAFF_2FA = True`: staff không tắt được TOTP (trừ khi có WebAuthn) và không xóa được khóa WebAuthn cuối cùng.
  - `ContestMiddleware`: gán kỳ thi hiện tại của người dùng vào yêu cầu.
  - `IPBasedAuthMiddleware` (đăng nhập tự động theo IP gán ở `Profile.ip_auth`): có trong mã và `AUTHENTICATION_BACKENDS` có `IPBasedAuthBackend`, nhưng middleware không có trong `MIDDLEWARE` mặc định.
  - Kiểm tra mật khẩu: giống thông tin người dùng, độ dài tối thiểu, Pwned Passwords, toàn số.
  - CSRF thất bại thì chuyển về chính trang đó (`CSRF_FAILURE_VIEW`), để tương thích với chống DDoS của Cloudflare.
  - Trang lỗi riêng: `handler404`, `handler403`, `handler500` trong `judge/views/error.py`.
  - Lọc HTML trong Markdown theo `MARKDOWN_STYLES` (QT-27). Ảnh ngoài có thể đi qua proxy camo.
- **Ai dùng được:** Tự động.
- **Mã nguồn:** `dmoj/settings.py:475-495`, `dmoj/settings.py:502-515`, `dmoj/settings.py:778-784`, `judge/middleware.py:27-186`, `judge/views/two_factor.py:121-124`, `judge/views/two_factor.py:218-223`, `judge/views/widgets.py:107-111`, `dmoj/urls.py:462-464`.

### QT-35. Giới hạn tần suất
- **Làm gì:** Chặn hành vi lặp quá nhiều.
- **Cách VNOJ làm:**

  | Đối tượng | Giới hạn | Quyền vượt / ghi chú |
  |---|---|---|
  | Bài nộp đang chờ của một người | `DMOJ_SUBMISSION_LIMIT = 2`; vượt thì 429 | `judge.spam_submission` |
  | Chấm lại hàng loạt | `DMOJ_SUBMISSIONS_REJUDGE_LIMIT = 10` | `judge.rejudge_submission_lot` |
  | Yêu cầu đặt lại mật khẩu theo IP | `DMOJ_PASSWORD_RESET_LIMIT_COUNT = 10` trong `DMOJ_PASSWORD_RESET_LIMIT_WINDOW = 3600` giây; vượt thì 429 | |
  | Bình luận | `VNOJ_COMMENT_RATE_LIMIT_COUNT = None` (tắt) trong 600 giây | |
  | Chuẩn bị dữ liệu tải | 1 lần mỗi `DMOJ_USER_DATA_DOWNLOAD_RATELIMIT` / `DMOJ_CONTEST_DATA_DOWNLOAD_RATELIMIT` = 1 ngày | |
  | Email lỗi | `DMOJ_EMAIL_THROTTLING = (10, 60)` | |
  | Webhook lỗi Discord | `VNOJ_DISCORD_WEBHOOK_THROTTLING = (10, 60)` | |
  | Cảnh báo hàng đợi dài | 1 lần mỗi 5 phút | |
  | Cập nhật tiến độ chấm từ bridge tới trình duyệt | tối đa 5 tin mỗi 0.5 giây cho một bài nộp | |
- **Ai dùng được:** Tự động.
- **Mã nguồn:** `judge/views/problem.py:353-359`, `judge/admin/submission.py:170-175`, `judge/views/user.py:709-715`, `judge/comments.py:76-81`, `dmoj/settings.py:249-254`, `dmoj/settings.py:263-273`, `dmoj/settings.py:300-301`, `judge/bridge/judge_handler.py:24-25`, `judge/bridge/judge_handler.py:588-598`.

### QT-36. Tải dữ liệu người dùng và kỳ thi (phía vận hành)
- **Làm gì:** Cho người dùng tải dữ liệu của mình, cho tác giả kỳ thi tải dữ liệu kỳ thi.
- **Cách VNOJ làm:**
  - Dữ liệu người dùng: bật bằng `DMOJ_USER_DATA_DOWNLOAD` (mặc định `False`). Người bị `mute` không dùng được. Tác vụ `prepare_user_data` ghi tệp `<DMOJ_USER_DATA_CACHE>/<profile_id>.zip` gồm mã nguồn bài nộp (lọc theo kết quả, theo mẫu mã bài) kèm `info.json`, và bình luận kèm `info.json`. Mỗi người có một tệp, chuẩn bị lại thì ghi đè.
  - Dữ liệu kỳ thi: bật bằng `DMOJ_CONTEST_DATA_DOWNLOAD`. Chỉ người sửa được kỳ thi, chỉ sau khi kỳ thi kết thúc. Tệp `<DMOJ_CONTEST_DATA_CACHE>/<contest_id>.zip`, chỉ lấy lượt thi chính thức (không ảo).
  - Giới hạn: chuẩn bị lại sau 1 ngày, hoặc khi tệp không còn.
  - Phục vụ tệp: nếu đặt `DMOJ_USER_DATA_INTERNAL` / `DMOJ_CONTEST_DATA_INTERNAL` thì dùng `X-Accel-Redirect` của nginx, ngược lại Django tự gửi tệp.
  - Không có cơ chế xóa tệp hết hạn trong mã.
  - Giao diện người dùng: xem 01 và 04.
- **Ai dùng được:** Người dùng đã đăng nhập; tác giả kỳ thi.
- **Mã nguồn:** `judge/tasks/user.py`, `judge/tasks/contest.py:92-150`, `judge/views/user.py:387-475`, `judge/views/contests.py:1633-1735`, `dmoj/settings.py:263-273`, `dmoj/urls.py:194-195`, `dmoj/urls.py:251-252`, trang `user_prepare_data`, `user_download_data`, `contest_prepare_data`, `contest_download_data`.

### QT-37. Sitemap và robots.txt
- **Làm gì:** Hỗ trợ máy tìm kiếm.
- **Cách VNOJ làm:**
  - `sitemap.xml` phục vụ động. Lệnh `generate_sitemap` ghi sitemap ra tệp tĩnh (chỉ mục và từng phần) cho site có số trang lớn.
  - `robots.txt` ở gốc repo, chặn các đường dẫn quản trị và nhạy cảm: `/admin`, `/accounts`, `/api`, `/data`, `/tasks`, `/widgets`, `/mailgun/mail_activate/`, các trang sửa/tham gia/rời/yêu cầu của tổ chức, các trang nộp bài, dữ liệu test, bài nộp, ticket... Cách phục vụ tệp này (nginx) không có trong repo (chưa kiểm tra).
- **Ai dùng được:** Máy tìm kiếm; người vận hành chạy lệnh.
- **Mã nguồn:** `judge/sitemap.py`, `judge/management/commands/generate_sitemap.py`, `robots.txt`, `dmoj/urls.py:433`.

### QT-38. Sao lưu
- **Làm gì:** Sao lưu CSDL và dữ liệu bài.
- **Cách VNOJ làm:**
  - Repo không có mã sao lưu. Tìm "backup" và "mysqldump" trong mã Python, shell và Markdown không ra kết quả.
  - Gần nhất là lưu trữ lạnh bài của tổ chức qua dịch vụ ngoài (xem 07, TC-25) và các lệnh xuất dữ liệu kỳ thi (QT-19).
- **Ai dùng được:** Không áp dụng.
- **Mã nguồn:** Không có.

### QT-39. Thành phần triển khai trong repo
- **Làm gì:** Các tệp phục vụ cài đặt và chạy site.
- **Cách VNOJ làm:**
  - `502.html`: trang tĩnh "502 Bad Gateway - VNOJ" để nginx trả khi Django không phản hồi.
  - `make_style.sh`: kiểm tra đã cài `postcss`, `sass`, `autoprefixer` (qua `scripts/check-package-installed.js`), rồi biên dịch SCSS hai lần: giao diện sáng ra `resources/`, giao diện tối ra `resources/dark/`.
  - `scripts/`: chỉ có `check-package-installed.js`.
  - `package.json`: phụ thuộc cho websocket (`ws`, `commander`) và công cụ CSS; lệnh `format` chạy prettier cho `websocket/`.
  - `local_settings.py` (cạnh `settings.py`) được `exec` ở cuối settings để ghi đè. `local_urls.py` được `exec` ở cuối `urls.py` để thêm URL.
  - `CSRF_FAILURE_VIEW` chuyển về chính trang để tương thích Cloudflare (QT-34).
  - Tham số trang tĩnh: `INLINE_JQUERY`, `INLINE_FONTAWESOME`, `JQUERY_JS`, `FONTAWESOME_CSS`, `ACE_URL`, `SELECT2_JS_URL`, `SELECT2_CSS_URL`, `STATIC_URL = '/static/'`, thư mục `resources/`. Dùng `django-compressor` và `statici18n`.
  - README: phải đặt `DMOJ_PROBLEM_DATA_ROOT`; đổi `CACHES` sang memcached/redis; sửa tên miền `Site` sau khi nạp fixture `demo`; chép `testlib.h` vào máy chấm. Hướng dẫn cài đặt đầy đủ nằm ở trang tài liệu ngoài.
  - Fixture có sẵn: `demo.json`, `language_all.json`, `language_small.json`, `navbar.json`.
- **Ai dùng được:** Người vận hành.
- **Mã nguồn:** `502.html`, `make_style.sh`, `scripts/check-package-installed.js`, `package.json`, `README.md`, `dmoj/settings.py:345-349`, `dmoj/settings.py:852-856`, `dmoj/urls.py:496-501`, `judge/fixtures/`.
