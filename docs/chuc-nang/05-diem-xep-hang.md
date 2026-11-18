# 05. Điểm và xếp hạng người dùng

Nguồn: `VNOI-Admin/OJ` commit `209a32e` (04/11/2026), thư mục `reference/vnoj-src/site/`. Các trường điểm nằm trên model `Profile` và `Organization` (`judge/models/profile.py`). Hàm tính nằm ngay trong model và trong `judge/performance_points.py`. Trang xếp hạng nằm ở `judge/views/user.py`, khối trang chủ nằm ở `judge/views/blog.py`.

Thuật toán rating kỳ thi và các bậc hiển thị (display rank): xem 04. Các trường hồ sơ khác: xem 01.

## Bảng quyết định

| Mã | Chức năng | Quyết định | Ghi chú |
|---|---|---|---|
| XH-01 | Điểm bài nộp: điểm bài, chấm từng phần, subtask | | |
| XH-02 | Điểm luyện tập `points` và số bài đã giải `problem_count` | | |
| XH-03 | Điểm hiệu suất `performance_points` (công thức có trọng số giảm dần + thưởng) | | |
| XH-04 | Thời điểm và cách tính lại điểm | | |
| XH-05 | Bảng phân rã điểm và hạng trên trang cá nhân | | |
| XH-06 | Điểm đóng góp `contribution_points` | | |
| XH-07 | Điểm của tổ chức (organization PP) | | |
| XH-08 | Bảng xếp hạng người dùng (`user_list`) | | |
| XH-09 | Ô tìm và nhảy tới vị trí của một người (`user_ranking_redirect`) | | |
| XH-10 | Bảng người đóng góp (`contributors_list`) | | |
| XH-11 | Huy hiệu (badge) và huy hiệu hiển thị | | |
| XH-12 | Top người dùng và top đóng góp trên trang chủ | | |
| XH-13 | Trường `vnoj_points` | | |
| XH-14 | Trang thống kê hệ thống (`status_oj`, `stats_data_all`) | | |

## Chi tiết

### XH-01. Điểm bài nộp: điểm bài, chấm từng phần, subtask
- **Làm gì:** Quy đổi kết quả chấm của một bài nộp thành số điểm. Mọi loại điểm người dùng ở dưới đều dựng trên con số này.
- **Cách VNOJ làm:**
  - Mỗi bài có trường `points` (điểm của bài) và cờ `partial`. `partial` nghĩa là cho phép chấm từng phần: làm đúng một số test vẫn được một phần điểm.
  - Giới hạn điểm bài: tối thiểu `DMOJ_PROBLEM_MIN_PROBLEM_POINTS = 0.01`, tối đa `DMOJ_PROBLEM_MAX_PROBLEM_POINTS = 2`. Nghĩa là trên VNOJ một bài chỉ đáng từ 0,01 đến 2 điểm.
  - Bài có `partial` được hiển thị kèm hậu tố `p` (ví dụ `1.5p`).
  - Khi chấm xong, hệ thống cộng điểm các test lẻ. Với test thuộc một nhóm (batch, tức subtask), nhóm chỉ được điểm nhỏ nhất trong các test của nhóm. Kết quả là `case_points / case_total`, làm tròn 3 chữ số.
  - Điểm bài nộp = `case_points / case_total × problem.points`, làm tròn 3 chữ số.
  - Nếu bài không có `partial` và điểm chưa bằng điểm tối đa thì bài nộp được 0 điểm.
- **Ai dùng được:** Tự động khi chấm. Người sửa bài đặt `points` và `partial` (xem 02).
- **Mã nguồn:** `judge/bridge/judge_handler.py:395-422`, `judge/models/problem.py:209-214`, `dmoj/settings.py:234-235`

### XH-02. Điểm luyện tập `points` và số bài đã giải `problem_count`
- **Làm gì:** Tổng điểm thô của người dùng và số bài họ đã làm đúng hoàn toàn.
- **Cách VNOJ làm:**
  - Chỉ tính bài công khai: `is_public=True` và `is_organization_private=False` (`Problem.get_public_problems()`). Bài riêng của tổ chức và bài ẩn không được tính.
  - Với mỗi bài, lấy điểm cao nhất trong các bài nộp của người đó. Bỏ bài có điểm cao nhất bằng 0.
  - `points` = tổng các điểm cao nhất đó. Không có trọng số.
  - `problem_count` = số bài công khai khác nhau mà người đó có ít nhất một bài nộp kết quả `AC` (Accepted, đúng hoàn toàn). Bài chỉ được điểm một phần không được đếm.
  - Bài nộp trong kỳ thi cũng được tính, miễn là bài đó công khai.
  - `problem_count` còn là ngưỡng để mở quyền tương tác: `VNOJ_INTERACT_MIN_PROBLEM_COUNT = 5` (bình luận, bỏ phiếu) và `VNOJ_BLOG_MIN_PROBLEM_COUNT = 10` (viết blog). Xem 06.
  - `points` hiện không hiển thị trực tiếp ở bảng xếp hạng. Nó chỉ dùng làm khóa sắp xếp ẩn (`?order=-points`) và trong bảng người dùng của tổ chức.
- **Ai dùng được:** Mọi người xem. Hệ thống tự tính.
- **Mã nguồn:** `judge/models/profile.py:255-259`, `judge/models/profile.py:393-417`, `judge/models/problem.py:444-447`, `dmoj/settings.py:127-129`

### XH-03. Điểm hiệu suất `performance_points`
- **Làm gì:** Điểm chính dùng để xếp hạng theo bài tập. Nó thưởng việc giải bài điểm cao hơn là giải thật nhiều bài dễ.
- **Cách VNOJ làm:**
  - Lấy danh sách điểm cao nhất của từng bài công khai (như XH-02), xếp giảm dần.
  - Bài thứ `i` (đếm từ 0) được nhân với trọng số `DMOJ_PP_STEP^i`. Mặc định `DMOJ_PP_STEP = 0.98514`.
  - Chỉ tính tối đa `DMOJ_PP_ENTRIES = 300` bài đầu. Bài thứ 300 còn trọng số khoảng 1,1%.
  - Cộng thêm điểm thưởng `DMOJ_PP_BONUS_FUNCTION(problem_count)`. Mặc định là `0.05 × problem_count`. Trong mã còn ghi chú công thức gốc của DMOJ `15 × (1 − 0.997^n)` nhưng đã bị thay.
  - Công thức: `pp = Σ điểm_i × 0.98514^i + 0.05 × problem_count`.
  - Ví dụ: người dùng giải đúng hoàn toàn 3 bài, điểm 2; 1,5; 1. Phần trọng số = 2 + 1,5 × 0,98514 + 1 × 0,97050 = 2 + 1,47771 + 0,97050 = 4,44821. Thưởng = 0,05 × 3 = 0,15. Tổng ≈ 4,60.
  - Nếu bài thứ ba chỉ được 1 điểm từng phần (chưa `AC`), phần trọng số không đổi nhưng thưởng chỉ còn 0,05 × 2 = 0,10. Tổng ≈ 4,55.
  - Điểm hiển thị làm tròn 2 chữ số.
  - Ghi chú trong settings dẫn tới bài `dmoj.ca/post/103-point-system-rework`.
- **Ai dùng được:** Mọi người xem. Hệ thống tự tính.
- **Mã nguồn:** `dmoj/settings.py:48-51`, `judge/models/profile.py:385`, `judge/models/profile.py:393-417`

### XH-04. Thời điểm và cách tính lại điểm
- **Làm gì:** Giữ `points`, `problem_count`, `performance_points` của người dùng và điểm tổ chức luôn đúng.
- **Cách VNOJ làm:**
  - Hàm duy nhất là `Profile.calculate_points()`. Hàm chỉ ghi vào DB khi một trong ba giá trị thay đổi. Khi có thay đổi, nó gọi lại `calculate_points()` của mọi tổ chức người đó thuộc về.
  - Gọi sau mỗi lần chấm xong, nếu bài công khai và không riêng tổ chức (`judge/bridge/judge_handler.py:438-440`).
  - Gọi khi xóa một bài nộp (signal `post_delete` của `Submission`, `judge/signals.py:136-142`).
  - Khi người sửa bài đổi `points` của bài, hàm `Problem.save()` phát hiện thay đổi và đẩy task Celery `rescore_problem`. Task tính lại điểm mọi bài nộp của bài đó, rồi gọi `calculate_points()` cho từng người có bài nộp. Task có thanh tiến trình theo hai giai đoạn (`judge/models/problem.py:639-648`, `judge/tasks/submission.py:42-71`).
  - Admin có action "Recalculate scores" trên danh sách hồ sơ và "Rescore" trên danh sách bài nộp (xem 08) (`judge/admin/profile.py:128-136`, `judge/admin/submission.py:190-206`).
  - Đổi `is_public` hoặc `is_organization_private` của bài không tự tính lại điểm. Không tìm thấy lời gọi nào cho trường hợp này.
  - Không có tác vụ định kỳ tính lại toàn bộ.
- **Ai dùng được:** Tự động. Action admin cần quyền sửa hồ sơ/bài nộp trong admin.
- **Mã nguồn:** như trên

### XH-05. Bảng phân rã điểm và hạng trên trang cá nhân
- **Làm gì:** Cho người xem thấy điểm hiệu suất được cộng từ những bài nào.
- **Cách VNOJ làm:**
  - Trang `user_problems` (`/user/<tên>/solved/`) có mục "Points breakdown". Mỗi dòng gồm: tên bài, điểm bài nộp tốt nhất `case_points / case_total`, mã kết quả, ngôn ngữ, thời gian, điểm (`pp`), trọng số theo phần trăm và điểm sau trọng số.
  - Ban đầu hiện 10 dòng. Nút "Load more..." gọi `user_pp_ajax` lấy thêm 10 dòng mỗi lần, đến hết 300 dòng.
  - Truy vấn chọn bài nộp đạt điểm cao nhất cho mỗi bài; nếu trùng điểm thì lấy bài nộp mới nhất (`judge/performance_points.py:17-56`).
  - Cùng trang có danh sách bài đã làm được điểm, nhóm theo nhóm bài, kèm tổng điểm từng nhóm, và danh sách bài người đó là tác giả.
  - Đầu trang cá nhân hiện: "Problems solved" (`problem_count`), "Rank by points" (hạng theo `performance_points`), "Total points" (`performance_points`), "Contribution points", và "Rank by rating" nếu có rating.
  - "Rank by points" = số người không ẩn có `performance_points` lớn hơn, cộng 1.
- **Ai dùng được:** Mọi người, kể cả khách.
- **Mã nguồn:** `judge/views/user.py:127-146`, `judge/views/user.py:331-385`, `templates/user/user-problems.html:1-47`, `templates/user/pp-row.html`, `templates/user/user-base.html:23-57`, trang `user_problems`, `user_pp_ajax`

### XH-06. Điểm đóng góp `contribution_points`
- **Làm gì:** Đo mức đóng góp cộng đồng của người dùng qua phiếu bầu bình luận, phiếu bầu blog và ticket tốt.
- **Cách VNOJ làm:**
  - Kiểu số nguyên, mặc định 0. Có thể âm.
  - Mỗi phiếu lên/xuống cho bình luận của người đó: ±`VNOJ_CP_COMMENT` (mặc định 1).
  - Mỗi phiếu lên/xuống cho blog của người đó: ±`VNOJ_CP_COMMENT`, chia cho mọi tác giả. Chỉ tính bài `visible=True` và không thuộc tổ chức.
  - Mỗi ticket người đó mở được đánh dấu "good" (`is_contributive=True`): +`VNOJ_CP_TICKET` (mặc định 10). Bỏ đánh dấu ("norm") thì trừ lại 10.
  - Cập nhật tức thời theo kiểu cộng dồn (`update_contribution_points(delta)`) ngay khi có phiếu hoặc đánh dấu ticket.
  - Tính lại toàn bộ bằng `calculate_contribution_points()`: (tổng `score` các bình luận không ẩn + tổng `score` các blog hiển thị, không thuộc tổ chức) × `VNOJ_CP_COMMENT` + số ticket tốt × `VNOJ_CP_TICKET`.
  - Tính lại toàn bộ chạy khi: moderator ẩn một bình luận trên trang (`comment_hide`), admin dùng action ẩn/hiện bình luận, admin dùng action "Recalulate contribution points" trên hồ sơ.
  - Ngưỡng dùng điểm này: người có điểm dưới `VNOJ_COMMENT_MIN_CONTRIBUTION = -20` không được bình luận (trừ staff). Xem 06.
- **Ai dùng được:** Tự động. Đánh dấu ticket: người xử lý ticket (xem 06).
- **Mã nguồn:** `judge/models/profile.py:257`, `judge/models/profile.py:421-449`, `judge/models/comment.py:49-52`, `judge/models/interface.py:100-108`, `judge/views/ticket.py:233-239`, `judge/views/comment.py:185-196`, `judge/admin/profile.py:138-146`, `dmoj/settings.py:67-70`

### XH-07. Điểm của tổ chức (organization PP)
- **Làm gì:** Xếp hạng tổ chức theo sức mạnh của các thành viên.
- **Cách VNOJ làm:**
  - Lấy `performance_points` của các thành viên (chỉ người có điểm > 0), xếp giảm dần.
  - Thành viên thứ `i` (đếm từ 0) nhân trọng số `VNOJ_ORG_PP_STEP^i`, mặc định `0.95`. Chỉ tính `VNOJ_ORG_PP_ENTRIES = 100` người đầu. Nhân cả tổng với `VNOJ_ORG_PP_SCALE = 1`.
  - Ví dụ: ba thành viên có 60, 45, 30 điểm hiệu suất. Điểm tổ chức = 60 + 45 × 0,95 + 30 × 0,9025 = 129,825, hiển thị 129,83.
  - Tính lại khi điểm của một thành viên thay đổi, khi thêm/bớt thành viên (signal `m2m_changed` trên `Profile.organizations`), và qua action admin "recalculate_points".
  - Cùng lúc cập nhật `member_count`.
  - Danh sách tổ chức (`organization_list`) hiện cột "Points" và "Members", sắp theo tên (`Meta.ordering = ['name']`), không sắp theo điểm.
  - Bảng thành viên trong tổ chức mặc định sắp theo `-performance_points`. Phần còn lại của tổ chức: xem 07.
- **Ai dùng được:** Mọi người xem.
- **Mã nguồn:** `judge/models/profile.py:72-100`, `judge/models/profile.py:186-187`, `judge/signals.py:192-201`, `judge/admin/organization.py:98-101`, `judge/views/organization.py:223-226`, `templates/organization/list.html:25-45`, `dmoj/settings.py:53-55`

### XH-08. Bảng xếp hạng người dùng (`user_list`)
- **Làm gì:** Trang "Leaderboard" liệt kê mọi người dùng theo thứ hạng.
- **Cách VNOJ làm:**
  - Đường dẫn `/users/`. Ba tab trên đầu: "Leaderboard", "Contributors", "Organizations".
  - Cột: Rank, Rating (vòng tròn màu), Username (kèm huy hiệu hiển thị, tên thật `first_name` ở dòng dưới, các tổ chức không ẩn ở bên phải), Points (`performance_points`, 2 chữ số), Problems count (`problem_count`).
  - Khóa sắp xếp hợp lệ qua `?order=`: `rating`, `performance_points`, `problem_count`, `points`. Đều giảm dần khi bấm lần đầu. Mặc định `-rating`. Khi trùng, sắp theo `id` cùng chiều.
  - Người không có rating bị xếp cuối khi sắp theo rating (theo cách MySQL xếp NULL).
  - Số hạng hiển thị luôn tính theo cặp (`performance_points`, `problem_count`): hai dòng liền nhau có cùng cặp thì cùng hạng, dù đang sắp theo khóa nào.
  - Phân trang 100 người mỗi trang. Dùng "infinite pagination": không đếm tổng số dòng, chỉ hiện thêm 2 trang lân cận (1 trang khi `VNOJ_LOW_POWER_MODE`).
  - URL cũ `/users/<số trang>` được chuyển hướng vĩnh viễn sang `/users/?page=<số trang>`.
  - Người có `is_unlisted=True` không xuất hiện. Khi bị ban (`ban_user`), người dùng tự động thành `is_unlisted=True` và `display_rank='banned'`; gỡ ban thì trả lại.
- **Ai dùng được:** Mọi người, kể cả khách. Cờ `is_unlisted` do admin đặt.
- **Mã nguồn:** `judge/views/user.py:580-612`, `dmoj/urls.py:184-189`, `templates/user/base-users-table.html`, `templates/user/users-table.html`, `templates/user/user-list-tabs.html`, `judge/utils/ranker.py:4-14`, `judge/utils/infinite_paginator.py:143-175`, `judge/models/profile.py:274`, `judge/models/profile.py:503-517`, trang `user_list`

### XH-09. Ô tìm và nhảy tới vị trí của một người (`user_ranking_redirect`)
- **Làm gì:** Gõ tên người dùng, trang chuyển tới đúng trang của bảng xếp hạng và tô sáng dòng đó.
- **Cách VNOJ làm:**
  - Ô tìm dùng Select2, gợi ý qua `user_search_select2_ajax` (tối thiểu 1 ký tự, chờ 300 ms, kèm ảnh đại diện). Chọn xong là gửi form.
  - `/users/find?handle=<tên>` đếm số người đứng trên theo rating (người không có rating đứng sau mọi người có rating), cộng số người cùng rating có `id` lớn hơn. Từ đó suy ra số trang (chia cho 100).
  - Chuyển hướng tới `/users/?page=N#!<tên>`. JavaScript đọc phần `#!` để tô sáng và cuộn tới dòng.
  - Phép tính luôn dựa trên thứ tự mặc định theo rating, không theo khóa sắp xếp đang chọn.
  - Ô tìm chỉ hiện khi bảng có nhiều hơn một trang.
  - Không tìm thấy tên thì trả 404.
- **Ai dùng được:** Mọi người.
- **Mã nguồn:** `judge/views/user.py:661-676`, `templates/user/base-users.html:1-63`, `judge/views/select2.py:185-190`, trang `user_ranking_redirect`

### XH-10. Bảng người đóng góp (`contributors_list`)
- **Làm gì:** Trang "Contributors" xếp người dùng theo điểm đóng góp.
- **Cách VNOJ làm:**
  - Đường dẫn `/contributors/`. Cột: Rank, Username (kèm huy hiệu, tên thật, tổ chức), Contribution points.
  - Chỉ một khóa sắp xếp: `contribution_points`, mặc định giảm dần. 100 người mỗi trang, infinite pagination.
  - Hạng tính theo `contribution_points`: bằng điểm thì cùng hạng.
  - Có ô tìm riêng, gửi tới `user_contributor_redirect` (`/contributors/find?handle=`). Cách tính trang giống XH-09 nhưng theo `contribution_points`. Gợi ý Select2 ở trang này có thêm nút mũi tên để mở thẳng trang cá nhân.
  - Ẩn người `is_unlisted`.
- **Ai dùng được:** Mọi người.
- **Mã nguồn:** `judge/views/user.py:615-647`, `judge/views/user.py:679-691`, `dmoj/urls.py:275-280`, `templates/user/contrib-list.html`, `templates/user/contrib-table.html`, trang `contributors_list`, `user_contributor_redirect`

### XH-11. Huy hiệu (badge) và huy hiệu hiển thị
- **Làm gì:** Gắn giải thưởng, danh hiệu dạng ảnh cho người dùng.
- **Cách VNOJ làm:**
  - Model `Badge` có 3 trường: `name` (tối đa 128 ký tự), `mini` (URL ảnh nhỏ), `full_size` (URL ảnh lớn). Ảnh là URL ngoài, không tải lên.
  - `Profile.badges`: nhiều huy hiệu cho một người. `Profile.display_badge`: một huy hiệu được chọn để hiện cạnh tên.
  - Huy hiệu hiển thị (ảnh `mini`, cao 1em) hiện ngay sau tên ở mọi nơi dùng `link_user`, nhưng chỉ khi trang đã nạp sẵn `display_badge` (bảng xếp hạng, bình luận, blog, trang chủ, ticket).
  - Trang giới thiệu cá nhân có mục "Badges & Awards": hiện mọi huy hiệu bằng ảnh `full_size` (hoặc `mini` nếu thiếu), cao 10em, kèm tên. Không có thì ghi "This user has not earned any badges or awards."
  - Người dùng tự chọn `display_badge` trong trang sửa hồ sơ, chỉ trong số huy hiệu mình có. Ô này ẩn nếu chưa có huy hiệu nào, và ẩn trong chế độ kỳ thi chính thức.
  - Không có cách tự động trao huy hiệu. Admin gán bằng tay trong trang hồ sơ (xem 08).
- **Ai dùng được:** Admin tạo và gán. Người dùng chọn huy hiệu hiển thị.
- **Mã nguồn:** `judge/models/profile.py:239-245`, `judge/models/profile.py:266-267`, `judge/jinja2/reference.py:146-165`, `templates/user/user-about.html:48-56`, `judge/forms.py:59-109`, `judge/admin/profile.py:15-34`, `judge/admin/__init__.py:35`

### XH-12. Top người dùng và top đóng góp trên trang chủ
- **Làm gì:** Hai khối ở cột phải trang chủ.
- **Cách VNOJ làm:**
  - "Top users": `VNOJ_HOMEPAGE_TOP_USERS_COUNT = 5` người có rating cao nhất, chỉ người có rating và không ẩn. Cột: #, Username, Rating (tô màu theo bậc rating). Chân khối có link "Organizations" và "View all" tới `user_list`.
  - "Top contributors": 5 người có `contribution_points` cao nhất, chỉ người có điểm > 0 và không ẩn. Cột: #, Username, Contrib. Chân khối có link "View all" tới `contributors_list`.
  - Cả hai khối dùng chung số lượng `VNOJ_HOMEPAGE_TOP_USERS_COUNT`.
- **Ai dùng được:** Mọi người.
- **Mã nguồn:** `judge/views/blog.py:252-253`, `judge/views/blog.py:276-289`, `templates/blog/top-rating.html`, `templates/blog/top-contrib.html`, `dmoj/settings.py:99`, trang `home`

### XH-13. Trường `vnoj_points`
- **Làm gì:** Một trường số nguyên trên hồ sơ, mặc định 0.
- **Cách VNOJ làm:**
  - Chỉ xuất hiện trong form sửa hồ sơ ở admin.
  - Không có template, view, hay hàm tính nào đọc hoặc ghi trường này. Không hiển thị cho người dùng.
- **Ai dùng được:** Admin (sửa tay).
- **Mã nguồn:** `judge/models/profile.py:258`, `judge/admin/profile.py:62`

### XH-14. Trang thống kê hệ thống (`status_oj`, `stats_data_all`)
- **Làm gì:** Biểu đồ hoạt động chấm bài của toàn site trong một khoảng ngày.
- **Cách VNOJ làm:**
  - Trang `status_oj` (`/status/oj/`) có bộ chọn khoảng ngày (daterangepicker). Trang gửi POST tới `stats_data_all` (`/stats/data/all/`) với `start_date`, `end_date` (UTC) và `utc_offset` (phút).
  - Dữ liệu trả về gồm 5 biểu đồ:
    - `by_day`: cột chồng số bài nộp mỗi ngày theo kết quả `AC`, `PAC`, `WA`, `TLE`, `CE`, `ERR` (kết quả khác dồn vào `ERR`). Màu lấy từ `DMOJ_STATS_SUBMISSION_RESULT_COLORS`.
    - `by_language`: biểu đồ tròn số bài nộp theo ngôn ngữ.
    - `result`: biểu đồ tròn theo kết quả.
    - `queue_time`: cột số bài nộp theo thời gian chờ chấm, chia nhóm 0–1s, 1–2s, 2–5s, 5–10s, 10–30s, 30s–1min, 1–2min, 2–5min, 5–10min, > 10min. Chỉ tính bài đã chấm và chưa chấm lại.
    - `org_by_day`: cột chồng bài nộp mỗi ngày vào bài hoặc kỳ thi riêng của tổ chức, kèm đường số bài mới của tổ chức mỗi ngày.
  - Không có trang thống kê ngôn ngữ công khai. Setting `DMOJ_STATS_LANGUAGE_THRESHOLD = 10` vẫn còn nhưng không nơi nào dùng.
  - Thống kê riêng của kỳ thi (`contest_stats`) và của tổ chức thuộc file khác (xem 04, xem 07).
- **Ai dùng được:** Chỉ superuser. Người khác nhận 403 (dữ liệu) hoặc thông báo lỗi (trang).
- **Mã nguồn:** `judge/views/stats.py:1-161`, `judge/views/status.py:31-37`, `templates/status/oj-status.html`, `dmoj/settings.py:289-297`, `dmoj/urls.py:344`, `dmoj/urls.py:409`, trang `status_oj`, `stats_data_all`
