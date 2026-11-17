# Chức năng: Đăng nhập

Trạng thái: đã làm xong (M1)
Milestone: M1

> Bản này mô tả chức năng **đang chạy**. Mọi chi tiết đều đối chiếu với mã hiện tại:
> `site/algojudge/api/auth.py`, `site/algojudge/auth/sessions.py`, `site/algojudge/auth/passwords.py`,
> `site/algojudge/config.py`, `ui/src/pages/LoginPage.tsx`, `site/tests/test_auth.py`.

## 1. Mô tả

- Người dùng chứng minh mình là chủ tài khoản bằng tên đăng nhập (hoặc email) và mật khẩu. Sau đó trình duyệt giữ một phiên để các request sau không phải nhập lại.
- Ai dùng: mọi người có tài khoản. Khách chưa đăng nhập vẫn xem được bài công khai.
- Không nằm trong chức năng này: đăng ký, quên mật khẩu, đổi mật khẩu, xác thực email (ba mục sau đang hoãn, xem `DESIGN.md` §6.7).

## 2. Vị trí

- Trang `/login`. Vào từ nút "Đăng nhập" trên header, hoặc bị chuyển tới khi mở trang cần đăng nhập, kèm `?next=<đường dẫn cũ>`.
- Người đã đăng nhập mở `/login` thì được chuyển thẳng tới `next`.
- Liên quan: Đăng ký (đăng ký xong là đăng nhập luôn), Phân quyền (vai trò đọc từ phiên), Quản lý người dùng (khóa tài khoản làm mất phiên).

## 3. Luồng chạy

### Luồng chính

1. Người dùng nhập tên đăng nhập hoặc email, mật khẩu, và chọn "Ghi nhớ đăng nhập" (mặc định đang tích).
2. Giao diện gọi `POST /api/auth/login`.
3. API đếm số lần sai gần đây của cặp (IP, tên đăng nhập). Từ 10 lần trở lên thì trả 429 và dừng.
4. API tìm tài khoản theo tên đăng nhập hoặc email, không phân biệt hoa thường, rồi kiểm tra mật khẩu bằng Argon2id.
5. Đúng mật khẩu: xóa bộ đếm sai, ghi `last_login_at`, tạo một token ngẫu nhiên, lưu `session:<sha256(token)>` → id người dùng vào Redis, và trả token trong cookie `aj_session`.
6. Giao diện chuyển tới `next`.

Ở mỗi request sau đó, API đọc cookie, tra Redis ra id, rồi **đọc lại người dùng từ CSDL**. Vì vậy đổi vai trò hay khóa tài khoản có hiệu lực ngay ở request kế tiếp.

### Luồng phụ và luồng lỗi

| Tình huống | Kết quả |
|---|---|
| Sai mật khẩu, hoặc tài khoản không tồn tại | 401 `invalid_credentials`. Cùng một mã cho cả hai trường hợp. Bộ đếm sai tăng 1 |
| Sai 10 lần trong 15 phút | 429 `too_many_attempts`, kể cả khi lần này nhập đúng |
| Đúng mật khẩu nhưng tài khoản bị khóa | 403 `account_disabled` |
| Không tích "Ghi nhớ" | Cookie mất khi đóng trình duyệt. Phiên phía server hết hạn sau 1 ngày |
| Có tích "Ghi nhớ" | Cookie và phiên sống 30 ngày |
| Tham số băm mật khẩu đã đổi từ lần băm trước | Mật khẩu được băm lại ngay trong lần đăng nhập đúng này |

### Vì sao chọn luồng này

- **Phiên lưu ở server, không dùng JWT.** Đăng xuất hoặc khóa tài khoản là xóa phiên, có hiệu lực ngay. Với JWT, token đã phát ra vẫn dùng được cho tới khi hết hạn, muốn thu hồi sớm lại phải thêm một danh sách đen, tức là quay về lưu trạng thái ở server.
- **Redis chỉ lưu hash của token.** Ai đọc được bản dump Redis cũng không có token để giả làm người dùng.
- **Một mã lỗi cho "sai mật khẩu" và "không có tài khoản".** Nếu tách hai mã, người lạ dò được tên nào đã đăng ký.

## 4. Dữ liệu

Không có bảng riêng. Dùng:

- Bảng `users`: `username`, `email`, `password_hash`, `is_active`, `last_login_at`.
- Redis `session:<sha256(token)>` → id người dùng, có thời hạn.
- Redis `user_sessions:<id>` → tập các khóa phiên của người đó, để hủy mọi phiên cùng lúc.
- Redis `login_fail:<ip>:<tên đăng nhập viết thường>` → số lần sai, tự hết hạn sau 15 phút kể từ lần sai đầu.

## 5. API

| Method | Endpoint | Quyền | Request | Response | Lỗi |
|---|---|---|---|---|---|
| POST | `/api/auth/login` | Mọi người | `{login, password, remember}` | 200, thông tin người dùng, kèm cookie `aj_session` | 401 `invalid_credentials`, 403 `account_disabled`, 429 `too_many_attempts` |
| POST | `/api/auth/logout` | Mọi người | — | 204, xóa cookie và phiên | — |
| GET | `/api/auth/me` | Mọi người | — | 200 `{user}`; chưa đăng nhập thì `{user: null}` | — |

`/api/auth/me` luôn trả 200. Với giao diện, "chưa đăng nhập" là trạng thái bình thường, không phải lỗi.

## 6. Hiệu suất

- **Băm Argon2id là bước tốn nhất**, và nó cố ý tốn để việc dò mật khẩu chậm. Mỗi lần đăng nhập chạy đúng một lần băm.
- Request thường (đã đăng nhập) tốn 1 lệnh Redis và 1 truy vấn CSDL theo khóa chính để đọc lại người dùng. Đây là cái giá của việc "đổi vai trò có hiệu lực ngay".
- Tìm theo tên đăng nhập và email dùng index trên `lower(username)` và `lower(email)`.
- Điểm nghẽn có thể có: đầu kỳ thi, hàng trăm người đăng nhập cùng lúc, mỗi người một lần băm. CHƯA QUYẾT: chưa đo một lần băm mất bao lâu trên máy chủ thật.

## 7. Các case phát sinh từ người dùng

| Case | Hậu quả nếu không xử lý | Cách xử lý | Tình trạng |
|---|---|---|---|
| Dò mật khẩu của một tài khoản | Mất tài khoản | Khóa tạm cặp (IP, tên đăng nhập) sau 10 lần sai trong 15 phút | Đã có, có test |
| Dò xem tên nào có tài khoản qua thời gian phản hồi | Lộ danh sách tài khoản | Tên không tồn tại vẫn chạy kiểm tra trên một hash giả, nên thời gian như nhau | Đã có |
| Cố tình nhập sai để khóa đăng nhập của người khác | Nạn nhân không vào được | Bộ đếm gắn với IP của người nhập sai, nên nạn nhân ở IP khác không bị ảnh hưởng | Đã có |
| Link `/login?next=https://trang-lừa-đảo` | Đăng nhập xong bị đưa sang trang giả | `next` chỉ nhận đường dẫn nội bộ | Đã có |
| Trang khác tự gửi form đăng nhập hoặc request thay người dùng (CSRF) | Thao tác ngoài ý muốn | Cookie `SameSite=Lax`, API chỉ nhận JSON | Đã có |
| JavaScript độc đọc cookie | Mất phiên | Cookie `httpOnly` | Đã có |
| Tài khoản bị khóa nhưng đang có phiên mở | Vẫn dùng tiếp được | Khóa tài khoản là hủy mọi phiên, và mỗi request đều kiểm tra `is_active` | Đã có |
| Gõ tên đăng nhập khác kiểu hoa thường lúc đăng ký | Báo sai dù nhập đúng | So sánh không phân biệt hoa thường | Đã có, có test |
| Thử một mật khẩu phổ biến trên **nhiều tài khoản** từ một IP | Lọt tài khoản có mật khẩu yếu | Chưa xử lý: bộ đếm tính theo từng tên, và nginx chưa đặt giới hạn request | **Còn hở** |
| Dò một tài khoản từ **nhiều IP** | Vượt giới hạn 10 lần | Chưa xử lý: không có bộ đếm theo riêng tài khoản | **Còn hở** |
| Gọi thẳng API, tự đặt header `X-Real-IP` | Né bộ đếm sai | Chỉ nginx được mở cổng ra ngoài và nginx tự ghi đè header này. Sẽ hở nếu sau này mở cổng API | Phụ thuộc cấu hình triển khai |
| Quên mật khẩu | Mất tài khoản vĩnh viễn | Chưa có. Hiện admin phải can thiệp từ terminal | Hoãn |

Hai dòng "Còn hở" sửa được bằng một bộ đếm theo IP (không kèm tên) và `limit_req` của nginx cho `/api/auth/login`. Nên làm trước khi mở site ra Internet.

## 8. Tiêu chí hoàn thành

- [x] Đăng nhập được bằng tên đăng nhập và bằng email (`test_login_with_username_or_email`)
- [x] Sai mật khẩu và tài khoản không tồn tại trả cùng một mã (`test_login_wrong_password_or_unknown_user`)
- [x] "Ghi nhớ" tạo cookie có thời hạn (`test_remember_me_sets_persistent_cookie`)
- [x] Đăng xuất làm phiên mất hiệu lực (`test_logout_invalidates_session`)
- [x] Sai quá số lần thì bị chặn (`test_too_many_failed_logins`)
- [ ] Giới hạn theo IP cho trường hợp thử nhiều tài khoản
- [ ] Đo thời gian băm trên máy chủ thật
