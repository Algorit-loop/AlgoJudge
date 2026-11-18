# 07. Tổ chức

Nguồn: `VNOI-Admin/OJ` commit `209a32e` (04/11/2026), thư mục `reference/vnoj-src/site/`. Phần tổ chức nằm chủ yếu ở `judge/models/profile.py` (mô hình), `judge/views/organization.py` (các trang), `judge/admin/organization.py` (trang quản trị Django), `judge/tasks/organization.py` (tác vụ nền) và `templates/organization/`. Các URL khai báo ở `dmoj/urls.py:282-339`.

## Bảng quyết định

| Mã | Chức năng | Quyết định | Ghi chú |
|---|---|---|---|
| TC-01 | Mô hình dữ liệu tổ chức | | |
| TC-02 | Tạo tổ chức trên site | | |
| TC-03 | Danh sách tổ chức | | |
| TC-04 | Trang chủ tổ chức | | |
| TC-05 | Trang thành viên và bảng xếp hạng tổ chức | | |
| TC-06 | Tham gia và rời tổ chức mở | | |
| TC-07 | Xin vào tổ chức kín (yêu cầu tham gia) | | |
| TC-08 | Mã truy cập tổ chức (`access_code`) | | |
| TC-09 | Mời ra khỏi tổ chức (kick) | | |
| TC-10 | Sửa tổ chức trên site | | |
| TC-11 | Quản lý tổ chức trong trang quản trị Django | | |
| TC-12 | Vai trò admin tổ chức và quyền liên quan | | |
| TC-13 | Thông báo riêng cho admin tổ chức (`notice`) | | |
| TC-14 | Tạo bài riêng của tổ chức | | |
| TC-15 | Danh sách bài của tổ chức và bài ngẫu nhiên | | |
| TC-16 | Nhãn bài của tổ chức | | |
| TC-17 | Xóa hàng loạt bài của tổ chức | | |
| TC-18 | Kỳ thi của tổ chức | | |
| TC-19 | Bài nộp của tổ chức | | |
| TC-20 | Blog của tổ chức | | |
| TC-21 | Trang bài đã giải của một thành viên | | |
| TC-22 | Hệ thống credit (thời gian chấm) | | |
| TC-23 | Trang chi phí và dung lượng | | |
| TC-24 | Hạn mức số bài và dung lượng (quota) | | |
| TC-25 | Bài bị lưu trữ lạnh và khôi phục | | |
| TC-26 | Tên miền phụ cho tổ chức | | |

## Chi tiết

### TC-01. Mô hình dữ liệu tổ chức
- **Làm gì:** Lưu thông tin một tổ chức (trường, câu lạc bộ, lớp học) và các số liệu đi kèm.
- **Cách VNOJ làm:**
  - Các trường của `Organization`:

    | Trường | Kiểu, giới hạn | Mặc định | Ý nghĩa |
    |---|---|---|---|
    | `name` | chuỗi, tối đa 128 | | Tên tổ chức |
    | `slug` | slug, tối đa 128, duy nhất, phải bắt đầu bằng chữ cái | | Tên dùng trong URL |
    | `short_name` | chuỗi, tối đa 20 | | Tên ngắn, hiện cạnh tên người dùng trong kỳ thi |
    | `about` | văn bản Markdown | | Mô tả tổ chức |
    | `notice` | văn bản | rỗng | Biểu ngữ cảnh báo chỉ admin tổ chức thấy (xem TC-13) |
    | `admins` | nhiều-nhiều tới `Profile` | | Những người được sửa tổ chức |
    | `creation_date` | ngày giờ, tự gán khi tạo | | Ngày tạo |
    | `is_open` | đúng/sai | `False` | Cho phép tự tham gia |
    | `is_unlisted` | đúng/sai | `True` | Ẩn khỏi danh sách tổ chức |
    | `slots` | số nguyên, có thể trống | trống | Số thành viên tối đa, chỉ áp dụng cho tổ chức kín |
    | `access_code` | chuỗi, tối đa 7, có thể trống | trống | "Mã truy cập cho học sinh" (xem TC-08) |
    | `logo_override_image` | chuỗi URL, tối đa 150 | rỗng | Ảnh thay logo của site khi xem trang tổ chức |
    | `performance_points` | số thực | 0 | Điểm năng lực của tổ chức |
    | `member_count` | số nguyên | 0 | Số thành viên (lưu sẵn) |
    | `current_consumed_credit` | số thực (giây) | 0 | Credit đã dùng trong tháng này |
    | `paid_credit` | số thực (giây), cột DB `available_credit` | 0 | Credit đã mua còn lại |
    | `free_credit` | số thực (giây), cột DB `monthly_credit` | 0 | Credit miễn phí còn lại trong tháng |
    | `monthly_free_credit_limit` | số thực (giây) | `VNOJ_MONTHLY_FREE_CREDIT` | Credit miễn phí cấp mỗi tháng |
  - Thành viên được lưu ở phía người dùng: `Profile.organizations` là quan hệ nhiều-nhiều có thứ tự (`SortedManyToManyField`). Tổ chức đầu tiên trong danh sách được coi là tổ chức chính của người dùng (`Profile.organization`).
  - Điểm tổ chức: lấy điểm năng lực của các thành viên có điểm dương, sắp giảm dần, nhân lần lượt với `0.95^i` (tối đa 100 người), rồi nhân `VNOJ_ORG_PP_SCALE = 1`. Hằng số: `VNOJ_ORG_PP_STEP = 0.95`, `VNOJ_ORG_PP_ENTRIES = 100`.
  - Điểm và số thành viên được tính lại mỗi khi danh sách tổ chức của một người thay đổi (tín hiệu `m2m_changed`). Điểm cũng được tính lại khi điểm cá nhân của thành viên thay đổi.
  - Khi một người được thêm vào `admins`, tín hiệu tự thêm người đó làm thành viên.
  - Mô hình phụ: `OrganizationRequest` (TC-07), `OrganizationMonthlyUsage` (TC-22), `OrganizationQuota` (TC-24), `OrganizationProblemTag` (TC-16).
- **Ai dùng được:** Không áp dụng (mô hình dữ liệu).
- **Mã nguồn:** `judge/models/profile.py:44-195`, `judge/models/profile.py:268-269`, `judge/models/profile.py:339-345`, `judge/models/profile.py:415-416`, `judge/signals.py:158-163`, `judge/signals.py:192-201`, `dmoj/settings.py:53-55`.

### TC-02. Tạo tổ chức trên site
- **Làm gì:** Cho người có quyền tự tạo tổ chức mới từ giao diện site.
- **Cách VNOJ làm:**
  - Cần quyền Django `judge.add_organization`. Không có quyền thì nhận thông báo lỗi 403.
  - Giới hạn: nếu người dùng đang là admin của từ `VNOJ_ORGANIZATION_ADMIN_LIMIT = 3` tổ chức trở lên thì bị chặn, hiện trang `organization/create-limit-error.html` liệt kê các tổ chức họ đang quản lý.
  - Quyền vượt giới hạn là `spam_organization`. Mã gọi `has_perm('spam_organization')` không có tiền tố `judge.`. Theo cách Django kiểm quyền, lời gọi này chỉ đúng với superuser (chưa kiểm tra chạy thực tế).
  - Biểu mẫu `OrganizationForm` gồm: `name`, `slug`, `paid_credit`, `monthly_free_credit_limit`, `is_open`, `about` (trình soạn Markdown có xem trước), `logo_override_image`, `admins`. Credit nhập theo giờ, lưu theo giây (nhân 3600).
  - Ba trường `admins`, `paid_credit`, `monthly_free_credit_limit` chỉ hiện với người có quyền `judge.organization_admin`.
  - Khi lưu: `short_name` = 20 ký tự đầu của `slug`; `free_credit` = `monthly_free_credit_limit`; tạo một bản ghi lịch sử (reversion) với ghi chú "Created on site".
  - Mọi admin của tổ chức được thêm vào nhóm Django tên `GROUP_PERMISSION_FOR_ORG_ADMIN = 'Org Admin'`. Nhóm này phải có sẵn trong CSDL; mã dùng `Group.objects.get` nên sẽ lỗi nếu thiếu nhóm (chưa kiểm tra).
  - Mã không tự thêm người tạo vào `admins`. Người không có quyền `judge.organization_admin` sẽ không thấy ô `admins`.
  - Tổ chức mới mặc định `is_unlisted = True`, nên không hiện ở danh sách công khai cho tới khi có người bỏ cờ này trong trang quản trị Django.
- **Ai dùng được:** Người có quyền `judge.add_organization`.
- **Mã nguồn:** `judge/views/organization.py:454-493`, `judge/forms.py:456-501`, `judge/utils/organization.py:58-63`, `dmoj/settings.py:111-113`, `dmoj/settings.py:825`, trang `organization_create`.

### TC-03. Danh sách tổ chức
- **Làm gì:** Liệt kê các tổ chức công khai.
- **Cách VNOJ làm:**
  - Mặc định chỉ hiện tổ chức có `is_unlisted = False`. Phân trang 200 tổ chức mỗi trang.
  - Bảng có cột Tên, Điểm (`performance_points`), Số thành viên. Bảng sắp xếp được phía trình duyệt, mặc định theo điểm giảm dần.
  - Người đăng nhập thấy thêm phần "tổ chức của tôi".
  - Người có quyền `judge.edit_all_organization` có ô "Show all orgs". Khi bật, thấy cả tổ chức ẩn và thêm cột Tên ngắn, Slug, Admin. Lựa chọn này được nhớ trong session. Khi bật thì có ô tìm theo tên, slug, tên ngắn, tên đăng nhập của admin.
  - Người có quyền `judge.add_organization` thấy nút "Create new organization".
- **Ai dùng được:** Mọi người (kể cả khách).
- **Mã nguồn:** `judge/views/organization.py:163-218`, `templates/organization/list.html`, `templates/organization/list-tabs.html`, trang `organization_list`.

### TC-04. Trang chủ tổ chức
- **Làm gì:** Trang giới thiệu tổ chức, tin tức, bài mới và kỳ thi mới.
- **Cách VNOJ làm:**
  - Mọi người xem được tên, mô tả (`about`) và nút tham gia. Mô tả được lưu đệm 3600 giây (`organization_html`).
  - Thanh tab: Trang chủ, Thành viên, Danh sách bài, Danh sách kỳ thi, Bài nộp. Admin tổ chức có thêm tab "Create new problem" (nếu có quyền `judge.create_organization_problem`), "Create new contest" (nếu có `judge.create_private_contest`), "Manage tags".
  - Mục "News" là blog của tổ chức (TC-20). Người ngoài tổ chức không thấy bài nào, kể cả khi tổ chức mở. Thành viên thấy bài đã công khai và đến giờ đăng. Admin tổ chức thấy bài công khai và bài của chính mình. Người có `judge.edit_all_post` thấy tất cả. Bài ghim (`sticky`) lên đầu.
  - "New problems": tối đa `DMOJ_BLOG_NEW_PROBLEM_COUNT = 7` bài công khai mới nhất của tổ chức. Chỉ hiện cho thành viên, hoặc người có `judge.see_organization_problem` hay `judge.edit_all_problem`.
  - "New contests": tối đa 7 kỳ thi hiển thị của tổ chức. Chỉ hiện cho thành viên, hoặc người có `judge.see_private_contest` hay `judge.edit_all_contest`. Thành viên thường chỉ thấy kỳ thi không riêng tư hoặc kỳ thi họ được mời.
  - Khối "Controls": nút Rời tổ chức (có hộp xác nhận), Tham gia (tổ chức mở), hoặc Xin tham gia (tổ chức kín). Admin tổ chức thấy thêm: "Organization cost", "View requests" kèm số yêu cầu đang chờ (tổ chức kín), "Create blog post" (nếu có `judge.edit_organization_post`), "Edit organization". Người có `judge.change_organization` thấy link tới trang quản trị Django.
  - Logo site được thay bằng `logo_override_image` nếu có.
- **Ai dùng được:** Mọi người; các phần riêng như trên.
- **Mã nguồn:** `judge/views/organization.py:64-150`, `judge/views/organization.py:656-728`, `templates/organization/home.html`, `templates/organization/tabs.html`, trang `organization_home`.

### TC-05. Trang thành viên và bảng xếp hạng tổ chức
- **Làm gì:** Liệt kê thành viên tổ chức theo thứ hạng.
- **Cách VNOJ làm:**
  - Chỉ liệt kê thành viên không bị ẩn (`is_unlisted = False`). 100 người mỗi trang.
  - Sắp xếp được theo `points`, `problem_count`, `rating`, `performance_points`. Mặc định theo `performance_points` giảm dần.
  - Trang `org_user_ranking_redirect` nhận `?handle=<tên>` và chuyển tới đúng trang chứa người đó, có neo tới dòng của họ.
  - Admin tổ chức thấy thêm cột nút "kick" (TC-09) và cột link xem bài đã giải (TC-21).
- **Ai dùng được:** Mọi người.
- **Mã nguồn:** `judge/views/organization.py:221-262`, `templates/organization/users-table.html`, trang `organization_users`, `org_user_ranking_redirect`.

### TC-06. Tham gia và rời tổ chức mở
- **Làm gì:** Người dùng tự vào hoặc tự rời tổ chức.
- **Cách VNOJ làm:**
  - Tham gia (POST): báo lỗi nếu đã là thành viên, hoặc tổ chức không mở (`is_open = False`).
  - Giới hạn: một người chỉ ở tối đa `DMOJ_USER_MAX_ORGANIZATION_COUNT = 3` tổ chức mở. Tổ chức kín không tính.
  - Nút tham gia không kiểm tra `slots`.
  - Rời (POST): bị chặn khi bật chế độ thi chính thức (`VNOJ_OFFICIAL_CONTEST_MODE`). Báo lỗi nếu không phải thành viên. Admin tổ chức không được tự rời.
  - Người dùng còn có thể chọn tổ chức ở trang sửa hồ sơ: chỉ chọn được tổ chức mở và không ẩn, cộng với các tổ chức đang tham gia. Giới hạn 3 tổ chức mở vẫn áp dụng. Ở chế độ thi chính thức, ô này bị ẩn (xem 01).
- **Ai dùng được:** Người đã đăng nhập.
- **Mã nguồn:** `judge/views/organization.py:265-307`, `judge/forms.py:89-118`, `dmoj/settings.py:261`, trang `join_organization`, `leave_organization`.

### TC-07. Xin vào tổ chức kín (yêu cầu tham gia)
- **Làm gì:** Người dùng gửi đơn xin vào tổ chức kín, admin tổ chức duyệt hoặc từ chối.
- **Cách VNOJ làm:**
  - Mô hình `OrganizationRequest`: `user`, `organization`, `time` (tự gán), `state` (`P` = chờ, `A` = duyệt, `R` = từ chối), `reason` (lý do, văn bản).
  - Gửi đơn: biểu mẫu chỉ có ô "lý do". Trả 404 nếu tổ chức đang mở. Không cho gửi khi đã có đơn đang chờ. Sau khi gửi, chuyển tới trang chi tiết đơn.
  - Trang chi tiết đơn: chỉ người gửi và admin tổ chức xem được.
  - Trang duyệt (`pending`): danh sách đơn đang chờ dạng formset. Mỗi dòng đổi được trạng thái và có ô xóa đơn. Nhiều đơn được xử lý trong một lần gửi.
  - Nếu tổ chức có `slots`, hệ thống đếm số đơn sẽ duyệt. Nếu vượt số chỗ còn lại (`slots` trừ số thành viên) thì báo lỗi và không lưu gì.
  - Đơn được duyệt thì người gửi được thêm vào tổ chức. Sau khi lưu, hiện thông báo số người đã duyệt và đã từ chối.
  - Trang nhật ký có ba tab: `log` (cả duyệt và từ chối), `approved`, `rejected`. Đơn sắp mới nhất trước.
  - Các trang duyệt chỉ kiểm tra `organization.is_admin`. Quyền `judge.edit_all_organization` không mở được các trang này.
  - Trong trang quản trị Django, đơn chỉ xem được, ba trường `user`, `organization`, `state` là chỉ đọc.
- **Ai dùng được:** Người đã đăng nhập gửi đơn; admin tổ chức duyệt.
- **Mã nguồn:** `judge/models/profile.py:597-611`, `judge/views/organization.py:310-451`, `judge/admin/organization.py:108-114`, `templates/organization/requests/`, trang `request_organization`, `request_organization_detail`, `organization_requests_pending`, `organization_requests_log`, `organization_requests_approved`, `organization_requests_rejected`.

### TC-08. Mã truy cập tổ chức (`access_code`)
- **Làm gì:** Trường lưu mã 7 ký tự, mô tả là "Student access code".
- **Cách VNOJ làm:**
  - Trường có trong mô hình nhưng không xuất hiện trong biểu mẫu site, không có trong trang quản trị Django, và không có view nào đọc nó. Không có luồng tham gia bằng mã cho tổ chức.
  - Mã truy cập trong `judge/forms.py:885` là của kỳ thi, không phải của tổ chức.
- **Ai dùng được:** Không ai (trường bỏ ngỏ).
- **Mã nguồn:** `judge/models/profile.py:66-67`, `judge/admin/organization.py:62-63`.

### TC-09. Mời ra khỏi tổ chức (kick)
- **Làm gì:** Admin tổ chức xóa một thành viên khỏi tổ chức.
- **Cách VNOJ làm:**
  - Gửi POST với `user` là id hồ sơ. Báo lỗi 400 nếu người đó không tồn tại, không phải thành viên, hoặc là admin của tổ chức.
  - Thành công thì quay về trang thành viên.
- **Ai dùng được:** Admin tổ chức hoặc người có `judge.edit_all_organization`.
- **Mã nguồn:** `judge/views/organization.py:629-650`, trang `organization_user_kick`.

### TC-10. Sửa tổ chức trên site
- **Làm gì:** Admin tổ chức sửa thông tin tổ chức.
- **Cách VNOJ làm:**
  - Dùng chung biểu mẫu với TC-02. Người không có `judge.organization_admin` không sửa được `admins`, `paid_credit`, `monthly_free_credit_limit`.
  - Các trường `short_name`, `is_unlisted`, `slots`, `notice` không có trên site, chỉ sửa trong trang quản trị Django.
  - Mỗi lần lưu tạo bản ghi lịch sử (ghi chú "Edited from site") và thêm mọi admin vào nhóm `Org Admin`.
  - Người có quyền `judge.add_organizationquota` thấy thêm khu vực cấp hạn mức (TC-24).
- **Ai dùng được:** Admin tổ chức hoặc người có `judge.edit_all_organization`.
- **Mã nguồn:** `judge/views/organization.py:496-527`, `templates/organization/edit.html`, trang `edit_organization`.

### TC-11. Quản lý tổ chức trong trang quản trị Django
- **Làm gì:** Màn hình quản trị đầy đủ cho tổ chức.
- **Cách VNOJ làm:**
  - Trường sửa được: `name`, `slug` (tự điền từ tên), `short_name`, `is_open`, `is_unlisted`, `paid_credit`, `about`, `notice`, `logo_override_image`, `slots`, `admins`. Chỉ đọc: `creation_date`, `current_consumed_credit`.
  - Người không có `judge.organization_admin` thì `admins`, `is_open`, `slots`, `notice` thành chỉ đọc.
  - Cột danh sách: tên, tên ngắn, mở, ẩn, `slots`, link "View on site".
  - Thao tác hàng loạt: "Recalculate scores" (tính lại điểm tổ chức).
  - Có lịch sử phiên bản (reversion).
  - Danh sách chỉ hiện tổ chức mình làm admin, trừ khi có `judge.edit_all_organization`. Cần `judge.change_organization` để sửa.
  - Có bảng con "Quota Grants" để thêm hạn mức: ngày bắt đầu, ngày kết thúc, số bài thêm, dung lượng thêm nhập theo GB (cho phép số thập phân).
  - Quyền `change_open_organization` ("Change is_open field") được khai báo nhưng không có chỗ nào trong mã kiểm tra nó.
- **Ai dùng được:** Nhân viên (staff) có quyền `judge.change_organization`.
- **Mã nguồn:** `judge/admin/organization.py:14-105`, `judge/models/profile.py:188-193`, trang `admin:judge_organization_changelist`.

### TC-12. Vai trò admin tổ chức và quyền liên quan
- **Làm gì:** Xác định ai được làm gì trong tổ chức.
- **Cách VNOJ làm:**
  - Có ba lớp kiểm tra truy cập cho các trang tổ chức:
    - Công khai (`PublicOrganizationMixin`): ai cũng xem được.
    - Riêng thành viên (`PrivateOrganizationMixin`): phải là thành viên, hoặc có một quyền "vượt" riêng cho từng trang.
    - Riêng admin (`AdminOrganizationMixin`): là admin tổ chức, hoặc có `judge.edit_all_organization`.
  - Quyền mức mô hình `Organization`:
    - `organization_admin`: được sửa danh sách admin và credit, được sửa `admins`, `is_open`, `slots`, `notice` trong admin Django.
    - `edit_all_organization`: sửa mọi tổ chức, xem tổ chức ẩn ở danh sách, chọn mọi tổ chức trong hồ sơ.
    - `change_open_organization`: khai báo nhưng không dùng.
    - `spam_organization`: tạo tổ chức không giới hạn (xem TC-02).
  - Các quyền khác mà admin tổ chức cần: `judge.create_organization_problem` (tạo bài), `judge.create_private_contest` (tạo kỳ thi), `judge.edit_organization_post` (viết blog), `judge.add_organizationquota` (cấp hạn mức). Các quyền này phải được gán qua nhóm `Org Admin` hoặc gán riêng. Repo không có fixture tạo sẵn nhóm này.
  - Admin tổ chức không tự thấy bài riêng tư của admin khác. Chỉ người có `judge.see_private_problem`, hoặc là tác giả/curator/tester của bài, mới thấy.
- **Ai dùng được:** Không áp dụng.
- **Mã nguồn:** `judge/views/organization.py:100-150`, `judge/views/organization.py:731-752`, `judge/models/profile.py:188-193`, `judge/utils/organization.py:58-63`.

### TC-13. Thông báo riêng cho admin tổ chức (`notice`)
- **Làm gì:** Hiện một biểu ngữ cảnh báo trên mọi trang của tổ chức, chỉ admin tổ chức thấy.
- **Cách VNOJ làm:**
  - Nội dung là Markdown, sửa trong trang quản trị Django.
  - Có nút đóng. Trạng thái đóng lưu ở `localStorage` theo khóa gồm id tổ chức, id người dùng và mã băm 16 ký tự của nội dung. Khi nội dung đổi, biểu ngữ hiện lại.
  - Tác vụ khôi phục bài lưu trữ (TC-25) xóa trống `notice` khi chạy xong.
- **Ai dùng được:** Hiển thị cho admin tổ chức; sửa bởi staff trong admin Django (cần `judge.organization_admin`).
- **Mã nguồn:** `judge/models/profile.py:54-55`, `judge/models/profile.py:110-112`, `templates/organization/notice.html`, `judge/tasks/organization.py:30-31`.

### TC-14. Tạo bài riêng của tổ chức
- **Làm gì:** Admin tổ chức tạo bài chỉ dành cho thành viên.
- **Cách VNOJ làm:**
  - Mã bài được điền sẵn tiền tố: các ký tự chữ-số của slug viết thường, cộng `_`.
  - Khi lưu: người tạo là tác giả; ngôn ngữ cho phép = mọi ngôn ngữ có `include_in_problem`; `is_organization_private = True`; gán `organization`; ngày bài = lúc tạo. Ghi lịch sử và gửi webhook `on_new_problem`.
  - Nếu bật `VNOJ_QUOTA_ENFORCEMENT_ENABLED` và tổ chức đã hết hạn mức (TC-24), cả lúc mở trang và lúc lưu đều hiện trang lỗi "Problem limit reached".
  - Trang tạo bài hiện cảnh báo hạn mức khi gần đầy.
  - Các trường khác của bài: xem 02.
- **Ai dùng được:** Admin tổ chức (hoặc `judge.edit_all_organization`) có thêm quyền `judge.create_organization_problem`.
- **Mã nguồn:** `judge/views/organization.py:955-998`, `judge/utils/organization.py:19-26`, trang `problem_create_organization`.

### TC-15. Danh sách bài của tổ chức và bài ngẫu nhiên
- **Làm gì:** Liệt kê bài thuộc tổ chức, lọc theo nhãn, chọn bài ngẫu nhiên.
- **Cách VNOJ làm:**
  - Chỉ thành viên xem được. Người có `judge.see_organization_problem` hoặc `judge.edit_all_problem` xem được dù không là thành viên.
  - Bài hiện ra: người có `judge.see_private_problem` thấy tất cả bài của tổ chức. Người khác thấy bài công khai, cộng bài mà họ là tác giả, curator hoặc tester.
  - Bộ lọc nhãn chọn nhiều, gồm các nhãn của tổ chức và lựa chọn "chưa gắn nhãn" (`?tag=<id>`, `?tag=untagged` hoặc `?untagged=1`). Các nhãn được nối bằng phép "hoặc".
  - Bài thường của site không bao giờ tính bài tổ chức vào điểm cá nhân (xem 02).
  - "Bài ngẫu nhiên": chuyển tới một bài ngẫu nhiên trong danh sách đã lọc. Không dùng được khi đang trong kỳ thi. Danh sách rỗng thì quay về trang danh sách.
  - Với bài tổ chức, cột "dạng bài" hiện các nhãn tổ chức thay cho dạng bài chung.
- **Ai dùng được:** Thành viên; người có quyền vượt như trên.
- **Mã nguồn:** `judge/views/organization.py:731-807`, `judge/models/problem.py:290-295`, `judge/models/problem.py:329-341`, trang `problem_list_organization`, `problem_random_organization`.

### TC-16. Nhãn bài của tổ chức
- **Làm gì:** Mỗi tổ chức có bộ nhãn riêng để phân loại bài của mình.
- **Cách VNOJ làm:**
  - Mô hình `OrganizationProblemTag`: `name` (tối đa 50), `organization`. Tên duy nhất trong một tổ chức. Sắp theo tên.
  - Bài có trường `tags` nhiều-nhiều tới các nhãn này.
  - Trang danh sách nhãn hiện số bài chưa xóa mỗi nhãn.
  - Thêm, sửa tên, xóa nhãn qua các lời gọi POST trả về JSON. Trùng tên thì trả lỗi 400.
  - Trong admin Django: danh sách theo tên và tổ chức, tìm theo tên nhãn hoặc tên tổ chức. Trong màn sửa bài ở admin, ô nhãn chỉ liệt kê nhãn của tổ chức sở hữu bài.
- **Ai dùng được:** Admin tổ chức hoặc `judge.edit_all_organization`.
- **Mã nguồn:** `judge/models/problem.py:61-73`, `judge/views/organization.py:563-626`, `judge/forms.py:504-507`, `judge/admin/taxon.py:12-15`, `judge/admin/problem.py:234-242`, trang `organization_tag_list`, `organization_tag_add`, `organization_tag_edit`, `organization_tag_delete`.

### TC-17. Xóa hàng loạt bài của tổ chức
- **Làm gì:** Admin tổ chức chọn nhiều bài và xóa một lần.
- **Cách VNOJ làm:**
  - Tối đa `MAX_BULK_DELETE_PROBLEMS = 200` bài mỗi lần.
  - Người không phải superuser chỉ xóa được bài mà họ là tác giả hoặc curator. Số bài bị bỏ qua được báo lại.
  - Đây là xóa mềm: gán `deleted_at`. Sau `VNOJ_PROBLEM_DELETION_GRACE_PERIOD = 7 ngày`, tác vụ dọn rác xóa hẳn (xem 08).
  - Ghi lịch sử với ghi chú "Bulk marked as deleted". Xóa bộ đệm biểu đồ dung lượng.
  - Sau khi xóa, quay về trang đã gửi biểu mẫu (tham số `next`, có kiểm tra cùng host) hoặc trang chi phí.
- **Ai dùng được:** Admin tổ chức hoặc `judge.edit_all_organization`.
- **Mã nguồn:** `judge/views/organization.py:60`, `judge/views/organization.py:864-918`, `judge/models/problem.py:658-664`, `dmoj/settings.py:238-239`, trang `organization_problems_bulk_delete`.

### TC-18. Kỳ thi của tổ chức
- **Làm gì:** Tạo và liệt kê kỳ thi chỉ dành cho tổ chức.
- **Cách VNOJ làm:**
  - Danh sách: chỉ kỳ thi có `is_organization_private = True` và thuộc tổ chức. Chỉ thành viên xem được; người có `judge.see_private_contest` hoặc `judge.edit_all_contest` cũng xem được.
  - Tạo: mã kỳ thi điền sẵn tiền tố slug + `_`. Người tạo là tác giả. Kỳ thi được gán `is_organization_private = True` và `organization`.
  - Thời gian chấm của bài nộp trong kỳ thi tổ chức được trừ vào credit của tổ chức (TC-22).
  - Chi tiết thiết lập kỳ thi: xem 04.
- **Ai dùng được:** Xem: thành viên. Tạo: admin tổ chức có quyền `judge.create_private_contest`.
- **Mã nguồn:** `judge/views/organization.py:921-935`, `judge/views/organization.py:1024-1048`, trang `contest_list_organization`, `contest_create_organization`.

### TC-19. Bài nộp của tổ chức
- **Làm gì:** Liệt kê bài nộp vào các bài của tổ chức.
- **Cách VNOJ làm:**
  - Lọc bài nộp có `problem.organization` là tổ chức này. Bài nộp vào kỳ thi tổ chức nhưng dùng bài ngoài tổ chức không có trong danh sách.
  - Phân trang kiểu "vô hạn" (không đếm tổng).
  - Chỉ thành viên xem được; người có `judge.view_all_submission` cũng xem được.
- **Ai dùng được:** Thành viên.
- **Mã nguồn:** `judge/views/organization.py:938-952`, trang `submission_list_organization`.

### TC-20. Blog của tổ chức
- **Làm gì:** Admin tổ chức viết bài tin tức chỉ thành viên đọc.
- **Cách VNOJ làm:**
  - Tạo bài: ngày đăng điền sẵn là lúc hiện tại. Slug ban đầu là chữ-số của slug tổ chức. Người viết là tác giả. Gán `organization`.
  - Giới hạn "phải giải đủ `VNOJ_BLOG_MIN_PROBLEM_COUNT = 10` bài mới được viết blog" không áp dụng cho blog tổ chức. Chế độ thi chính thức vẫn chặn.
  - Xem bài: người chưa đăng nhập không xem được. Thành viên xem được. Người ngoài chỉ xem được nếu có quyền sửa bài.
  - Sửa bài: người có `judge.edit_all_post`; hoặc người vừa là admin tổ chức, vừa có `judge.edit_organization_post`, vừa là tác giả bài.
  - Phiếu bầu cho bài blog tổ chức không cộng điểm đóng góp.
- **Ai dùng được:** Admin tổ chức có quyền `judge.edit_organization_post`.
- **Mã nguồn:** `judge/views/organization.py:1001-1021`, `judge/models/interface.py:100-139`, `judge/views/blog.py:388-396`, trang `blog_post_create_organization`.

### TC-21. Trang bài đã giải của một thành viên
- **Làm gì:** Admin tổ chức xem một thành viên đã giải những bài nào của tổ chức.
- **Cách VNOJ làm:**
  - Chỉ tính bài của tổ chức mà người xem được phép thấy.
  - Nhóm bài đã giải theo nhãn tổ chức. Một bài có nhiều nhãn hiện ở nhiều nhóm. Bài không nhãn vào nhóm "Untagged" (luôn cuối).
  - Các nhóm sắp theo số bài giảm dần, rồi theo tên. Bài trong nhóm sắp theo tên. Mỗi nhóm hiện 10 bài một lần (`SOLVED_PROBLEMS_PAGE_SIZE = 10`).
  - Người không phải thành viên trả lỗi 404.
- **Ai dùng được:** Admin tổ chức hoặc `judge.edit_all_organization`.
- **Mã nguồn:** `judge/views/organization.py:61`, `judge/views/organization.py:810-861`, `templates/organization/user-solved.html`, trang `organization_user_solved`.

### TC-22. Hệ thống credit (thời gian chấm)
- **Làm gì:** Tính thời gian chấm mà bài nộp của tổ chức dùng, trừ vào credit, và có thể chặn nộp khi hết credit.
- **Cách VNOJ làm:**
  - Đơn vị credit là giây thời gian chạy.
  - Đo: khi chấm xong, bridge cộng thời gian chạy của mọi test (`total_time`) và gọi `update_credit`.
  - Bài nộp thuộc tổ chức nếu bài là bài riêng của tổ chức. Nếu không, xét kỳ thi chứa bài nộp: nếu kỳ thi là kỳ thi riêng của tổ chức thì tính cho tổ chức đó.
  - Trừ credit: trừ `free_credit` trước, phần còn lại trừ vào `paid_credit`. `paid_credit` có thể âm. Luôn cộng vào `current_consumed_credit`.
  - Chặn nộp: chỉ khi bật `VNOJ_ENABLE_ORGANIZATION_CREDIT_LIMITATION` (mặc định `False`). Khi đó, nếu `free_credit + paid_credit <= 0` thì bài nộp bị từ chối với thông báo "No credit ... Ask the organization to buy more credit."
  - Đặt lại hàng tháng: tác vụ Celery `organization_monthly_reset` chạy 00:00 ngày 1 mỗi tháng (UTC). Với mỗi tổ chức có `current_consumed_credit > 0`: lưu một dòng `OrganizationMonthlyUsage` (tháng trước, số credit đã dùng), đặt `free_credit = monthly_free_credit_limit`, đặt `current_consumed_credit = 0`.
  - Mặc định: `VNOJ_MONTHLY_FREE_CREDIT = 3 * 60 * 60` (3 giờ). `VNOJ_PRICE_PER_HOUR = 50` (nghìn đồng, theo nhãn biểu đồ).
  - Lệnh bù dữ liệu: `backfill_monthly_credit` (tính lại lịch sử từ 06/2023 theo tổng thời gian test), `backfill_current_credit` (tính lại tháng hiện tại).
  - Credit nạp vào bằng tay: người có `judge.organization_admin` sửa `paid_credit` và `monthly_free_credit_limit` (theo giờ) ở trang sửa tổ chức. Không có luồng thanh toán trong mã.
- **Ai dùng được:** Tự động; chỉnh credit cần `judge.organization_admin`.
- **Mã nguồn:** `judge/models/profile.py:74-84`, `judge/models/profile.py:133-148`, `judge/models/submission.py:192-212`, `judge/bridge/judge_handler.py:384-445`, `judge/views/problem.py:374-398`, `judge/tasks/organization.py:35-55`, `dmoj/celery.py:47-53`, `dmoj/settings.py:155-160`, `judge/management/commands/backfill_current_credit.py`, `judge/management/commands/backfill_monthly_credit.py`.

### TC-23. Trang chi phí và dung lượng
- **Làm gì:** Bảng điều khiển cho admin tổ chức về dung lượng, số bài, credit và chi phí.
- **Cách VNOJ làm:**
  - Phần dung lượng: tổng dung lượng đã dùng, số bài, các gói hạn mức đang hiệu lực, cảnh báo gần đầy hoặc đã đầy (TC-24).
  - Hai biểu đồ tròn: số bài và dung lượng, chia theo lần nộp cuối: chưa có bài nộp, trên 12 tháng, 9–12, 6–9, 3–6, dưới 3 tháng. Dữ liệu được lưu đệm 7 ngày (`storage_pie_data_<id>`), xóa khi có bài bị xóa.
  - Bảng bài: sắp theo dung lượng dữ liệu test giảm dần, 200 bài mỗi trang. Hiện tác giả, curator, ngày nộp cuối. Có ô chọn để xóa hàng loạt (TC-17).
  - Bộ lọc: theo tác giả (chỉ chọn trong số admin tổ chức), theo ngày nộp cuối (sau ngày, trước ngày), hoặc "chưa có bài nộp". Có lọc nhanh 3/6/9/12 tháng.
  - Phần credit: credit miễn phí và credit đã mua còn lại (giờ, phút, giây). Biểu đồ đường credit dùng theo tháng (giờ) và chi phí theo tháng. Chi phí = max(0, credit dùng − `VNOJ_MONTHLY_FREE_CREDIT`) / 3600 × `VNOJ_PRICE_PER_HOUR`.
  - Tab con: Storage usage, Credit usage, Archived problems.
  - Không có không gian lưu trữ riêng theo tổ chức. Dữ liệu test lưu theo từng bài (xem 02). Dung lượng tổ chức là tổng `zipfile_size` của các bài chưa xóa.
- **Ai dùng được:** Admin tổ chức hoặc `judge.edit_all_organization`.
- **Mã nguồn:** `judge/views/organization.py:1051-1215`, `judge/models/profile.py:166-178`, `judge/utils/cache_helper.py:32-33`, `templates/organization/usage.html`, `templates/organization/usage-inner-tabs.html`, trang `organization_monthly_usage`.

### TC-24. Hạn mức số bài và dung lượng (quota)
- **Làm gì:** Giới hạn số bài và tổng dung lượng dữ liệu test của mỗi tổ chức. Cho phép cấp thêm theo khoảng thời gian.
- **Cách VNOJ làm:**
  - Mặc định mỗi tổ chức: `VNOJ_ORGANIZATION_DEFAULT_MAX_PROBLEMS = 1000` bài, `VNOJ_ORGANIZATION_DEFAULT_MAX_STORAGE = 5 GB`.
  - Mô hình `OrganizationQuota`: `start_date`, `end_date`, `added_problems`, `added_storage` (byte). Hạn mức thực = mặc định + tổng các gói có `start_date <= hôm nay <= end_date`.
  - Cấp trên site: biểu mẫu `QuotaGrantForm` gồm ngày bắt đầu (mặc định hôm nay), số gói (tối thiểu 1), ngày kết thúc (phải sau ngày bắt đầu). Mỗi gói = `VNOJ_QUOTA_PACKAGE_PROBLEMS = 1000` bài và `VNOJ_QUOTA_PACKAGE_STORAGE = 5 GB`.
  - Sau khi cấp, hệ thống chạy tác vụ nền khôi phục mọi bài đang lưu trữ lạnh của tổ chức (TC-25) và chuyển tới trang trạng thái tác vụ.
  - Xóa gói: nút xóa từng gói ở trang sửa tổ chức. Dùng chung quyền `judge.add_organizationquota`.
  - Cấp trong admin Django: bảng con "Quota Grants", nhập dung lượng theo GB.
  - Cảnh báo: khi số bài hoặc dung lượng đạt `VNOJ_QUOTA_WARNING_THRESHOLD = 0.8` (80%) hạn mức. `VNOJ_QUOTA_WARNING_SUFFIX` (mặc định rỗng) là đoạn HTML nối vào cuối mỗi cảnh báo.
  - Chặn: chỉ khi `VNOJ_QUOTA_ENFORCEMENT_ENABLED = True` (mặc định `False`). Khi chặn: không tạo bài mới nếu đủ số bài hoặc hết dung lượng; không tải dữ liệu test lên nếu hết dung lượng; không khôi phục bài lưu trữ.
  - Lệnh `backfill_problem_data_size` tính lại kích thước dữ liệu bài (zip, generator, checker, grader, header), có tùy chọn `--dry-run`.
- **Ai dùng được:** Cấp/xóa gói: người có `judge.add_organizationquota`. Xem: admin tổ chức.
- **Mã nguồn:** `judge/models/profile.py:150-184`, `judge/models/profile.py:198-224`, `judge/views/organization.py:530-560`, `judge/forms.py:510-536`, `judge/utils/organization.py:19-55`, `judge/views/problem_data.py:304-317`, `judge/admin/organization.py:23-57`, `dmoj/settings.py:162-173`, trang `organization_quota_add`, `organization_quota_delete`.

### TC-25. Bài bị lưu trữ lạnh và khôi phục
- **Làm gì:** Liệt kê bài có dữ liệu đã bị chuyển sang kho lưu trữ lạnh, cho tải về và khôi phục.
- **Cách VNOJ làm:**
  - Bài có trường `archived_at`. Khác rỗng nghĩa là dữ liệu đã ở kho lạnh. `ProblemData.archived_size` lưu kích thước phần đã lưu trữ.
  - Việc chuyển bài vào kho lạnh do một dịch vụ ngoài làm. Repo chỉ có lớp gọi dịch vụ (`ArchiveService`) với ba lệnh `GET /download`, `POST /restore`, `POST /archive`. Cấu hình: `VNOJ_PROBLEM_ARCHIVE_SERVICE_URL`, `VNOJ_PROBLEM_ARCHIVE_SERVICE_TOKEN` (gửi dạng Bearer), thời gian chờ `OJ_REQUESTS_TIMEOUT = 5` giây. Mã trong repo không gọi lệnh `archive`.
  - Trang danh sách: sắp theo thời điểm lưu trữ, 200 bài mỗi trang, có kích thước đã lưu trữ và ngày nộp cuối. `?problem=<mã>` lọc một bài (link cố định).
  - Trang ghi rõ bài lưu trữ bị xóa vĩnh viễn sau `VNOJ_PROBLEM_ARCHIVE_RETENTION = 180 ngày`. Con số này chỉ để hiển thị; lịch xóa thật do dịch vụ ngoài quyết định.
  - Khôi phục một bài: nếu có dữ liệu đã lưu trữ thì gọi dịch vụ `restore`, rồi xóa `archived_at` và đặt `archived_size = 0`. Lỗi dịch vụ thì báo "Please try again later". Bị chặn nếu hết hạn mức và bật cờ chặn.
  - Khôi phục hàng loạt: tác vụ Celery `restore_organization_archived_problems`, có thanh tiến độ, trả về số bài khôi phục được và thất bại, rồi xóa `notice` của tổ chức. Tự chạy sau khi cấp hạn mức (TC-24).
  - Tải dữ liệu đã lưu trữ: trang `problem_download_archived_data` xin dịch vụ một URL ký sẵn rồi chuyển hướng tới đó.
- **Ai dùng được:** Admin tổ chức hoặc `judge.edit_all_organization`.
- **Mã nguồn:** `judge/models/problem.py:246-248`, `judge/utils/problem_archive.py`, `judge/views/organization.py:1218-1275`, `judge/tasks/organization.py:12-32`, `judge/views/problem_download.py:100-122`, `dmoj/settings.py:196-199`, `dmoj/settings.py:240-242`, trang `organization_archived_problems`, `organization_archived_problem_restore`, `problem_download_archived_data`.

### TC-26. Tên miền phụ cho tổ chức
- **Làm gì:** Cho mỗi tổ chức một tên miền phụ dạng `<slug>.<tên miền>`.
- **Cách VNOJ làm:**
  - `OrganizationSubdomainMiddleware` lấy phần đầu của host. Bỏ qua nếu là số hoặc nằm trong `VNOJ_IGNORED_ORGANIZATION_SUBDOMAINS = ['oj', 'www', 'localhost']`.
  - Ngược lại, tìm tổ chức có slug trùng; không có thì 404. Gán `request.organization`.
  - Truy cập `/` trên tên miền phụ thì chuyển tới trang chủ tổ chức.
  - Trên tên miền phụ: không xem được trang của tổ chức khác (403); thanh tab tổ chức bị ẩn; tiêu đề trang đổi (ví dụ "Members"); logo được thay bằng `logo_override_image`.
  - Middleware này không có trong danh sách `MIDDLEWARE` mặc định. Phải tự thêm trong `local_settings.py` để bật.
- **Ai dùng được:** Mọi người truy cập qua tên miền phụ.
- **Mã nguồn:** `judge/middleware.py:232-252`, `judge/views/organization.py:85-88`, `judge/views/organization.py:107-108`, `dmoj/settings.py:152-153`, `dmoj/settings.py:475-495`, `templates/organization/tabs.html:9-23`.
