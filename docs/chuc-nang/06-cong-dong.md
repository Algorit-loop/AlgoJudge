# 06. Cộng đồng và nội dung

Nguồn: `VNOI-Admin/OJ` commit `209a32e` (04/11/2026), thư mục `reference/vnoj-src/site/`. Phần này gồm trang chủ, blog, bình luận, ticket, thông báo, trình soạn Markdown và các trang nội dung phụ. Mã chính nằm ở `judge/views/blog.py`, `judge/comments.py`, `judge/views/comment.py`, `judge/views/ticket.py`, `judge/views/notification.py`, các model trong `judge/models/interface.py`, `comment.py`, `ticket.py`, `notification.py`, và thư mục `martor/`.

Tổ chức (organization): xem 07. Trang admin Django: xem 08. Điểm đóng góp: xem 05.

## Bảng quyết định

| Mã | Chức năng | Quyết định | Ghi chú |
|---|---|---|---|
| CD-01 | Trang chủ: bố cục và các khối | | |
| CD-02 | Nội dung cấu hình hiện trên mọi trang (`misc_config`, thanh menu) | | |
| CD-03 | Bài blog: các trường và quy tắc hiển thị | | |
| CD-04 | Viết blog: ai được viết, form tạo | | |
| CD-05 | Sửa, xóa blog và lịch sử phiên bản | | |
| CD-06 | Blog của tổ chức | | |
| CD-07 | Bỏ phiếu blog | | |
| CD-08 | Danh sách blog cổ điển: Newsfeed, Blogs, trang blog của người dùng | | |
| CD-09 | Giao diện blog hiện đại (`blog_modern_list`, `blog_post_modern`) | | |
| CD-10 | Tạp chí (magazine) | | |
| CD-11 | Bình luận: nơi gắn, cây trả lời, phân trang | | |
| CD-12 | Điều kiện được bình luận và chống spam | | |
| CD-13 | Bỏ phiếu bình luận và tự ẩn bình luận bị chê | | |
| CD-14 | Sửa bình luận và lịch sử chỉnh sửa | | |
| CD-15 | Kiểm duyệt bình luận: ẩn, xem phiếu, ẩn hàng loạt, cấm nói (mute) | | |
| CD-16 | Khóa bình luận | | |
| CD-17 | Ticket cho bài tập (hỏi đáp, báo lỗi đề) | | |
| CD-18 | Ticket báo lỗi chung ("Report an issue") | | |
| CD-19 | Trang ticket: tin nhắn, mở/đóng, ghi chú, câu trả lời mẫu | | |
| CD-20 | Đánh dấu ticket tốt (good/norm) | | |
| CD-21 | Danh sách ticket và bộ lọc | | |
| CD-22 | Thông báo trong site (notification) | | |
| CD-23 | Nhắc tên người dùng trong Markdown (`[user:...]`) | | |
| CD-24 | Trình soạn Markdown martor và tải ảnh | | |
| CD-25 | Các endpoint xem trước Markdown | | |
| CD-26 | Trang tĩnh (flatpages) | | |
| CD-27 | Bản tin email (newsletter) | | |
| CD-28 | RSS/Atom feed | | |
| CD-29 | Sitemap | | |
| CD-30 | Đẩy sự kiện cộng đồng sang Discord (webhook) | | |

## Chi tiết

### CD-01. Trang chủ: bố cục và các khối
- **Làm gì:** Trang `/` gom tin tức, kỳ thi, bình luận mới và bài mới vào một chỗ.
- **Cách VNOJ làm:**
  - Trang chủ chính là danh sách blog `PostList` với template `home.html`, luôn mở trang 1.
  - Trên cùng: khối HTML `misc_config.home_page_top` nếu có (xem CD-02). Khối này nhận các biến `user_count`, `problem_count`, `submission_count`, `language_count` để admin chèn số liệu.
  - Cột trái: danh sách bài blog, 10 bài mỗi trang, hai tab "Newsfeed" và "Blogs" (xem CD-08).
  - Cột phải, theo thứ tự:
    - "Your open tickets": ticket đang mở của chính người xem (chỉ khi đăng nhập).
    - "Open tickets": 10 ticket mở mới nhất mà người xem được thấy (chỉ staff).
    - "Ongoing contests" và "Upcoming contests": kỳ thi đang diễn ra và sắp diễn ra mà người xem được thấy, có `is_visible=True`, sắp theo giờ bắt đầu.
    - "Top users" và "Top contributors": 5 người mỗi khối (xem 05, XH-12).
    - "Comment stream": 10 bình luận mới nhất mà người xem được phép thấy. Mỗi dòng là "tên người → tên trang". Có link RSS/Atom. Nếu có `discord_invite_link` và `discord_invite_shieldio` thì hiện huy hiệu mời vào Discord.
    - "New problems": `DMOJ_BLOG_NEW_PROBLEM_COUNT = 7` bài công khai mới nhất. Có link RSS/Atom.
  - Trên điện thoại có hai tab "Blog" và "Events" để chuyển giữa cột trái và cột phải.
  - Thẻ `<head>` có link khám phá 6 feed RSS/Atom, mô tả `misc_config.meta_description`, và JSON-LD `SearchAction` trỏ tới `/problems/?search=`.
- **Ai dùng được:** Mọi người. Khối ticket chỉ cho người đăng nhập/staff.
- **Mã nguồn:** `dmoj/urls.py:103`, `judge/views/blog.py:200-289`, `judge/models/comment.py:54-110`, `templates/home.html`, `templates/blog/list.html:1-214`, `dmoj/settings.py:258`, trang `home`

### CD-02. Nội dung cấu hình hiện trên mọi trang (`misc_config`, thanh menu)
- **Làm gì:** Cho admin đổi nội dung chung của site mà không sửa mã.
- **Cách VNOJ làm:**
  - `MiscConfig` là bảng khóa–giá trị (`key` tối đa 30 ký tự, `value` văn bản). Kết quả được cache 1 ngày dưới khóa `misc_config` và xóa cache khi sửa.
  - Tra khóa theo thứ tự: `<domain>:<key>.<ngôn ngữ>`, `<domain>:<key>`, `<key>.<ngôn ngữ>`, `<key>`. Nhờ vậy có thể đặt nội dung riêng theo ngôn ngữ và theo tên miền.
  - Các khóa được template dùng:
    - `site_logo`, `site_favicon`: logo góc trái và favicon.
    - `meta_keywords`, `meta_description`: thẻ meta SEO.
    - `analytics`: HTML/JS chèn nguyên văn vào mọi trang.
    - `top_notification`: dải thông báo đầu nội dung mọi trang, chạy được cú pháp template Django.
    - `announcement`: khối HTML thông báo sau nội dung chính.
    - `footer`: HTML thêm vào chân trang.
    - `home_page_top`: khối đầu trang chủ, chạy được cú pháp template Django.
    - `discord_invite_link`, `discord_invite_shieldio`: huy hiệu Discord ở trang chủ, trang đăng nhập, đăng ký, email.
  - Trang `misc_config` (`/misc_config/`) là form sửa các khóa trên và tải logo/favicon. Link "Site settings" hiện trên thanh trên cho superuser. Chi tiết form: xem 08.
  - Thanh menu chính lấy từ model `NavigationBar` (cây nhiều cấp): mỗi mục có `order`, `key` (≤10 ký tự), `label` (≤20 ký tự), `path`, và `regex` để tô sáng mục đang mở. Cache 1 ngày. Quản lý trong admin (xem 08).
  - Thanh trên còn có link "Report an issue" (xem CD-18) và chuông thông báo (xem CD-22).
- **Ai dùng được:** Superuser sửa. Mọi người xem.
- **Mã nguồn:** `judge/models/interface.py:18-64`, `judge/middleware.py:189-229`, `judge/views/misc_config.py:12-140`, `judge/signals.py:166-173`, `templates/base.html:6-7`, `templates/base.html:194-195`, `templates/base.html:240-256`, `templates/base.html:275-296`, `templates/base.html:398-424`, `templates/base.html:428-447`, trang `misc_config`

### CD-03. Bài blog: các trường và quy tắc hiển thị
- **Làm gì:** Bài viết dài dạng tin tức, hướng dẫn, thông báo.
- **Cách VNOJ làm:**
  - Trường của `BlogPost`:
    - `title` (tối đa 100 ký tự), `slug`, `authors` (nhiều tác giả).
    - `visible`: công khai hay không, mặc định `False`.
    - `sticky`: ghim lên đầu, mặc định `False`.
    - `publish_on`: thời điểm đăng. Trước thời điểm này bài chưa hiện với người khác.
    - `content`: nội dung Markdown.
    - `summary`: tóm tắt Markdown. Nếu có, danh sách chỉ hiện tóm tắt kèm link "Continue reading...". Nếu không, hiện cả nội dung.
    - `og_image`: ảnh OpenGraph (tối đa 150 ký tự) để chia sẻ mạng xã hội. Nếu trống, lấy ảnh đầu tiên trong bài. Chỉ sửa được trong admin.
    - `score`: tổng phiếu bầu.
    - `global_post`: hiện ở trang chủ (tab Newsfeed).
    - `organization`: bài thuộc tổ chức nào (xem CD-06).
    - `tags`: nhãn `BlogPostTag` (`name` ≤40 ký tự, `slug` ≤50 ký tự), dùng cho giao diện hiện đại và tạp chí.
  - Quy tắc xem (`can_see`): bài `visible` và đã tới `publish_on` thì ai cũng xem được, trừ bài tổ chức chỉ cho thành viên tổ chức hoặc người sửa được. Bài chưa công khai chỉ người sửa được mới xem.
  - Bài chưa công khai hiện ổ khóa đỏ trước tiêu đề.
  - Trang bài `blog_post` (`/post/<id>-<slug>`) gồm: tiêu đề, tác giả, thời gian, tên tổ chức nếu có, link "Edit" cho người sửa được, nội dung, nút chia sẻ Facebook và Twitter, phiếu bầu, và khu bình luận (trang bình luận `b:<id>`).
  - Mô tả meta lấy đoạn văn đầu tiên của `summary` hoặc `content`, cắt 60 từ, cache 1 ngày.
  - Nội dung blog render với kiểu Markdown `blog`: cho phép HTML thô đã lọc và thuộc tính style. Hỗ trợ công thức toán. Bản render cache 1 ngày, xóa khi lưu bài.
- **Ai dùng được:** Xem: như quy tắc trên.
- **Mã nguồn:** `judge/models/interface.py:67-150`, `judge/views/blog.py:292-327`, `judge/utils/opengraph.py:8-24`, `templates/blog/content.html`, `templates/blog/blog-post.html`, `judge/signals.py:125-133`, `dmoj/settings.py:627-680`, trang `blog_post`

### CD-04. Viết blog: ai được viết, form tạo
- **Làm gì:** Người dùng tự đăng bài blog cá nhân từ site.
- **Cách VNOJ làm:**
  - Trang `blog_post_new` (`/posts/new`). Cần đăng nhập.
  - Người dùng thường phải giải ít nhất `VNOJ_BLOG_MIN_PROBLEM_COUNT = 10` bài (`problem_count`). Superuser được miễn. Thiếu thì hiện "You cannot create blog post. Note: You need to solve at least 10 problems to create new blog post."
  - Khi bật chế độ kỳ thi chính thức (`VNOJ_OFFICIAL_CONTEST_MODE`), không ai tạo được blog.
  - Form có các ô: `title`, `publish_on`, `visible`, `content` (luôn có); `global_post` (cần quyền `judge.mark_global_post`); `sticky` (cần `judge.pin_post`); `tags`, `authors`, `summary` (cần `judge.manage_magazine_post`).
  - Nếu không chọn tác giả, người tạo là tác giả.
  - Khi tạo, `slug` bị đặt bằng tên đăng nhập viết thường bỏ dấu, và `publish_on` bị đặt bằng thời điểm hiện tại (ghi đè giá trị trong form).
  - Đầu form có cảnh báo đọc hướng dẫn tại `/about/blog/`.
  - Sau khi tạo, gọi webhook Discord `on_new_blogpost` (xem CD-30) và chuyển tới trang bài.
  - Người dùng thường tạo bài với `global_post=False`, nên bài chỉ hiện ở tab "Blogs", không lên Newsfeed.
- **Ai dùng được:** Người đăng nhập có ≥10 bài giải, hoặc superuser.
- **Mã nguồn:** `judge/views/blog.py:351-398`, `judge/forms.py:776-809`, `templates/blog/edit.html:33-57`, `dmoj/settings.py:129`, trang `blog_post_new`

### CD-05. Sửa, xóa blog và lịch sử phiên bản
- **Làm gì:** Cho tác giả và người có quyền chỉnh bài đã đăng.
- **Cách VNOJ làm:**
  - Quyền sửa (`is_editable_by`): người có `judge.edit_all_post`; hoặc là một trong các tác giả. Với bài tổ chức, tác giả còn phải là admin tổ chức và có `judge.edit_organization_post`.
  - Trang `blog_post_edit` dùng cùng form với trang tạo. Trong chế độ kỳ thi chính thức chỉ superuser sửa được.
  - Staff thấy thêm link "Edit blog post in admin panel for more options".
  - Mỗi lần tạo/sửa trên site lưu một phiên bản (django-reversion) với ghi chú "Created on site" hoặc "Edited from site". Xem lại phiên bản qua admin (xem 08).
  - Xóa: `blog_post_delete`, chỉ nhận POST, cần quyền `judge.delete_blogpost` và quyền sửa bài. Có hộp xác nhận. Xóa xong về `/`.
- **Ai dùng được:** Tác giả, người có `edit_all_post`; xóa cần `delete_blogpost`.
- **Mã nguồn:** `judge/models/interface.py:130-139`, `judge/views/blog.py:95-104`, `judge/views/blog.py:401-450`, `templates/blog/edit.html:14-57`, trang `blog_post_edit`, `blog_post_delete`

### CD-06. Blog của tổ chức
- **Làm gì:** Bài blog chỉ dành cho thành viên một tổ chức.
- **Cách VNOJ làm:**
  - Tạo qua `blog_post_create_organization` (`/organization/<slug>/post/new`). Cần là admin tổ chức và có quyền `judge.edit_organization_post`. Không áp ngưỡng 10 bài.
  - `slug` lấy từ slug tổ chức (chỉ giữ chữ và số). `publish_on` mặc định là lúc mở form.
  - Bài tổ chức không hiện ở trang chủ, tab Blogs, hay trang blog cá nhân. Phiếu bầu bài tổ chức không cộng điểm đóng góp.
  - Feed blog và sitemap không lọc theo tổ chức: bài tổ chức đã `visible` vẫn xuất hiện ở đó (xem CD-28, CD-29).
  - Phần còn lại (danh sách bài trong trang tổ chức): xem 07.
- **Ai dùng được:** Admin tổ chức có `edit_organization_post`.
- **Mã nguồn:** `judge/views/organization.py:1001-1021`, `judge/models/interface.py:104-122`, `judge/views/blog.py:208`, `dmoj/urls.py:334-336`

### CD-07. Bỏ phiếu blog
- **Làm gì:** Cho người đọc chấm bài blog lên hoặc xuống.
- **Cách VNOJ làm:**
  - Hai endpoint POST `blog_upvote` và `blog_downvote` (`/posts/upvote`, `/posts/downvote`), tham số `id`.
  - Mỗi người chỉ bỏ một phiếu (+1 hoặc −1) cho mỗi bài (`BlogVote` có ràng buộc duy nhất `voter`+`blog`). Không có endpoint rút hay đổi phiếu. Phiếu thứ hai bị từ chối với "You cannot vote twice."
  - Bị chặn khi: chưa giải đủ `VNOJ_INTERACT_MIN_PROBLEM_COUNT = 5` bài (staff được miễn), đang bị mute, hoặc là tác giả bài.
  - Phiếu cộng vào `BlogPost.score`. Nếu bài `visible` và không thuộc tổ chức, mỗi tác giả được cộng/trừ `VNOJ_CP_COMMENT` điểm đóng góp (xem 05).
  - Khách thấy nút nhưng bấm sẽ nhận "Please log in to vote".
- **Ai dùng được:** Người đăng nhập đủ điều kiện.
- **Mã nguồn:** `judge/views/blog.py:32-92`, `judge/models/interface.py:100-108`, `judge/models/interface.py:153-161`, `templates/blog/blog-post.html:4-21`, trang `blog_upvote`, `blog_downvote`

### CD-08. Danh sách blog cổ điển: Newsfeed, Blogs, trang blog của người dùng
- **Làm gì:** Liệt kê bài blog theo nhiều góc nhìn.
- **Cách VNOJ làm:**
  - Trang chủ và `blog_post_list` (`/posts/`, `/posts/<trang>`) dùng chung `PostList`, 10 bài mỗi trang.
  - Tab "Newsfeed" (mặc định): chỉ bài `global_post=True`, không thuộc tổ chức, sắp theo `sticky` rồi `publish_on` giảm dần.
  - Tab "Blogs": mọi bài không thuộc tổ chức (cả bài cá nhân), sắp theo `publish_on` giảm dần, không ưu tiên ghim. Lựa chọn tab lưu vào session qua `?show_all_blogs=true|false`.
  - Ở tab Blogs, nếu đặt `GOOGLE_SEARCH_ENGINE_URL` thì có ô "Search blog" dùng Google Custom Search. Mặc định `None`.
  - Nếu đặt `VNOJ_MAGAZINE_TAG_SLUG`, bài mang nhãn đó bị loại khỏi các danh sách này.
  - Mỗi thẻ bài: phiếu bầu, tiêu đề, tác giả, thời gian, nội dung/tóm tắt (cache 1 ngày), số bình luận.
  - Trang `user_blog` (`/user/<tên>/blog/`): bài không thuộc tổ chức của người đó. Chính chủ và superuser thấy cả bài ẩn/chưa đăng.
- **Ai dùng được:** Mọi người.
- **Mã nguồn:** `judge/views/blog.py:107-144`, `judge/views/blog.py:200-233`, `judge/views/user.py:267-282`, `templates/blog/blog-list-tabs.html`, `templates/blog/blog-post.html`, `dmoj/settings.py:821`, trang `blog_post_list`, `user_blog`

### CD-09. Giao diện blog hiện đại (`blog_modern_list`, `blog_post_modern`)
- **Làm gì:** Một giao diện blog dạng tạp chí, song song với giao diện cổ điển.
- **Cách VNOJ làm:**
  - Danh sách `blog_modern_list` (`/blogs/`): chỉ bài `global_post=True`.
  - Tìm kiếm `?q=` trên `title`, `content`, `summary` (không phân biệt hoa thường).
  - Lọc nhãn `?tag=<slug>`. Nếu không có `tag` mà có `VNOJ_MAGAZINE_TAG_SLUG` thì dùng nhãn tạp chí. Mã luôn lọc theo nhãn, nên khi không có nhãn nào được chọn và không đặt `VNOJ_MAGAZINE_TAG_SLUG`, danh sách lọc theo slug rỗng (thực tế có thể trống — chưa kiểm tra khi chạy).
  - Sắp xếp `?sort=latest` (ghim trước, mới trước) hoặc `?sort=top` (điểm cao trước).
  - Hai kiểu hiển thị `?view=grid` (mặc định) hoặc `list`. Chuyển trang bằng thanh phân trang thường, 10 bài mỗi trang. Template có thuộc tính `data-next-page` và khung skeleton nhưng không tìm thấy JavaScript tải tiếp khi cuộn.
  - Nếu bài đầu tiên là bài ghim và không có từ khóa tìm, bài đó bị bỏ qua khi vẽ (ghi chú `skip hero` trong template, không có khối hero nào khác).
  - Thẻ bài có huy hiệu ghim, nháp, toàn cục; ngày; tóm tắt 50 từ; tác giả; nhãn; nút bỏ phiếu.
  - Thanh trên có "My Posts" và "Write" (cần `judge.manage_magazine_post`) và "Manage" tới admin (staff).
  - Trang bài `blog_post_modern` (`/post/<id>-<slug>/modern`): thanh tiến độ đọc, mục lục bên cạnh, nút chia sẻ, tên tổ chức, bình luận.
- **Ai dùng được:** Mọi người xem. Nút viết cần `manage_magazine_post`.
- **Mã nguồn:** `judge/views/blog.py:147-197`, `judge/views/blog.py:330-331`, `templates/blog/modern-list.html`, `templates/blog/modern-content.html`, trang `blog_modern_list`, `blog_post_modern`

### CD-10. Tạp chí (magazine)
- **Làm gì:** Trang giới thiệu ấn phẩm tạp chí của VNOI.
- **Cách VNOJ làm:**
  - Trang `magazine` (`/magazine/`) có tiêu đề cố định "VNOI Magazine 2025". Nội dung chỉ là một iframe nhúng sách lật từ `heyzine.com`, cao 800px.
  - Bài tạp chí trong blog được đánh dấu bằng một nhãn có slug là `VNOJ_MAGAZINE_TAG_SLUG` (mặc định `None`). Bài mang nhãn này bị ẩn khỏi danh sách cổ điển và là mặc định của giao diện hiện đại (CD-09).
  - Quyền `judge.manage_magazine_post` mở các ô `tags`, `authors`, `summary` trong form blog.
- **Ai dùng được:** Mọi người xem.
- **Mã nguồn:** `judge/views/magazine.py:6-8`, `templates/magazine.html`, `judge/views/blog.py:118-121`, `dmoj/settings.py:188`, `dmoj/urls.py:456`, trang `magazine`

### CD-11. Bình luận: nơi gắn, cây trả lời, phân trang
- **Làm gì:** Cho người dùng thảo luận dưới bài tập, lời giải, kỳ thi, blog.
- **Cách VNOJ làm:**
  - Mỗi bình luận gắn với một "trang" qua chuỗi `page`: `p:<mã bài>` (bài tập), `s:<mã bài>` (lời giải/editorial), `c:<mã kỳ thi>` (kỳ thi), `b:<id blog>` (blog). Chuỗi phải khớp `^\w+:[a-z0-9A-Z_]+$`, tối đa 34 ký tự.
  - Các trang có bình luận: `problem_comments`, `problem_editorial_comments`, `contest_comments`, `blog_post_comments`. Đây là các đoạn HTML được tải lười bằng AJAX khi trang chính mở (blog, kỳ thi) hoặc khi bấm tab bình luận (bài tập).
  - Quyền xem bình luận theo quyền xem trang gốc. Endpoint editorial kiểm tra lại quyền xem lời giải.
  - Cây trả lời nhiều cấp, không giới hạn độ sâu (dùng MPTT). Trong cùng cấp, bình luận mới đứng trước.
  - Phân trang theo cây: 20 bình luận gốc mỗi trang (kèm toàn bộ trả lời), gộp trang cuối nếu ít hơn 5.
  - Chỉ trả lời được bình luận trong vòng `DMOJ_COMMENT_REPLY_TIMEFRAME = 365` ngày. Người có `judge.change_comment` không bị giới hạn.
  - Thân bình luận tối đa 8192 ký tự ở mức DB. Render Markdown kiểu `comment`: không cho HTML thô, có công thức toán, có nhắc tên (CD-23).
  - Mỗi bình luận hiện: phiếu, ảnh đại diện, tên, thời gian, số lần sửa, link cố định `#comment-<id>`, nút trả lời và sửa.
  - Trang tổng hợp dùng `Comment.get_newest_visible_comments`: duyệt theo lô, lọc bình luận người xem không được thấy.
  - Đầu khu bình luận có cảnh báo đọc hướng dẫn tại `/about/comment/`.
  - Bình luận ở bài tập: khi bấm gửi, nếu nội dung giống mã nguồn (`input(`, `#include`, `void main`, `fn main`, `func main`) thì hỏi xác nhận lại.
  - Endpoint `comment_content` (`/comments/<id>/render`) trả về phần nội dung đã render của một bình luận.
- **Ai dùng được:** Xem: ai xem được trang gốc. Viết: xem CD-12.
- **Mã nguồn:** `judge/models/comment.py:23-174`, `judge/comments.py:86-202`, `judge/views/problem.py:151-216`, `judge/views/contests.py:376-389`, `judge/views/blog.py:334-348`, `templates/comments/list.html`, `templates/comments/base-media-js.html:97-106`, `dmoj/settings.py:280-281`, `dmoj/urls.py:123-127`, `dmoj/urls.py:213-222`, `dmoj/urls.py:235`, `dmoj/urls.py:354`

### CD-12. Điều kiện được bình luận và chống spam
- **Làm gì:** Lọc người và nội dung trước khi lưu bình luận.
- **Cách VNOJ làm:**
  - Phải đăng nhập.
  - Bị mute: từ chối với "Your part is silent, little toad." kèm lý do `ban_reason` nếu có.
  - Chưa giải đủ `VNOJ_INTERACT_MIN_PROBLEM_COUNT = 5` bài: không hiện form, thay bằng thông báo. Staff được miễn.
  - Các kiểm tra sau bỏ qua cho staff:
    - Điểm đóng góp dưới `VNOJ_COMMENT_MIN_CONTRIBUTION = -20`: bị chặn.
    - Độ dài: tối thiểu `VNOJ_COMMENT_MIN_LENGTH = 10`, tối đa `VNOJ_COMMENT_MAX_LENGTH = 8196` ký tự.
    - Từ cấm: nếu nội dung chứa bất kỳ cụm nào trong `VNOJ_COMMENT_BLACKLIST_TERMS` (so không phân biệt hoa thường) thì bị chặn. Mặc định danh sách rỗng.
    - Giới hạn tốc độ: nếu `VNOJ_COMMENT_RATE_LIMIT_COUNT` khác `None`, người dùng không được đăng quá số đó trong `VNOJ_COMMENT_RATE_LIMIT_WINDOW` (mặc định 600 giây). Mặc định tắt (`None`).
  - Trả lời bình luận bị ẩn hoặc ở trang khác: 404.
  - Lỗi được hiện ngay cạnh bình luận đang trả lời, không chỉ ở form cuối trang.
  - Mỗi bình luận mới lưu một phiên bản reversion ("Posted comment") và gửi webhook `on_new_comment` (CD-30).
- **Ai dùng được:** Người đăng nhập đủ điều kiện.
- **Mã nguồn:** `judge/comments.py:27-83`, `judge/comments.py:108-144`, `judge/models/profile.py:355-361`, `judge/signals.py:117-122`, `dmoj/settings.py:126-137`

### CD-13. Bỏ phiếu bình luận và tự ẩn bình luận bị chê
- **Làm gì:** Người đọc chấm điểm bình luận. Bình luận bị chê nhiều sẽ bị thu gọn.
- **Cách VNOJ làm:**
  - Endpoint POST `comment_upvote`, `comment_downvote` (`/comments/upvote`, `/comments/downvote`), tham số `id`.
  - Điều kiện giống bỏ phiếu blog: đủ 5 bài giải (staff miễn), không bị mute, không tự bầu cho mình, bình luận chưa bị ẩn.
  - Mỗi người một phiếu cho mỗi bình luận (`CommentVote` duy nhất theo `voter`+`comment`). Không rút, không đổi được phiếu.
  - Phiếu cộng vào `Comment.score` và cộng/trừ `VNOJ_CP_COMMENT` điểm đóng góp cho tác giả (xem 05).
  - Bình luận có `score <= DMOJ_COMMENT_VOTE_HIDE_THRESHOLD` (mặc định −5) bị thu gọn: hiện "This comment is hidden due to too much negative feedback." với link "Show it anyway."
- **Ai dùng được:** Người đăng nhập đủ điều kiện.
- **Mã nguồn:** `judge/views/comment.py:27-87`, `judge/models/comment.py:49-52`, `judge/models/comment.py:189-197`, `templates/comments/list.html:29-48`, `templates/comments/list.html:118-128`, `dmoj/settings.py:280`, trang `comment_upvote`, `comment_downvote`

### CD-14. Sửa bình luận và lịch sử chỉnh sửa
- **Làm gì:** Cho sửa bình luận đã đăng và xem lại các bản trước.
- **Cách VNOJ làm:**
  - Hai cách sửa: hộp nổi `comment_edit_ajax` hoặc trang riêng `comment_edit` (`/comments/<id>/edit`). Form chỉ có ô `body` với trình soạn martor.
  - Tác giả sửa được nếu không bị mute và bình luận chưa bị ẩn. Người có `judge.change_comment` sửa được mọi bình luận.
  - Không có giới hạn thời gian sửa. Khi sửa chỉ còn giới hạn 8192 ký tự của trường DB. Không kiểm tra lại độ dài tối thiểu, từ cấm, điểm đóng góp hay tốc độ.
  - Mỗi lần sửa tăng `revisions` thêm 1 và lưu một phiên bản reversion ("Edited from site").
  - Bình luận đã sửa hiện nút mũi tên trái/phải và nhãn "edited" hoặc "edit N" để duyệt từng phiên bản. Dữ liệu lấy qua `comment_revision_ajax?revision=<n>`. Bình luận đã ẩn chỉ người có `change_comment` xem được lịch sử.
- **Ai dùng được:** Tác giả; moderator có `change_comment`.
- **Mã nguồn:** `judge/views/comment.py:102-167`, `templates/comments/list.html:70-86`, `templates/comments/list.html:104-112`, trang `comment_edit`, `comment_edit_ajax`, `comment_revision_ajax`

### CD-15. Kiểm duyệt bình luận: ẩn, xem phiếu, ẩn hàng loạt, cấm nói (mute)
- **Làm gì:** Công cụ cho moderator xử lý bình luận xấu.
- **Cách VNOJ làm:**
  - Ẩn: nút thùng rác gọi `comment_hide` (POST, `id`). Ẩn bình luận đó và toàn bộ trả lời bên dưới. Không xóa khỏi DB. Sau đó tính lại toàn bộ điểm đóng góp của tác giả. Có hộp xác nhận (giữ Ctrl/Cmd để bỏ qua).
  - Xem ai đã bầu: nút biểu đồ mở `comment_votes_ajax`, liệt kê từng người và phiếu +1/−1.
  - Moderator cũng có nút trả lời không giới hạn thời gian, nút sửa, và link tới trang admin của bình luận.
  - Trang `user_comment` (`/user/<tên>/comment/`): mọi bình luận của một người, 10 mỗi trang. Cần quyền `judge.view_all_user_comment`. Tab này chỉ hiện với người có quyền đó.
  - Trên trang đó, người có `judge.change_comment` có nút "Delete all comments": ẩn mọi bình luận còn hiện của người đó (cùng trả lời bên dưới).
  - Cấm nói: cờ `Profile.mute` ("comment mute", đặt trong admin). Người bị mute không bình luận, không bỏ phiếu, không sửa bình luận, không mở ticket, không thấy nút "Request clarification".
  - Admin có action ẩn/hiện bình luận hàng loạt (xem 08).
- **Ai dùng được:** Người có `judge.change_comment`, `judge.view_all_user_comment`; admin.
- **Mã nguồn:** `judge/views/comment.py:174-196`, `judge/views/user.py:285-326`, `templates/comments/list.html:89-103`, `templates/user/comment.html:20-27`, `templates/user/user-tabs.html:12-13`, `judge/models/profile.py:272`, `judge/admin/comments.py:40-54`, trang `comment_hide`, `comment_votes_ajax`, `user_comment`

### CD-16. Khóa bình luận
- **Làm gì:** Tắt bình luận trên một trang cụ thể.
- **Cách VNOJ làm:**
  - Model `CommentLock` chỉ có trường `page` (cùng định dạng chuỗi trang). Tạo trong admin.
  - Trang bị khóa hiện "Comments are disabled on this page.", ẩn form, ẩn nút trả lời/sửa. POST bình luận bị trả 403.
  - Người có quyền `judge.override_comment_lock` vẫn bình luận được.
  - Khóa tự động:
    - Bài tập đang mở trong một kỳ thi dùng clarifications (`use_clarifications`): khu bình luận bị khóa và thay bằng danh sách clarification.
    - Trang bình luận kỳ thi dùng clarifications bị khóa khi kỳ thi đang diễn ra hoặc người xem đang trong kỳ thi.
  - Khi bật `VNOJ_OFFICIAL_CONTEST_MODE`, toàn bộ khu bình luận bị ẩn với mọi người trừ superuser.
- **Ai dùng được:** Admin tạo khóa.
- **Mã nguồn:** `judge/models/comment.py:200-210`, `judge/comments.py:101-103`, `judge/views/problem.py:175-202`, `judge/views/contests.py:380-386`, `templates/comments/list.html:1-13`

### CD-17. Ticket cho bài tập (hỏi đáp, báo lỗi đề)
- **Làm gì:** Kênh riêng giữa người dùng và tác giả bài để hỏi về đề hoặc báo lỗi.
- **Cách VNOJ làm:**
  - Ticket là một chuỗi tin nhắn riêng tư, gắn với một đối tượng qua khóa chung (`content_type` + `object_id`). Trong mã chỉ có hai loại đối tượng: bài tập (`Problem`) và vấn đề chung (`GeneralIssue`, CD-18). Không có ticket cho kỳ thi hay tổ chức.
  - Nút "Request clarification" trên trang bài mở `new_problem_ticket` (`/problem/<mã>/tickets/new`). Nút ẩn với người bị mute.
  - Form: `title` (≤100 ký tự), `body` (Markdown, martor). Người bị mute bị từ chối.
  - Người được giao (assignee) được chọn tự động:
    - Nếu người mở đang trong một kỳ thi chứa bài này: tác giả và curator của kỳ thi.
    - Ngoài ra: tác giả và curator của bài.
  - Tạo xong: lưu tin nhắn đầu tiên, gửi sự kiện thời gian thực lên kênh `tickets`, tạo thông báo cho các assignee ("New ticket: <tiêu đề>", popup), gửi webhook `on_new_ticket`.
  - Trang bài hiện link "Manage tickets" (người sửa bài) hoặc "My tickets" (người đã có ticket), kèm số ticket đang mở.
  - Danh sách ticket của một bài: `problem_ticket_list`. Người sửa bài thấy mọi ticket. Người khác chỉ thấy ticket mình mở hoặc được giao.
- **Ai dùng được:** Người đăng nhập, không bị mute, xem được bài.
- **Mã nguồn:** `judge/models/ticket.py:9-53`, `judge/views/ticket.py:33-137`, `judge/views/ticket.py:347-354`, `judge/models/problem.py:251`, `templates/problem/problem.html:188-191`, `templates/problem/problem.html:244-262`, `dmoj/urls.py:153-154`, trang `new_problem_ticket`, `problem_ticket_list`

### CD-18. Ticket báo lỗi chung ("Report an issue")
- **Làm gì:** Báo lỗi về bất kỳ trang nào của site.
- **Cách VNOJ làm:**
  - Link "Report an issue" luôn có trên thanh trên khi đăng nhập. Ở trang bài tập nó trỏ tới ticket bài tập. Ở trang khác nó trỏ tới `new_issue_ticket` (`/tickets/new?issue_url=<đường dẫn hiện tại>`).
  - Form có thêm ô `issue_url` (bắt buộc, ≤200 ký tự), điền sẵn đường dẫn trang.
  - Lưu một `GeneralIssue` chứa URL, rồi tạo ticket gắn với nó.
  - Không có assignee tự động. Ticket loại này chỉ người có `judge.change_ticket` (hoặc được giao trong admin) xử lý.
- **Ai dùng được:** Người đăng nhập, không bị mute.
- **Mã nguồn:** `judge/views/ticket.py:94-112`, `judge/models/ticket.py:9-16`, `templates/base.html:275-286`, trang `new_issue_ticket`

### CD-19. Trang ticket: tin nhắn, mở/đóng, ghi chú, câu trả lời mẫu
- **Làm gì:** Nơi trao đổi và xử lý một ticket.
- **Cách VNOJ làm:**
  - Trang `ticket` (`/ticket/<id>`). Người xem được: có `judge.change_ticket`, người mở, assignee, hoặc người sửa được bài gắn với ticket. Người khác nhận 403.
  - Nội dung: tiêu đề, số ticket, biểu tượng trạng thái mở/đóng và tốt/thường, chuỗi tin nhắn Markdown, ô gửi tin nhắn mới.
  - Gửi tin nhắn: lưu `TicketMessage`, đẩy sự kiện thời gian thực (`tickets` và `ticket-<id>`), tạo thông báo popup "New reply on ticket: <tiêu đề>". Nếu người gửi không phải người mở thì báo cho người mở; nếu là người mở thì báo cho mọi assignee. Gửi webhook `on_new_ticket_message`.
  - Tin nhắn mới và đổi trạng thái hiện ngay trên trang đang mở nhờ `ticket_message_ajax`.
  - Đóng/mở lại: `ticket_close`, `ticket_open` (POST). Ai xem được ticket cũng bấm được, kể cả người mở. Mỗi lần đổi ghi một tin nhắn hành động "opened"/"closed".
  - Ghi chú nội bộ: `notes`, sửa qua `ticket_notes` trong hộp nổi. Ô này chỉ hiện với người có `change_ticket` hoặc assignee.
  - Cột bên hiện đối tượng liên kết và danh sách assignee. Đổi assignee chỉ làm được trong admin (xem 08).
  - Câu trả lời mẫu: với người xem không phải người mở, ô trả lời có danh sách tìm kiếm `TICKET_AUTOFILL_REPLIES` (12 câu mặc định, mỗi câu có bản `en` và `vi`, ví dụ "Read the problem statement" / "Đọc đề bài"). Chọn câu nào thì chèn bản theo ngôn ngữ đang dùng.
- **Ai dùng được:** Như trên.
- **Mã nguồn:** `judge/views/ticket.py:140-265`, `judge/views/ticket.py:377-395`, `templates/ticket/ticket.html`, `dmoj/settings.py:72-97`, `dmoj/urls.py:423-431`, trang `ticket`, `ticket_open`, `ticket_close`, `ticket_notes`, `ticket_message_ajax`

### CD-20. Đánh dấu ticket tốt (good/norm)
- **Làm gì:** Thưởng điểm đóng góp cho người mở ticket hữu ích.
- **Cách VNOJ làm:**
  - Nút "Upvote" gọi `ticket_good`, nút "Undo vote" gọi `ticket_norm` (POST).
  - Nút chỉ hiện với người có `judge.change_ticket` hoặc assignee.
  - Server cho phép mọi người xem được ticket bấm, trừ người mở ticket. Mã kiểm tra quyền bằng chuỗi `'change_ticket'` thiếu tiền tố `judge.`, nên chỉ superuser vượt được kiểm tra "tự bầu ticket mình".
  - Đánh dấu tốt cộng `VNOJ_CP_TICKET = 10` điểm đóng góp cho người mở; bỏ đánh dấu trừ lại 10 (xem 05).
- **Ai dùng được:** Người xử lý ticket.
- **Mã nguồn:** `judge/views/ticket.py:208-240`, `templates/ticket/ticket.html:337-358`, `dmoj/urls.py:428-429`, trang `ticket_good`, `ticket_norm`

### CD-21. Danh sách ticket và bộ lọc
- **Làm gì:** Xem và lọc nhiều ticket.
- **Cách VNOJ làm:**
  - Trang `ticket_list` (`/tickets/`), cần đăng nhập. 50 ticket mỗi trang, mới nhất trước.
  - Cột: trạng thái mở/đóng và tốt/thường, ID, tiêu đề, người mở, assignee.
  - Bộ lọc: "Hide closed tickets" (`open=1`), "Show my tickets only" (`own=1`, ticket mình mở hoặc được giao), "Filing user" (nhiều người), "Assignee" (nhiều người). Hai ô tích lưu vào session.
  - Người không có `judge.change_ticket` chỉ thấy ticket mình mở, được giao, hoặc gắn với bài mình sửa được.
  - Trang tự thêm dòng mới và đổi trạng thái theo sự kiện thời gian thực, có lọc theo bộ lọc đang chọn. Có thông báo trình duyệt (browser notification) "New Ticket: ..." và "Reopened/Closed: ..." qua `ticket_ajax`.
  - Trang chủ có khối ticket mở (CD-01).
- **Ai dùng được:** Người đăng nhập.
- **Mã nguồn:** `judge/views/ticket.py:268-374`, `judge/utils/tickets.py`, `templates/ticket/list.html`, `templates/ticket/row.html`, `dmoj/urls.py:411-415`, trang `ticket_list`, `ticket_ajax`

### CD-22. Thông báo trong site (notification)
- **Làm gì:** Báo cho người dùng các sự kiện liên quan tới họ, ngay trên site.
- **Cách VNOJ làm:**
  - Model `Notification`: `recipient`, `title` (≤255), `body`, `url` (≤255), `time`, `read`, `priority`. Ba mức ưu tiên: `DEFAULT = 0`, `TICKET = 10`, `CONTEST_ANNOUNCEMENT = 30`.
  - Hàm `make_notification` tạo hàng loạt bản ghi, xóa cache số chưa đọc, rồi đẩy sự kiện qua event daemon (máy chủ đẩy sự kiện WebSocket) tới kênh riêng của từng người. Với nhóm lớn có thể đẩy một sự kiện chung lên một kênh.
  - Nguồn tạo thông báo trong mã:
    - Ticket mới cho assignee (CD-17).
    - Tin nhắn ticket mới (CD-19).
    - Thông báo kỳ thi (contest announcement) cho mọi người tham gia trực tiếp và người xem (spectator) của kỳ thi, không gồm người thi ảo. Dạng popup, đẩy qua kênh của kỳ thi (xem 04).
  - Không có thông báo cho trả lời bình luận, nhắc tên, hay phiếu bầu.
  - Thanh trên có chuông với số chưa đọc. Bấm mở bảng "Unread" gồm 10 thông báo chưa đọc mới nhất (`notification_ajax?status=unread`), nút "Mark all read", link "See all notifications". Bảng được cache trong `localStorage` 5 phút.
  - Khi có thông báo mới qua event daemon, số trên chuông tăng ngay. Nếu là popup thì hiện hộp nổi (toast) với tiêu đề, 200 ký tự đầu của nội dung, nút "View" và "Close".
  - Khi còn thông báo chưa đọc, đầu mọi trang có dải "You have unread notifications."
  - Trang `notification_list` (`/notifications/`): 50 mỗi trang, lọc `all`/`unread`/`read`. Sắp chưa đọc trước, rồi theo ưu tiên, rồi mới nhất.
  - `notification_mark_read` (POST): `all=1` để đánh dấu tất cả đã đọc, hoặc `id` + `read=1|0` để đổi một cái.
  - Số chưa đọc cache 1 ngày theo người, xóa cache khi có thay đổi.
- **Ai dùng được:** Người đăng nhập (chỉ thấy thông báo của mình).
- **Mã nguồn:** `judge/models/notification.py:13-63`, `judge/views/notification.py:17-90`, `judge/models/profile.py:321-337`, `judge/utils/cache_helper.py:23-29`, `judge/tasks/contest.py:155-173`, `templates/base.html:94-107`, `templates/base.html:309-330`, `templates/base.html:401-407`, `templates/notification/list.html`, `resources/notification.js`, `resources/notification-realtime.js`, `dmoj/urls.py:417-421`, trang `notification_list`, `notification_ajax`, `notification_mark_read`

### CD-23. Nhắc tên người dùng trong Markdown (`[user:...]`)
- **Làm gì:** Chèn tên người dùng có màu và link vào văn bản.
- **Cách VNOJ làm:**
  - Cú pháp `[user:<tên>]` render thành tên có màu theo bậc và link tới trang cá nhân. Tên không tồn tại hiện dạng "deleted-user".
  - Cú pháp `[ruser:<tên>]` render thêm ô màu rating cạnh tên.
  - Áp dụng ở mọi nơi dùng bộ lọc `reference`: bình luận, blog, ticket, đề bài, trang tĩnh, hồ sơ.
  - Trong martor: nút "mention" hoặc phím Ctrl+M chèn `[user:]`. Khi gõ sau `[user:` editor gợi ý tên qua `martor_search_user` (`/widgets/martor/search-user?username=`). Endpoint trả mọi tài khoản đang hoạt động có tên chứa chuỗi tìm (không giới hạn số lượng, không cần đăng nhập).
  - Nhắc tên không tạo thông báo.
- **Ai dùng được:** Ai viết được Markdown.
- **Mã nguồn:** `judge/jinja2/reference.py:17-133`, `martor/views.py:12-58`, `martor/static/martor/js/martor.js:100-141`, `martor/static/martor/js/martor.js:553-570`, `dmoj/settings.py:688-697`, trang `martor_search_user`

### CD-24. Trình soạn Markdown martor và tải ảnh
- **Làm gì:** Trình soạn thống nhất cho mọi ô Markdown trên site.
- **Cách VNOJ làm:**
  - VNOJ giữ một bản martor riêng trong thư mục `martor/`. Ô soạn dùng editor Ace.
  - Hai tab "Editor" và "Preview". Tab Preview gửi nội dung tới endpoint xem trước riêng của từng loại nội dung (CD-25).
  - Thanh công cụ: đậm, nghiêng, H1–H3, trích dẫn, danh sách có/không thứ tự, code, khối pre, đường kẻ ngang, link, link ảnh, tải ảnh, nhắc tên, toán inline, toán display, LaTeX, phóng to toàn màn hình, trợ giúp.
  - Phím tắt, ví dụ Ctrl+L (link), Ctrl+Shift+I (ảnh), Ctrl+M (nhắc tên).
  - Cấu hình `MARTOR_ENABLE_CONFIGS`: `imgur: true` (bật tải ảnh), `mention: true`, `living: false`, `hljs: false`.
  - Tải ảnh: nút tải hoặc dán ảnh từ clipboard. Gửi tới `martor_image_uploader` (`/widgets/martor/upload-image`, trường `markdown-image-upload`).
    - Chỉ staff hoặc người có quyền `judge.can_upload_image` được tải. Người khác nhận 403.
    - Tên file đổi thành UUID. Đuôi được giữ nếu thuộc `.jpg`, `.png`, `.gif`, `.svg`; đuôi khác bị đổi thành `.png`.
    - Lưu vào `MEDIA_ROOT/martor/`, phục vụ qua `/martor/<tên>`.
    - Không thấy giới hạn kích thước riêng trong mã (chưa kiểm tra cấu hình web server).
  - Widget bỏ thuộc tính `required` trên textarea ẩn để tránh lỗi kiểm tra HTML5.
- **Ai dùng được:** Mọi người dùng form có Markdown. Tải ảnh: staff hoặc `can_upload_image`.
- **Mã nguồn:** `martor/widgets.py`, `martor/templates/martor/editor.html`, `martor/templates/martor/toolbar.html`, `judge/widgets/martor.py`, `judge/views/widgets.py:45-93`, `judge/models/profile.py:549`, `dmoj/settings.py:688-702`, `dmoj/urls.py:394-397`, trang `martor_image_uploader`

### CD-25. Các endpoint xem trước Markdown
- **Làm gì:** Render thử Markdown đúng như khi đăng.
- **Cách VNOJ làm:**
  - 11 endpoint POST dưới `/widgets/preview/`, nhận tham số `content`: `default_preview`, `problem_preview`, `blog_preview`, `contest_preview`, `comment_preview`, `flatpage_preview`, `profile_preview`, `organization_preview`, `solution_preview`, `license_preview`, `ticket_preview`.
  - Mỗi endpoint dùng template và kiểu Markdown riêng. Ví dụ `comment` và `ticket` dùng kiểu an toàn (không HTML thô, không style); `blog` cho phép style; `flatpage` là kiểu do admin soạn, ít lọc nhất.
  - Thiếu `content` trả 400. Không yêu cầu đăng nhập.
- **Ai dùng được:** Bất kỳ ai gọi được endpoint.
- **Mã nguồn:** `judge/views/preview.py:1-58`, `dmoj/urls.py:380-392`, `dmoj/settings.py:622-686`

### CD-26. Trang tĩnh (flatpages)
- **Làm gì:** Các trang nội dung cố định như giới thiệu, hướng dẫn, quy định.
- **Cách VNOJ làm:**
  - Dùng `django.contrib.flatpages` với `FlatpageFallbackMiddleware`: URL nào không khớp route nào thì tra bảng trang tĩnh.
  - Nội dung viết bằng Markdown (kiểu `flatpage`), có toán, có nhắc tên. Cache 1 ngày theo URL, xóa cache khi lưu.
  - Có 3 template: `flatpages/default.html` (có dịch tiêu đề), `flatpages/markdown.html`, `flatpages/markdown_math.html`.
  - Người có quyền `flatpages.change_flatpage` thấy link "Edit" tới admin.
  - Soạn trong admin với martor và preview `flatpage_preview`, có lịch sử phiên bản (xem 08).
  - Một số trang được mã dẫn link tới: `/about/` (trong sitemap), `/about/blog/` (hướng dẫn viết blog), `/about/comment/` (hướng dẫn bình luận).
- **Ai dùng được:** Mọi người xem. Admin soạn.
- **Mã nguồn:** `templates/flatpages/`, `dmoj/settings.py:451`, `dmoj/settings.py:492`, `judge/admin/interface.py:50-58`, `judge/signals.py:187-189`

### CD-27. Bản tin email (newsletter)
- **Làm gì:** Danh sách nhận email cập nhật.
- **Cách VNOJ làm:**
  - Tùy chọn. Chỉ bật khi app `newsletter` (gói django-newsletter) có trong `INSTALLED_APPS`. Cấu hình mặc định không có app này. Khi bật, URL `/newsletter/` được thêm.
  - `DMOJ_NEWSLETTER_ID_ON_REGISTER` (mặc định `None`) chọn bản tin gắn với đăng ký.
  - Khi đặt, form đăng ký có ô "Subscribe to newsletter?" (mặc định tích). Trang sửa hồ sơ có ô "Subscribe to contest updates" để bật/tắt.
  - Có bộ template `templates/newsletter/` cho các bước đăng ký, hủy, cập nhật và lưu trữ bản tin.
- **Ai dùng được:** Người dùng tự đăng ký/hủy. Gửi bản tin: trong admin của gói newsletter (chưa kiểm tra).
- **Mã nguồn:** `judge/utils/subscription.py`, `judge/views/register.py:39-40`, `judge/views/register.py:105-106`, `judge/views/user.py:495-503`, `judge/forms.py:53-54`, `dmoj/settings.py:334`, `dmoj/urls.py:466-467`

### CD-28. RSS/Atom feed
- **Làm gì:** Cho người dùng theo dõi nội dung mới bằng trình đọc tin.
- **Cách VNOJ làm:**
  - 6 feed, mỗi loại có bản RSS và Atom:
    - Bài tập (`problem_rss`, `problem_atom`): 25 bài công khai mới nhất. Mô tả là 500 ký tự đầu của đề đã render, cache 1 ngày.
    - Bình luận (`comment_rss`, `comment_atom`): 25 bình luận mới nhất mà khách được xem. Tiêu đề "<tên> -> <trang>".
    - Blog (`blog_rss`, `blog_atom`): 25 bài `visible` đã tới giờ đăng, ghim trước. Không lọc theo tổ chức hay `global_post`. Mô tả là tóm tắt hoặc nội dung, cache 1 ngày.
  - Tiêu đề feed dùng `SITE_NAME` và `SITE_LONG_NAME`.
- **Ai dùng được:** Mọi người.
- **Mã nguồn:** `judge/feed.py:12-101`, `dmoj/urls.py:400-407`, `templates/blog/list.html:6-13`

### CD-29. Sitemap
- **Làm gì:** Tệp `sitemap.xml` cho máy tìm kiếm.
- **Cách VNOJ làm:**
  - Gồm: trang chủ (ưu tiên 1.0, hàng giờ), `/about/` (0.9), bài tập công khai (0.8, hàng tuần), lời giải công khai đã đăng của bài công khai (0.8, hàng tuần), blog `visible` đã đăng (0.7, hàng giờ), kỳ thi hiển thị, không riêng tư, không riêng tổ chức (0.7, hàng giờ), mọi tổ chức (0.5, hàng tuần), mọi tài khoản (0.5, hàng tuần).
  - Blog trong sitemap không lọc bài tổ chức. Tổ chức trong sitemap không lọc tổ chức ẩn.
- **Ai dùng được:** Máy tìm kiếm, mọi người.
- **Mã nguồn:** `judge/sitemap.py:9-116`, `dmoj/urls.py:433`

### CD-30. Đẩy sự kiện cộng đồng sang Discord (webhook)
- **Làm gì:** Gửi tin tóm tắt các sự kiện mới vào kênh Discord của ban quản trị.
- **Cách VNOJ làm:**
  - Cấu hình `DISCORD_WEBHOOK` là từ điển theo sự kiện. Mỗi giá trị là URL hoặc `{url, thread_id}`. Mặc định mọi giá trị là `None` (tắt). Cũng cần đặt `SITE_FULL_URL`.
  - Sự kiện cộng đồng: `on_new_comment` (link + 200 ký tự đầu), `on_new_blogpost` (tiêu đề + 200 ký tự đầu, chỉ khi tạo blog cá nhân từ site), `on_new_ticket`, `on_new_ticket_message`.
  - Tin gửi dạng embed, có tên và ảnh đại diện người tạo.
  - Các sự kiện khác (bài mới, kỳ thi mới, hàng đợi dài, lỗi) và giới hạn tần suất `VNOJ_DISCORD_WEBHOOK_THROTTLING = (10, 60)`: xem 08.
- **Ai dùng được:** Cấu hình bởi người quản trị máy chủ.
- **Mã nguồn:** `judge/tasks/webhook.py:1-175`, `dmoj/settings.py:203-214`, `dmoj/settings.py:250`
