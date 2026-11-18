# Chức năng của VNOJ

Bộ file này liệt kê **mọi chức năng VNOJ có**, đọc trực tiếp từ mã nguồn. Mục đích: bạn đọc từng chức năng và chốt **Làm**, **Bỏ** hay **Sửa** cho AlgoJudge.

Tài liệu chỉ mô tả VNOJ. Nó không chứa đề xuất, không so sánh với AlgoJudge, và không dựa trên `DESIGN.md`.

## Nguồn

| Thành phần | Repo | Commit | Thư mục trên máy |
|---|---|---|---|
| Site | `VNOI-Admin/OJ` | `209a32e` (04/11/2026) | `reference/vnoj-src/site/` |
| Máy chấm (chỉ dùng ở file 03) | `VNOI-Admin/judge-server` | `23759617` (10/10/2026) | `reference/vnoj-src/judge-server-upstream/` |

- Mọi mô tả hành vi đều có trích dẫn `file:dòng`, tính từ `reference/vnoj-src/site/`. Tổng cộng khoảng 1.260 trích dẫn. Tất cả đều trỏ tới file có thật, trong phạm vi số dòng của file.
- 118 giá trị cờ cấu hình (dạng `TÊN = giá_trị`) đã được so với `dmoj/settings.py`, và đều khớp.
- Chỗ nào chưa kiểm tra được, tài liệu ghi **(chưa kiểm tra)**. Thường là phần nằm trong thư viện bên ngoài, không có trong repo.

## Danh sách file

| File | Nhóm | Tiền tố mã | Số mục |
|---|---|---|---|
| [01-tai-khoan.md](01-tai-khoan.md) | Tài khoản và người dùng | `TK` | 34 |
| [02-bai-tap.md](02-bai-tap.md) | Bài tập | `BT` | 47 |
| [03-test-cham-bai-nop.md](03-test-cham-bai-nop.md) | Test, máy chấm, nộp bài, bài nộp | `CB` | 46 |
| [04-ky-thi.md](04-ky-thi.md) | Kỳ thi và rating | `KT` | 60 |
| [05-diem-xep-hang.md](05-diem-xep-hang.md) | Điểm và xếp hạng người dùng | `XH` | 14 |
| [06-cong-dong.md](06-cong-dong.md) | Trang chủ, blog, bình luận, ticket, thông báo | `CD` | 30 |
| [07-to-chuc.md](07-to-chuc.md) | Tổ chức | `TC` | 26 |
| [08-quan-tri.md](08-quan-tri.md) | Quản trị và vận hành | `QT` | 39 |
| | | **Tổng** | **296** |

Khi một mục nói "xem 04", nghĩa là chi tiết nằm ở file `04-...md`.

## Cách chốt

Mỗi file mở đầu bằng một **Bảng quyết định**:

| Mã | Chức năng | Quyết định | Ghi chú |
|---|---|---|---|
| KT-03 | Thể thức ICPC | Làm | |
| KT-07 | Thể thức ECOO | Bỏ | |
| KT-28 | Cửa sổ thời gian cá nhân | Sửa | Chỉ cho kỳ thi luyện tập |

- Điền thẳng vào cột **Quyết định** và **Ghi chú**. Với **Sửa**, ghi ngắn muốn khác VNOJ ở điểm nào.
- Phần **Chi tiết** bên dưới mỗi bảng mô tả kỹ từng mục: làm gì, VNOJ làm thế nào, ai dùng được, mã nguồn ở đâu.
- Có thể trả lời qua chat theo mã cũng được, ví dụ "KT-07: bỏ".

Chốt xong, tôi ghi các quyết định vào `DESIGN.md` và sắp lại lộ trình milestone.

## Những điều bất ngờ trong mã VNOJ

Các agent đọc mã ghi lại những chỗ VNOJ hoạt động khác với vẻ bề ngoài. Chi tiết nằm ở mục tương ứng. Những chỗ ghi "có thể lỗi" là đọc từ mã, **chưa chạy thử**.

**Hành vi khác dự đoán**
- Một bài chỉ đáng từ 0,01 đến 2 điểm (`DMOJ_PROBLEM_MAX_PROBLEM_POINTS = 2`). Điểm này dùng để tính điểm luyện tập của người dùng (XH-01, XH-03).
- Rating không tự tính khi kỳ thi kết thúc. Admin phải bấm tay trong trang quản trị (KT-56).
- Bài đã xóa mềm không có cách khôi phục, sau 7 ngày bị xóa hẳn (BT-39).
- Phiếu bầu cho bình luận và blog không rút lại được (CD-07, CD-13).
- Thông báo trong site chỉ sinh ra từ ticket và thông báo kỳ thi. Nhắc tên hay trả lời bình luận không tạo thông báo (CD-22).
- Không có ticket cho kỳ thi hay tổ chức, chỉ có ticket cho bài và ticket báo lỗi chung (CD-17, CD-18).
- Người tạo tổ chức không tự thành admin của tổ chức đó. Tổ chức mới bị ẩn khỏi danh sách (TC-02).
- Trường `access_code` của tổ chức có trong model nhưng không mã nào dùng tới (TC-08).
- Nhiều trường cấu hình test có trong model nhưng trang sửa test không có ô nhập: generator, tiền tố output, hint, giới hạn riêng từng test (CB-15, CB-16).
- Form tạo kỳ thi trên site không kiểm tra quyền riêng cho trạng thái công khai, riêng tư và mã truy cập. Chỉ trang quản trị Django kiểm tra (KT-11).
- `OAUTH_ONLY` chỉ ẩn form đăng ký trên giao diện, server vẫn nhận đăng ký (TK-03).
- `DMOJ_REQUIRE_STAFF_2FA` chỉ cấm staff tắt 2FA, không bắt staff bật (TK-11).
- Không có mã sao lưu nào trong repo (QT-38).

**Có thể là lỗi của VNOJ**
- Cảnh báo hàng đợi dài: bridge gửi list nhưng hàm nhận gọi `.values()` như với dict (CB-28).
- Thể thức IOI mới cộng thẳng điểm thô từng test, không thấy bước quy đổi theo điểm bài trong kỳ thi (KT-04).
- Bộ lọc theo kết quả khi tải dữ liệu kỳ thi gọi tới trường không có trong model (KT-49).
- Nhân bản bài có thể chuyển hẳn giới hạn theo ngôn ngữ từ bài gốc sang bài mới thay vì sao chép (BT-38).
- Thao tác ẩn/hiện bình luận hàng loạt trong admin gọi `.author` trên một queryset (QT-07).
- Kiểm tra quyền `spam_organization` và `change_ticket` thiếu tiền tố `judge.`, nên thực tế chỉ superuser qua được (TC-02, CD-20).

## Ngoài phạm vi

- Bên trong máy chấm: sandbox, danh sách trình biên dịch, cách chạy test. File 03 chỉ ghi những phần mà site cấu hình được.
- Giao diện: màu sắc, bố cục chi tiết, CSS. Tài liệu chỉ ghi trang có những gì, không ghi trang trông thế nào.
