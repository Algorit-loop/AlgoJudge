# 01. Tài khoản và người dùng

Nguồn: `VNOI-Admin/OJ` commit `209a32e` (04/11/2026), thư mục `reference/vnoj-src/site/`. Phần này nằm chủ yếu ở model `Profile` (`judge/models/profile.py`), các view `judge/views/user.py`, `judge/views/register.py`, `judge/views/two_factor.py`, các form trong `judge/forms.py`, các middleware trong `judge/middleware.py`, `judge/user_log.py`, `judge/timezone.py`, và template trong `templates/registration/`, `templates/user/`. Tài khoản gồm hai bảng: `User` của Django (tên đăng nhập, email, mật khẩu, họ tên, cờ staff/superuser) và `Profile` của VNOJ (mọi thông tin còn lại), nối 1–1.

## Bảng quyết định

| Mã | Chức năng | Quyết định | Ghi chú |
|---|---|---|---|
| TK-01 | Đăng ký tài khoản bằng form | | |
| TK-02 | Kích hoạt tài khoản qua email (kể cả trả lời email qua Mailgun) | | |
| TK-03 | Đóng đăng ký và chế độ chỉ đăng nhập mạng xã hội | | |
| TK-04 | Chặn nhà cung cấp email xấu và reCAPTCHA | | |
| TK-05 | Đăng ký nhận bản tin (newsletter) | | |
| TK-06 | Đăng nhập và đăng xuất | | |
| TK-07 | Quy tắc mật khẩu và bắt đổi mật khẩu bị lộ | | |
| TK-08 | Đổi mật khẩu và quên mật khẩu | | |
| TK-09 | Xác thực hai lớp bằng TOTP và mã dự phòng | | |
| TK-10 | Xác thực hai lớp bằng khóa bảo mật (WebAuthn) | | |
| TK-11 | Quy định 2FA cho staff | | |
| TK-12 | Đăng nhập bằng Google, Facebook, GitHub | | |
| TK-13 | Đăng nhập tự động theo địa chỉ IP | | |
| TK-14 | API token cá nhân | | |
| TK-15 | VNOJ làm nhà cung cấp OAuth2 / OpenID | | |
| TK-16 | Trang chỉnh sửa hồ sơ | | |
| TK-17 | Múi giờ và ngôn ngữ lập trình mặc định | | |
| TK-18 | Giao diện sáng/tối và giao diện trình soạn code | | |
| TK-19 | Cách hiển thị công thức toán và tính năng thử nghiệm | | |
| TK-20 | Script tùy biến của người dùng (user script) | | |
| TK-21 | Ảnh đại diện Gravatar và huy hiệu | | |
| TK-22 | Trang người dùng: thanh bên và tab Giới thiệu | | |
| TK-23 | Trang người dùng: tab Thống kê | | |
| TK-24 | Trang người dùng: các tab còn lại | | |
| TK-25 | Bảng xếp hạng người dùng | | |
| TK-26 | Danh sách người đóng góp | | |
| TK-27 | Tìm người dùng | | |
| TK-28 | Các trường hồ sơ chỉ quản trị viên đặt | | |
| TK-29 | Cấm phát ngôn (mute) và hạn chế người dùng mới | | |
| TK-30 | Khóa và mở khóa tài khoản (ban/unban) | | |
| TK-31 | Tải dữ liệu cá nhân | | |
| TK-32 | Ghi nhận lần truy cập cuối và IP | | |
| TK-33 | Chế độ thi chính thức (ảnh hưởng tới tài khoản) | | |
| TK-34 | Lệnh dòng lệnh để tạo và gộp tài khoản | | |

## Chi tiết

### TK-01. Đăng ký tài khoản bằng form
- **Làm gì:** Khách tự tạo tài khoản bằng tên đăng nhập, email và mật khẩu. Đồng thời chọn múi giờ, ngôn ngữ lập trình mặc định và tổ chức.
- **Cách VNOJ làm:**
  - Dùng thư viện `django-registration-redux` (bản `>=2.10`, `requirements.txt:5`). Form `CustomRegistrationForm` kế thừa form của thư viện.
  - Các trường của form:
    - `username`: chỉ chữ cái, chữ số, dấu gạch dưới (regex `^\w+$` chế độ ASCII), tối đa 30 ký tự.
    - `full_name`: họ tên, tối đa 30 ký tự, không bắt buộc. Lưu vào `User.first_name`.
    - `email`, `password1`, `password2`: lấy từ form của thư viện.
    - `timezone`: múi giờ, chọn trong danh sách của `pytz` (bỏ các múi `GMT…`), nhóm theo châu lục. Mặc định `DEFAULT_USER_TIME_ZONE` = `America/Toronto`.
    - `language`: ngôn ngữ lập trình mặc định. Mặc định `DEFAULT_USER_LANGUAGE` = `CPP20`.
    - `organizations`: chọn nhiều tổ chức đang mở (`is_open=True`), không bắt buộc. Tối đa `DMOJ_USER_MAX_ORGANIZATION_COUNT` = 3 tổ chức (xem 07).
    - `newsletter` và `captcha`: chỉ có khi bật (xem TK-04, TK-05).
  - Kiểm tra email: mỗi email chỉ được dùng cho một tài khoản. Báo lỗi nếu email đã có người dùng.
  - Trình duyệt tự đoán múi giờ bằng `Intl.DateTimeFormat()` và chọn sẵn nếu có trong danh sách. Có nút "chọn trên bản đồ" dùng ảnh `TIMEZONE_MAP`.
  - Trang hiển thị danh sách quy tắc mật khẩu (thu gọn, bấm để mở).
  - Nếu đặt `TERMS_OF_SERVICE_URL`, trang hiện dòng "Bằng việc đăng ký, bạn đồng ý với Điều khoản…" kèm liên kết. Mặc định `None`.
  - Việc tạo `User` và `Profile` nằm trong một transaction. Email kích hoạt chỉ gửi sau khi transaction xong.
  - Link "Sign up" trên thanh điều hướng chỉ hiện khi `REGISTRATION_OPEN` bật.
- **Ai dùng được:** Khách chưa đăng nhập.
- **Mã nguồn:** `judge/views/register.py:26-113`, `templates/registration/registration_form.html:136-150`, `:241-243`, `judge/models/choices.py:8-20`, `dmoj/settings.py:340-343`, `:754`, `templates/base.html:358-364`; trang `registration_register` (`dmoj/urls.py:43`).

### TK-02. Kích hoạt tài khoản qua email
- **Làm gì:** Sau khi đăng ký, tài khoản chưa dùng được. Người dùng phải bấm link trong email (hoặc trả lời email) để kích hoạt.
- **Cách VNOJ làm:**
  - Cờ `SEND_ACTIVATION_EMAIL` (mặc định `True`). Khi bật, trang hoàn tất báo "đã gửi email xác nhận". Khi tắt, trang hoàn tất dùng mẫu "kích hoạt thành công".
  - Link kích hoạt có hạn `ACCOUNT_ACTIVATION_DAYS` = 7 ngày.
  - Email chứa link `http://<domain>/accounts/activate/<key>/` và chính mã kích hoạt.
  - Mã sai hoặc hết hạn: trang báo "<key> là mã kích hoạt không hợp lệ".
  - Kích hoạt bằng cách trả lời email (Mailgun — dịch vụ gửi/nhận email; Mailgun gọi về site khi có thư đến):
    - Chỉ hoạt động khi có setting `MAILGUN_ACCESS_KEY`.
    - Site kiểm chữ ký HMAC-SHA256 của Mailgun (`timestamp` + `token`). Sai chữ ký thì từ chối (403).
    - Tìm tài khoản theo địa chỉ người gửi (không phân biệt hoa thường). Nếu thư trả lời có chứa mã kích hoạt thì kích hoạt tài khoản.
    - Các trường hợp từ chối (trả 406): không rõ người gửi, không có tài khoản, đã kích hoạt rồi, không thấy mã trong thư.
    - Mọi lần nhận đều ghi vào logger `judge.mail.activate`.
  - Thư viện xử lý phần tạo mã và gửi thư (chưa kiểm tra mã thư viện).
- **Ai dùng được:** Người vừa đăng ký.
- **Mã nguồn:** `dmoj/urls.py:31-50`, `dmoj/settings.py:500`, `judge/views/register.py:116-123`, `judge/views/mailgun.py:21-65`, `templates/registration/activation_email.txt`, `templates/registration/activate.html`; trang `registration_activate`, `registration_activation_complete`, `registration_complete`, `mailgun_activate` (`dmoj/urls.py:362`).

### TK-03. Đóng đăng ký và chế độ chỉ đăng nhập mạng xã hội
- **Làm gì:** Quản trị có thể tắt đăng ký mới, hoặc chỉ cho đăng ký qua tài khoản mạng xã hội.
- **Cách VNOJ làm:**
  - `REGISTRATION_OPEN` (mặc định `True`). Khi tắt, link "Sign up" bị ẩn. Thư viện chuyển người vào trang `registration_disallowed` với thông báo "Đăng ký đang đóng. Vui lòng liên hệ quản trị viên." (phần chuyển hướng là hành vi thư viện, chưa kiểm tra mã thư viện).
  - `OAUTH_ONLY` (mặc định `False`). Khi bật, trang đăng ký không hiển thị form thường, chỉ còn các nút đăng nhập mạng xã hội. View vẫn nhận POST; chỉ template bị ẩn.
- **Ai dùng được:** Người cài đặt site (sửa `local_settings.py`).
- **Mã nguồn:** `dmoj/settings.py:786`, `:836`, `judge/template_context.py:88`, `templates/registration/registration_form.html:158`, `templates/registration/registration_closed.html`; trang `registration_disallowed` (`dmoj/urls.py:48`).

### TK-04. Chặn nhà cung cấp email xấu và reCAPTCHA
- **Làm gì:** Giảm đăng ký rác.
- **Cách VNOJ làm:**
  - `BAD_MAIL_PROVIDERS`: danh sách tên miền email bị cấm (mặc định rỗng).
  - `BAD_MAIL_PROVIDER_REGEX`: danh sách regex tên miền bị cấm (mặc định rỗng).
  - Email trúng danh sách thì báo "Nhà cung cấp email của bạn không được phép do có lịch sử lạm dụng".
  - reCAPTCHA (ô "tôi không phải robot" của Google): chỉ bật khi cài gói `django-recaptcha2` và có setting `RECAPTCHA_PRIVATE_KEY`. Khi đó form đăng ký có thêm ô `captcha`.
- **Ai dùng được:** Áp dụng cho mọi người đăng ký. Người cài đặt cấu hình.
- **Mã nguồn:** `judge/views/register.py:23`, `:42-55`, `judge/utils/recaptcha.py`, `dmoj/settings.py:336-337`.

### TK-05. Đăng ký nhận bản tin (newsletter)
- **Làm gì:** Người dùng chọn nhận email về các kỳ thi sắp tới.
- **Cách VNOJ làm:**
  - Chỉ có khi app `newsletter` được cài và `DMOJ_NEWSLETTER_ID_ON_REGISTER` khác `None` (mặc định `None`).
  - Form đăng ký có ô "Đăng ký nhận bản tin?", mặc định tích sẵn.
  - Trang chỉnh sửa hồ sơ có ô "Thông báo cho tôi về các kỳ thi sắp tới" để bật/tắt sau này.
- **Ai dùng được:** Mọi người dùng.
- **Mã nguồn:** `judge/utils/subscription.py`, `judge/views/register.py:39-40`, `:105-106`, `judge/views/user.py:495-503`, `judge/forms.py:53-54`, `dmoj/settings.py:334`.

### TK-06. Đăng nhập và đăng xuất
- **Làm gì:** Đăng nhập bằng tên đăng nhập và mật khẩu. Đăng xuất bằng nút trong menu người dùng.
- **Cách VNOJ làm:**
  - Form có hai ô: tên đăng nhập và mật khẩu. Dưới form có link "Quên mật khẩu?" và các nút đăng nhập mạng xã hội (TK-12).
  - Người đã đăng nhập vào trang đăng nhập sẽ bị chuyển đi (`redirect_authenticated_user`).
  - Sau đăng nhập, mặc định chuyển tới `/user` (`LOGIN_REDIRECT_URL`), tức trang của chính mình.
  - Tài khoản bị khóa (TK-30): báo "Tài khoản này đã bị khóa. Lý do: …". Nếu lý do là gian lận, trang liệt kê các kỳ thi bị loại.
  - Khi đăng nhập lỗi, nếu có cấu hình `discord_invite_link` và `discord_invite_shieldio` (bảng `MiscConfig`), trang hiện link Discord để hỏi hỗ trợ.
  - Mỗi lần đăng nhập, mật khẩu được kiểm tra với cơ sở dữ liệu mật khẩu bị lộ (TK-07).
  - Đăng xuất chỉ nhận POST. GET vào `/accounts/logout/` chỉ hiển thị trang "Bạn đã đăng xuất".
  - Khi đang mạo danh người khác, nút đăng xuất được thay bằng "Dừng mạo danh" (xem 08).
  - Phiên đăng nhập lưu bằng `cached_db` (cache + cơ sở dữ liệu).
- **Ai dùng được:** Mọi người.
- **Mã nguồn:** `judge/views/user.py:154-174`, `:694-700`, `judge/forms.py:557-585`, `templates/registration/login.html`, `templates/base.html:343-353`, `dmoj/settings.py:520`, `:759`; trang `auth_login`, `auth_logout` (`dmoj/urls.py:52-53`).

### TK-07. Quy tắc mật khẩu và bắt đổi mật khẩu bị lộ
- **Làm gì:** Không cho đặt mật khẩu yếu. Bắt người có mật khẩu đã bị lộ phải đổi.
- **Cách VNOJ làm:**
  - Bốn quy tắc (`AUTH_PASSWORD_VALIDATORS`): không giống tên/email; đủ độ dài tối thiểu (mặc định Django 8 ký tự); không nằm trong cơ sở dữ liệu mật khẩu bị lộ; không toàn chữ số.
  - Kiểm tra mật khẩu bị lộ dùng dịch vụ Pwned Passwords (haveibeenpwned.com). Chỉ gửi 5 ký tự đầu của mã băm SHA-1, nên mật khẩu không bị gửi đi. Thời gian chờ 2 giây (`PWNED_PASSWORDS_API_TIMEOUT`).
  - Nếu dịch vụ lỗi, dùng danh sách mật khẩu phổ biến có sẵn của Django thay thế.
  - Khi đăng nhập, nếu mật khẩu nằm trong danh sách bị lộ, phiên được đánh dấu `password_pwned`. Middleware sau đó chuyển mọi trang về trang đổi mật khẩu, trừ trang 2FA, đăng xuất và file tĩnh. Trang đổi mật khẩu giải thích lý do.
  - Đổi mật khẩu xong thì bỏ đánh dấu.
  - Ở chế độ thi chính thức (TK-33) không bắt đổi.
- **Ai dùng được:** Áp dụng cho mọi người dùng.
- **Mã nguồn:** `dmoj/settings.py:502-515`, `judge/utils/pwned.py:49-112`, `judge/views/user.py:165-182`, `judge/middleware.py:65-70`, `templates/registration/password_change_form.html:6-8`.

### TK-08. Đổi mật khẩu và quên mật khẩu
- **Làm gì:** Người dùng đổi mật khẩu khi đã đăng nhập, hoặc nhận email đặt lại mật khẩu khi quên.
- **Cách VNOJ làm:**
  - Đổi mật khẩu: form chuẩn của Django (mật khẩu cũ, mật khẩu mới hai lần). Có trang báo thành công.
  - Quên mật khẩu: nhập email, hệ thống gửi email (bản HTML và bản chữ) có link đặt lại. Gửi từ `SERVER_EMAIL`.
  - Link đặt lại có dạng `/accounts/password/reset/confirm/<uidb64>-<token>/`. Hạn của token theo mặc định Django (chưa kiểm tra giá trị cụ thể trong cấu hình).
  - Giới hạn số lần yêu cầu theo IP: tối đa `DMOJ_PASSWORD_RESET_LIMIT_COUNT` = 10 lần trong `DMOJ_PASSWORD_RESET_LIMIT_WINDOW` = 3600 giây. Vượt quá thì trả lỗi 429 "Bạn đã gửi quá nhiều yêu cầu".
  - Email có thể chèn nội dung từ `MiscConfig` (`misc_config`).
- **Ai dùng được:** Đổi mật khẩu: người đã đăng nhập. Quên mật khẩu: bất kỳ ai.
- **Mã nguồn:** `judge/views/user.py:177-182`, `:703-721`, `dmoj/urls.py:54-72`, `dmoj/settings.py:300-301`; trang `password_change`, `password_change_done`, `password_reset`, `password_reset_done`, `password_reset_confirm`, `password_reset_complete`.

### TK-09. Xác thực hai lớp bằng TOTP và mã dự phòng
- **Làm gì:** Sau khi nhập mật khẩu, người dùng phải nhập thêm mã TOTP (mã 6 số đổi mỗi 30 giây trên ứng dụng điện thoại như Google Authenticator). Khi mất điện thoại, dùng mã dự phòng (scratch code — mã dùng một lần).
- **Cách VNOJ làm:**
  - Bật (`enable_2fa`): server tạo khóa bí mật Base32 dài 32 ký tự, giữ trong phiên. Trang hiện mã QR và khóa để nhập tay. Người dùng nhập mã 6 số để xác nhận. Đúng thì lưu khóa và bật `is_totp_enabled`.
  - Khi bật lần đầu, hệ thống tạo sẵn `DMOJ_SCRATCH_CODES_COUNT` = 5 mã dự phòng, mỗi mã 16 ký tự Base32. Mã chỉ hiện một lần trên trang bật 2FA.
  - Nếu bật `DMOJ_2FA_HARDCORE` (mặc định `False`), trang bật 2FA cảnh báo quản trị viên sẽ không khôi phục tài khoản nếu mất thiết bị và mã dự phòng.
  - Làm mới (`refresh_2fa`): tạo khóa mới thay khóa cũ, quy trình giống lúc bật. Không hiện lại mã dự phòng.
  - Tắt (`disable_2fa`): phải nhập mã TOTP hoặc mã dự phòng trước. Tắt xong thì xóa khóa và xóa toàn bộ mã dự phòng.
  - Tạo lại mã dự phòng (`generate_scratch_codes`): nút trên trang chỉnh sửa hồ sơ. Mã cũ mất hiệu lực. Mã mới chỉ hiện một lần, có nút sao chép.
  - Khi đăng nhập (`login_2fa`): middleware chặn mọi trang và chuyển về trang 2FA cho tới khi qua bước này (trừ trang đăng xuất, trang WebAuthn và file tĩnh). Qua rồi thì phiên được đánh dấu `2fa_passed`.
  - Ô nhập nhận cả mã 6 số và mã dự phòng 16 ký tự; độ dài khác thì báo lỗi. Mã dự phòng dùng xong bị xóa khỏi danh sách.
  - Sai lệch thời gian cho phép: `DMOJ_TOTP_TOLERANCE_HALF_MINUTES` = 1 bước (30 giây) trước và sau.
  - Chống dùng lại mã: lưu `last_totp_timecode`. Mã thuộc bước thời gian đã dùng thì không được dùng lại.
  - Khóa TOTP và mã dự phòng được mã hóa trong cơ sở dữ liệu (`EncryptedCharField`).
  - Trang 2FA có lời nhắn liên hệ qua Discord nếu mất thiết bị (khi có cấu hình).
- **Ai dùng được:** Mọi người dùng đã đăng nhập. Xem và sửa khóa TOTP, mã dự phòng trong trang quản trị cần quyền `judge.totp` (xem 08).
- **Mã nguồn:** `judge/views/two_factor.py:27-131`, `:229-261`, `judge/forms.py:31-49`, `:599-687`, `judge/models/profile.py:286-301`, `:460-466`, `:490-499`, `judge/views/user.py:570-577`, `judge/middleware.py:55-64`, `dmoj/settings.py:39-41`, `:259-260`, `templates/registration/totp_enable.html`, `templates/registration/two_factor_auth.html`; trang `enable_2fa`, `refresh_2fa`, `disable_2fa`, `login_2fa`, `generate_scratch_codes`.

### TK-10. Xác thực hai lớp bằng khóa bảo mật (WebAuthn)
- **Làm gì:** Dùng khóa bảo mật phần cứng (USB key) hoặc vân tay/Face ID của thiết bị làm lớp xác thực thứ hai. WebAuthn là chuẩn trình duyệt cho việc này.
- **Cách VNOJ làm:**
  - Chỉ bật khi đặt `WEBAUTHN_RP_ID` (tên miền của site, mặc định `None`). Nếu không đặt, các URL WebAuthn trả 404 và phần "Khóa bảo mật" bị ẩn.
  - Thêm khóa: trên trang chỉnh sửa hồ sơ, nhập tên khóa (tối đa 100 ký tự) rồi bấm "Thêm". Server tạo thử thách ngẫu nhiên 32 byte. Không yêu cầu xác minh người dùng (`user_verification='discouraged'`), không yêu cầu chứng thực thiết bị (`attestation='none'`). Không cho đăng ký trùng khóa đã có.
  - Mỗi người có thể có nhiều khóa. Lưu tên, ID khóa, khóa công khai và bộ đếm chữ ký.
  - Thêm khóa đầu tiên thì bật `is_webauthn_enabled`. Xóa khóa cuối cùng thì tự tắt cờ này (qua signal).
  - Khi đăng nhập, trang 2FA có nút "Dùng khóa bảo mật". Server kiểm chữ ký và cập nhật bộ đếm.
  - Origin kiểm tra luôn là `https://<host>`, nên chỉ chạy được qua HTTPS.
- **Ai dùng được:** Mọi người dùng đã đăng nhập.
- **Mã nguồn:** `judge/views/two_factor.py:134-226`, `judge/forms.py:632-672`, `judge/models/profile.py:566-594`, `judge/signals.py:76-81`, `templates/user/edit-profile.html:427-450`; trang `webauthn_attest`, `webauthn_assert`, `webauthn_delete`.

### TK-11. Quy định 2FA cho staff
- **Làm gì:** Không cho nhân viên quản trị tắt 2FA.
- **Cách VNOJ làm:**
  - Cờ `DMOJ_REQUIRE_STAFF_2FA` (mặc định `True`).
  - Khi bật: người có `is_staff` không tắt được TOTP nếu không có khóa WebAuthn. Không xóa được khóa WebAuthn cuối cùng nếu không bật TOTP. Nút "Tắt" hiện cảnh báo thay vì làm.
  - Cờ này không ép staff phải bật 2FA từ đầu. Mã chỉ chặn việc tắt.
- **Ai dùng được:** Áp dụng cho tài khoản `is_staff`.
- **Mã nguồn:** `dmoj/settings.py:39`, `judge/views/two_factor.py:121-124`, `:221-223`, `templates/user/edit-profile.html:102`, `:386-390`.

### TK-12. Đăng nhập bằng Google, Facebook, GitHub
- **Làm gì:** Đăng ký hoặc đăng nhập bằng tài khoản Google, Facebook hoặc GitHub.
- **Cách VNOJ làm:**
  - Dùng `social-auth-core` 4.3.0 và `social-auth-app-django` 5.0.0.
  - Mỗi nhà cung cấp chỉ hiện nút khi có cả `SOCIAL_AUTH_<TÊN>_KEY` và `SOCIAL_AUTH_<TÊN>_SECRET` (`GOOGLE_OAUTH2`, `FACEBOOK`, `GITHUB_SECURE`).
  - GitHub dùng backend riêng `github-secure`: chỉ lấy email đã xác minh, ưu tiên email chính. Phạm vi xin quyền `user:email`. Facebook xin quyền `email`.
  - Các bước khi đăng nhập (`SOCIAL_AUTH_PIPELINE`):
    1. Bắt buộc nhà cung cấp trả về email. Không có email thì báo lỗi.
    2. Nếu tài khoản mạng xã hội đã gắn với một người dùng, đăng nhập luôn.
    3. Nếu chưa, tìm người dùng có cùng email và tự gắn vào (`associate_by_email`).
    4. Nếu vẫn chưa có, hiện trang "Thiết lập tài khoản": người dùng chọn tên đăng nhập (gợi ý sẵn, đã bỏ ký tự lạ, `-` đổi thành `_`) và đặt mật khẩu hai lần. Tên đăng nhập trùng thì báo lỗi.
    5. Tạo `User`, đặt mật khẩu, tạo `Profile` với ngôn ngữ mặc định.
    6. Hiện trang "Tạo hồ sơ" dùng chính form chỉnh sửa hồ sơ (TK-16) để điền múi giờ, ngôn ngữ, giới thiệu…
  - Họ tên (`first_name`, `last_name`) không bị ghi đè bởi dữ liệu từ nhà cung cấp (`SOCIAL_AUTH_PROTECTED_USER_FIELDS`).
  - Lỗi trong quá trình đăng nhập chuyển về trang `social_auth_error` kèm thông báo.
  - Dữ liệu nhà cung cấp trả về được ghi vào logger `judge.social_auth`.
  - Trang đăng ký luôn ghi tiêu đề "Sign up with Gmail" dù có nhà cung cấp nào.
  - Tài khoản tạo qua mạng xã hội không cần kích hoạt email (chưa kiểm tra mã thư viện).
- **Ai dùng được:** Mọi người, khi người cài đặt đã cấu hình khóa.
- **Mã nguồn:** `judge/social_auth.py:25-127`, `judge/forms.py:539-554`, `dmoj/settings.py:778-809`, `templates/registration/oauth.html`, `templates/registration/username_select.html`, `templates/registration/profile_creation.html`; trang `social:begin` (`dmoj/urls.py:108`), `social_auth_error` (`dmoj/urls.py:73`).

### TK-13. Đăng nhập tự động theo địa chỉ IP
- **Làm gì:** Mỗi máy trong phòng thi gắn với một tài khoản. Ai ngồi máy đó mở site là tự động đăng nhập đúng tài khoản, không cần mật khẩu.
- **Cách VNOJ làm:**
  - Trường `Profile.ip_auth`: một địa chỉ IP, duy nhất trên toàn hệ thống. Chỉ đặt được trong trang quản trị.
  - Backend `IPBasedAuthBackend` tìm hồ sơ theo IP. Tài khoản bị khóa (`is_active=False`) thì không đăng nhập.
  - Middleware `IPBasedAuthMiddleware` đọc IP từ header `IP_BASED_AUTHENTICATION_HEADER` (mặc định `REMOTE_ADDR`):
    - Không có header: đăng xuất phiên nào được tạo bằng IP.
    - IP khớp với `ip_auth` của người đang đăng nhập: giữ nguyên.
    - IP không khớp: đăng xuất phiên IP rồi đăng nhập tài khoản gắn với IP mới (nếu có).
  - Middleware này không có trong `MIDDLEWARE` mặc định. Người cài đặt phải tự thêm. Backend thì có sẵn trong `AUTHENTICATION_BACKENDS`.
- **Ai dùng được:** Quản trị viên gán IP (xem 08). Người dùng ở máy được gán.
- **Mã nguồn:** `judge/ip_auth.py:6-13`, `judge/middleware.py:76-116`, `judge/models/profile.py:264-265`, `dmoj/settings.py:475-495`, `:778-784`, `:811`.

### TK-14. API token cá nhân
- **Làm gì:** Người dùng tạo một mã bí mật để chương trình bên ngoài gọi site thay mình, gửi trong header `Authorization: Bearer <token>`.
- **Cách VNOJ làm:**
  - Token dài 48 ký tự, mã hóa base64 an toàn cho URL. Bên trong chứa ID người dùng và 32 byte ngẫu nhiên.
  - Cơ sở dữ liệu chỉ lưu HMAC-SHA256 của phần bí mật (64 ký tự hex), không lưu token gốc. Token chỉ hiện một lần lúc tạo.
  - Tạo lại thì token cũ mất hiệu lực. Có nút xóa token.
  - Token bỏ qua 2FA (middleware đánh dấu `2fa_passed`). Token không vào được trang quản trị (trả 403). Request dùng token được miễn kiểm tra CSRF.
  - Header sai định dạng trả 400. Token sai hoặc người dùng chưa tạo token trả 401.
  - Đường dẫn `/o/` (OAuth2, TK-15) bỏ qua middleware này.
  - Mỗi lần tạo/xóa được ghi lịch sử phiên bản (`django-reversion`).
  - Trang chỉnh sửa hồ sơ có mã JavaScript cho nút tạo/xóa token, nhưng template hiện tại không có phần HTML chứa các nút này (`#api-token-td`, `#generate-api-token-button`). Người dùng không thấy nút trên giao diện. Vẫn gọi được trực tiếp bằng POST, hoặc dùng lệnh `generate_api_token` (TK-34).
- **Ai dùng được:** Người dùng đã đăng nhập (POST).
- **Mã nguồn:** `judge/models/profile.py:302-305`, `:451-456`, `judge/views/user.py:534-567`, `judge/middleware.py:148-186`, `templates/user/edit-profile.html:106-146`, `judge/management/commands/generate_api_token.py`; trang `generate_api_token`, `remove_api_token` (`dmoj/urls.py:84-85`).

### TK-15. VNOJ làm nhà cung cấp OAuth2 / OpenID
- **Làm gì:** Các trang web khác có thể cho người dùng "Đăng nhập bằng tài khoản VNOJ".
- **Cách VNOJ làm:**
  - Dùng `django-oauth-toolkit`, gắn ở đường dẫn `/o/`.
  - Phạm vi: `openid`, `profile`, `email`. Không bắt buộc PKCE.
  - Thông tin trả cho ứng dụng bên ngoài: email, họ tên (`given_name`), tên đăng nhập (`preferred_username`), và danh sách toàn bộ quyền Django của người dùng (`permissions`).
  - OpenID Connect mặc định tắt (các dòng cấu hình bị comment).
  - Việc đăng ký ứng dụng khách làm trong trang quản trị (chưa kiểm tra).
- **Ai dùng được:** Ứng dụng bên ngoài được quản trị viên đăng ký. Người dùng đồng ý cấp quyền.
- **Mã nguồn:** `dmoj/urls.py:109`, `judge/oauth_validator.py:4-16`, `dmoj/settings.py:839-850`.

### TK-16. Trang chỉnh sửa hồ sơ
- **Làm gì:** Người dùng sửa thông tin cá nhân và các tùy chọn của mình trên một trang.
- **Cách VNOJ làm:**
  - Các ô có trên trang:
    - Họ tên (`first_name`), tối đa 30 ký tự.
    - Huy hiệu hiển thị (`display_badge`): chỉ chọn trong các huy hiệu mình đã được trao. Không có huy hiệu nào thì ẩn ô.
    - Tự giới thiệu (`about`): trình soạn Markdown có xem trước (`profile_preview`).
    - Múi giờ, ngôn ngữ lập trình, giao diện trang, giao diện trình soạn code (TK-17, TK-18).
    - Công cụ hiển thị công thức, chỉ khi đặt `MATHOID_URL` (TK-19).
    - Tổ chức (xem 07). Bỏ tích một tổ chức thì hỏi xác nhận rời tổ chức.
    - Nhận bản tin (TK-05), bật tính năng thử nghiệm (TK-19).
  - Các link: đổi ảnh đại diện (sang gravatar.com), đổi mật khẩu, tải dữ liệu (nếu bật, TK-31).
  - Khu bảo mật: bật/tắt/làm mới TOTP, tạo mã dự phòng, danh sách khóa WebAuthn (TK-09, TK-10).
  - Hạn chế:
    - Người bị mute (TK-29) không vào được trang này (403, "Your part is silent, little toad.").
    - Người chưa giải đủ `VNOJ_INTERACT_MIN_PROBLEM_COUNT` = 5 bài không được đổi phần tự giới thiệu.
    - Ở chế độ thi chính thức (TK-33), ẩn ô họ tên, tự giới thiệu, huy hiệu, tổ chức.
  - Lưu xong được ghi lịch sử phiên bản ("Updated on site").
  - Phần tự giới thiệu trên trang người dùng được cache 86400 giây (1 ngày). Lưu hồ sơ thì xóa cache này.
  - Trang này không chạy user script (`ignore_user_script`) để người dùng sửa được script hỏng.
- **Ai dùng được:** Người dùng đã đăng nhập, chỉ sửa hồ sơ của chính mình.
- **Mã nguồn:** `judge/views/user.py:481-531`, `judge/forms.py:52-133`, `judge/signals.py:67-73`, `templates/user/edit-profile.html:272-450`; trang `user_edit_profile` (`dmoj/urls.py:192`), `profile_preview` (`dmoj/urls.py:387`).

### TK-17. Múi giờ và ngôn ngữ lập trình mặc định
- **Làm gì:** Mọi thời gian trên site hiển thị theo múi giờ của người dùng. Trang nộp bài chọn sẵn ngôn ngữ ưa thích.
- **Cách VNOJ làm:**
  - `Profile.timezone`: mặc định `DEFAULT_USER_TIME_ZONE` = `America/Toronto`. Middleware `TimezoneMiddleware` đặt múi giờ cho mỗi request theo hồ sơ. Khách dùng múi giờ mặc định.
  - `Profile.language`: ngôn ngữ ưa thích. Mặc định là ngôn ngữ mặc định của hệ thống. Nếu ngôn ngữ bị xóa thì quay về mặc định (`SET_DEFAULT`).
  - Trang nộp bài chọn sẵn ngôn ngữ này. Nếu đang nộp lại một bài cũ thì dùng ngôn ngữ của bài cũ.
  - Ngôn ngữ giao diện (tiếng Anh/tiếng Việt) không lưu trong hồ sơ. Nó đi qua `set_language` của Django.
- **Ai dùng được:** Mọi người dùng.
- **Mã nguồn:** `judge/models/profile.py:251-254`, `judge/timezone.py:8-20`, `judge/views/problem.py:274-281`, `dmoj/settings.py:754`.

### TK-18. Giao diện sáng/tối và giao diện trình soạn code
- **Làm gì:** Người dùng chọn giao diện sáng, tối hoặc theo hệ điều hành. Chọn màu cho trình soạn code.
- **Cách VNOJ làm:**
  - `Profile.site_theme`: `auto` (theo hệ thống), `light`, `dark`. Mặc định `light`. File CSS theo `DMOJ_THEME_CSS` (`style.css`, `dark/style.css`).
  - Nút đổi nhanh ở chân trang (`set_theme`, POST): đảo sáng ↔ tối. Người đã đăng nhập thì lưu vào hồ sơ. Khách thì lưu vào cookie `site_theme` trong 1 năm. Giá trị lạ thì về `light`. Sau đó chuyển về trang `next`.
  - `Profile.ace_theme`: giao diện trình soạn code Ace. 32 lựa chọn (ví dụ Monokai, Github, Twilight…) cùng `auto` (theo giao diện trang, mặc định).
  - Khi `auto`: giao diện sáng dùng `github`, tối dùng `twilight` (`DMOJ_THEME_DEFAULT_ACE_THEME`). Người không có quyền `judge.test_site` luôn nhận `github` khi để `auto`.
- **Ai dùng được:** Mọi người. Khách chỉ đổi được giao diện trang.
- **Mã nguồn:** `judge/models/choices.py:23-57`, `:69-73`, `judge/models/profile.py:260-261`, `:370-379`, `judge/views/user.py:544-555`, `judge/template_context.py:112-126`, `templates/base.html:209-216`, `:441-445`, `dmoj/settings.py:303-317`; trang `set_theme` (`dmoj/urls.py:193`).

### TK-19. Cách hiển thị công thức toán và tính năng thử nghiệm
- **Làm gì:** Người dùng chọn cách site vẽ công thức toán. Người dùng tự bật các tính năng đang thử nghiệm.
- **Cách VNOJ làm:**
  - `Profile.math_engine`: `tex` (để nguyên LaTeX), `svg`, `mml` (MathML), `jax` (MathJax, dự phòng SVG), `auto`. Mặc định `MATHOID_DEFAULT_TYPE` = `auto`.
  - `auto`: dùng MathML nếu có máy chủ Mathoid và trình duyệt hỗ trợ MathML, ngược lại dùng MathJax.
  - Ô chọn chỉ hiện khi đặt `MATHOID_URL`.
  - Ô "Bật tính năng thử nghiệm" gán hoặc gỡ quyền `judge.test_site` cho chính người dùng. Trong mã đọc được, quyền này chỉ ảnh hưởng việc chọn giao diện trình soạn code khi để `auto` (TK-18).
- **Ai dùng được:** Mọi người dùng.
- **Mã nguồn:** `judge/models/choices.py:59-67`, `judge/models/profile.py:283-285`, `judge/template_context.py:129-139`, `judge/views/user.py:505-509`, `judge/forms.py:55`, `:77-80`.

### TK-20. Script tùy biến của người dùng (user script)
- **Làm gì:** Người dùng viết JavaScript riêng để tùy biến site cho mình. Script chạy trên mọi trang khi họ đăng nhập.
- **Cách VNOJ làm:**
  - `Profile.user_script`: tối đa 65536 ký tự.
  - Chèn vào cuối `base.html`. Không chạy khi đang mạo danh, đang ở bước 2FA, hoặc ở trang chỉnh sửa hồ sơ.
  - Trường có trong `ProfileForm` và trang có mã khởi tạo trình soạn Ace cho nó, nhưng template không hiển thị ô nhập. Thực tế chỉ sửa được trong trang quản trị hồ sơ (xem 08).
- **Ai dùng được:** Người dùng (theo thiết kế). Hiện chỉ quản trị viên có quyền `judge.change_profile` sửa được.
- **Mã nguồn:** `judge/models/profile.py:279-280`, `templates/base.html:199-200`, `judge/forms.py:59-60`, `templates/user/edit-profile.html:98`, `judge/admin/profile.py:62-64`, `:148-155`.

### TK-21. Ảnh đại diện Gravatar và huy hiệu
- **Làm gì:** Mỗi người có ảnh đại diện lấy từ Gravatar theo email. Người dùng được trao huy hiệu và chọn một huy hiệu hiển thị cạnh tên.
- **Cách VNOJ làm:**
  - Ảnh đại diện: URL Gravatar từ MD5 của email. Không có ảnh thì dùng hình `identicon` sinh tự động. Site không lưu ảnh.
  - Người bị mute luôn hiện hình `identicon` mặc định (tham số `f=y`).
  - Ở chế độ thi chính thức, mọi ảnh đại diện thay bằng biểu tượng của site để không gọi ra ngoài.
  - Huy hiệu (`Badge`): tên, URL ảnh nhỏ (`mini`), URL ảnh lớn (`full_size`). Quản trị viên tạo và trao (`Profile.badges`).
  - Người dùng chọn `display_badge` trong số huy hiệu được trao. Ảnh nhỏ hiện cạnh tên ở những nơi có tải sẵn huy hiệu (ví dụ bảng xếp hạng).
  - Tab Giới thiệu hiện tất cả huy hiệu bằng ảnh lớn, mục "Huy hiệu & Giải thưởng".
- **Ai dùng được:** Mọi người xem. Quản trị viên trao huy hiệu.
- **Mã nguồn:** `judge/jinja2/gravatar.py:13-31`, `judge/models/profile.py:239-246`, `:266-267`, `judge/jinja2/reference.py:146-165`, `templates/user/user-about.html:48-56`, `templates/user/edit-profile.html:366`.

### TK-22. Trang người dùng: thanh bên và tab Giới thiệu
- **Làm gì:** Trang công khai của mỗi người dùng tại `/user/<tên>`. `/user` (không tên) là trang của chính mình.
- **Cách VNOJ làm:**
  - Thanh bên:
    - Ảnh đại diện 135 px.
    - Email: chỉ chủ tài khoản và superuser thấy.
    - Số bài đã giải.
    - Hạng theo điểm (không hiện nếu bị ẩn khỏi xếp hạng).
    - Tổng điểm và điểm đóng góp (cách tính xem 05).
    - Link "Xem bài nộp".
    - Nếu đã thi có rating: số kỳ thi, hạng theo rating, rating hiện tại, thấp nhất, cao nhất (xem 04).
  - Tab Giới thiệu:
    - Dòng "Đến từ" liệt kê các tổ chức công khai (xem 07).
    - Ghi chú nội bộ (`notes`): chỉ người có `judge.change_profile` thấy.
    - Phần tự giới thiệu (Markdown). Trống thì hiện "Người dùng chưa chia sẻ thông tin".
    - Huy hiệu (TK-21).
    - Bản đồ nhiệt hoạt động nộp bài theo ngày, xem theo từng năm. Khi bật `VNOJ_LOW_POWER_MODE` và người dùng có hơn 20 000 bài nộp thì không vẽ.
    - Ngày trên bản đồ nhiệt tính theo `DEFAULT_USER_TIME_ZONE`. Mã có ý lấy múi giờ người xem, nhưng dùng `or` nên thực tế luôn ra giá trị mặc định.
    - Biểu đồ lịch sử rating (xem 04).
  - Tiêu đề trang: "Tài khoản của tôi" nếu xem chính mình, ngược lại "Người dùng <tên hiển thị>".
  - Tên không tồn tại: trang 404 "Không có người dùng <tên>".
- **Ai dùng được:** Mọi người, kể cả khách. `/user` không tên cần đăng nhập.
- **Mã nguồn:** `judge/views/user.py:89-151`, `:188-225`, `templates/user/user-base.html`, `templates/user/user-about.html`, `dmoj/settings.py:177-183`; trang `user_page` (`dmoj/urls.py:191`, `:197`).

### TK-23. Trang người dùng: tab Thống kê
- **Làm gì:** Liệt kê các bài người dùng đã có điểm, chia theo nhóm bài, và bảng phân tích điểm.
- **Cách VNOJ làm:**
  - Bảng "Phân tích điểm": 10 dòng đầu, có nút "Tải thêm" gọi AJAX (`user_pp_ajax`). Cách tính điểm xem 05.
  - "Bài đã ra đề": các bài công khai, không thuộc riêng tổ chức, mà người này là tác giả.
  - Danh sách bài có điểm > 0 (chỉ bài công khai, không riêng tổ chức), nhóm theo nhóm bài. Mỗi dòng: tên bài, điểm đạt / điểm tối đa, link tới bài nộp của người đó cho bài này. Mỗi nhóm có tổng điểm.
  - Người xem đã đăng nhập (khác chủ trang) có ô "Ẩn bài tôi đã giải" (`hide_solved=1`). Nếu đang trong kỳ thi thì "đã giải" tính theo kỳ thi.
- **Ai dùng được:** Mọi người.
- **Mã nguồn:** `judge/views/user.py:331-385`, `templates/user/user-problems.html`; trang `user_problems`, `user_pp_ajax` (`dmoj/urls.py:203-204`).

### TK-24. Trang người dùng: các tab còn lại
- **Làm gì:** Các tab phụ trên trang người dùng, tùy quyền người xem.
- **Cách VNOJ làm:**
  - "Tạo bài blog mới": chỉ chủ trang thấy, ẩn ở chế độ thi chính thức (xem 06).
  - "Blog": bài blog của người này (xem 06). Ẩn ở chế độ thi chính thức.
  - "Bình luận": các bình luận của người này, 10 mục mỗi trang. Chỉ người có `judge.view_all_user_comment` thấy. Người có `judge.change_comment` có thể ẩn hàng loạt bình luận (xem 06).
  - "Mạo danh": superuser, với người không phải superuser (xem 08).
  - "Khóa / Mở khóa người dùng" (TK-30).
  - "Admin User" (cần `auth.change_user`) và "Admin Profile" (cần `judge.change_profile`): link vào trang quản trị (xem 08).
  - "Chỉnh sửa hồ sơ": chỉ chủ trang.
- **Ai dùng được:** Theo quyền ghi ở từng tab.
- **Mã nguồn:** `templates/user/user-tabs.html`, `judge/views/user.py:267-328`; trang `user_blog`, `user_comment` (`dmoj/urls.py:200-201`).

### TK-25. Bảng xếp hạng người dùng
- **Làm gì:** Danh sách tất cả người dùng, xếp theo rating hoặc điểm.
- **Cách VNOJ làm:**
  - 100 người mỗi trang. Bỏ qua người bị ẩn (`is_unlisted`).
  - Cột: hạng, rating, tên (kèm huy hiệu, họ tên, các tổ chức công khai), điểm, số bài đã giải.
  - Sắp xếp được theo `rating` (mặc định, giảm dần), `performance_points`, `problem_count`, `points`. Bấm tiêu đề cột để đổi chiều. Bằng nhau thì xếp theo ID.
  - Số hạng hiển thị luôn tính theo (điểm, số bài), bất kể đang sắp theo cột nào. Người bằng nhau cùng hạng.
  - URL cũ `/users/<page>` chuyển hướng vĩnh viễn sang `?page=`.
  - Tab trên cùng: Bảng xếp hạng, Người đóng góp, Tổ chức.
- **Ai dùng được:** Mọi người.
- **Mã nguồn:** `judge/views/user.py:580-612`, `:657-658`, `templates/user/list.html`, `templates/user/users-table.html`, `templates/user/base-users-table.html`, `templates/user/user-list-tabs.html`; trang `user_list` (`dmoj/urls.py:184-188`).

### TK-26. Danh sách người đóng góp
- **Làm gì:** Xếp hạng người dùng theo điểm đóng góp (bình luận, blog, ticket hữu ích).
- **Cách VNOJ làm:**
  - 100 người mỗi trang, sắp theo `contribution_points` giảm dần. Bỏ qua người bị ẩn.
  - Cột: hạng, tên, điểm đóng góp. Cách tính điểm đóng góp xem 05.
  - Có ô tìm theo tên giống bảng xếp hạng (TK-27).
- **Ai dùng được:** Mọi người.
- **Mã nguồn:** `judge/views/user.py:615-647`, `:679-691`, `templates/user/contrib-list.html`, `templates/user/contrib-table.html`; trang `contributors_list`, `user_contributor_redirect` (`dmoj/urls.py:275-280`).

### TK-27. Tìm người dùng
- **Làm gì:** Gõ tên để tìm người dùng, và nhảy tới vị trí của họ trong bảng xếp hạng.
- **Cách VNOJ làm:**
  - Ô tìm dùng select2 (ô chọn có gợi ý khi gõ) gọi `user_search_select2_ajax`:
    - Tìm tên đăng nhập chứa chuỗi gõ vào, không phân biệt hoa thường. Nếu chuỗi kết thúc bằng dấu cách thì tìm đúng tên.
    - Bỏ người bị ẩn. 20 kết quả mỗi lần, cuộn để tải thêm.
    - Mỗi kết quả trả tên hiển thị, ảnh Gravatar, cấp bậc hiển thị. Trình duyệt được cache 300 giây.
  - Chọn một người thì gọi `user_ranking_redirect?handle=<tên>`: tính trang chứa người đó theo rating rồi chuyển tới `?page=N#!<tên>`. Dòng của người đó được tô sáng.
  - Có thêm `profile_select2` dùng trong các form khác (chọn người dùng theo tên, hỗ trợ dán nhiều tên một lúc qua `multiple_terms[]`).
- **Ai dùng được:** Mọi người.
- **Mã nguồn:** `judge/views/select2.py:15-21`, `:30-36`, `:62-82`, `:185-213`, `judge/views/user.py:661-676`, `templates/user/base-users.html:13-59`; trang `user_search_select2_ajax` (`dmoj/urls.py:373`), `profile_select2` (`dmoj/urls.py:436`), `user_ranking_redirect` (`dmoj/urls.py:188`).

### TK-28. Các trường hồ sơ chỉ quản trị viên đặt
- **Làm gì:** Một số thuộc tính của người dùng chỉ quản trị viên đổi được, để phân loại và quản lý.
- **Cách VNOJ làm:**
  - `display_rank` (cấp bậc hiển thị): `user` (mặc định), `setter`, `daor` (Bedao Team), `staff`, `banned`, `admin`, `teacher`. Dùng làm lớp CSS cho tên người dùng (màu/kiểu chữ). Khi bật `DMOJ_RATING_COLORS` (mặc định `True`), tên còn mang lớp màu theo rating (xem 04).
  - `username_display_override` (tên hiển thị thay thế), tối đa 100 ký tự: hiện thay tên đăng nhập ở link người dùng, tiêu đề trang, kết quả tìm kiếm.
  - `is_unlisted` (ẩn khỏi xếp hạng): không xuất hiện ở bảng xếp hạng, người đóng góp, ô tìm người dùng, bảng xếp hạng bài nộp của bài. Thanh bên không hiện hạng.
  - `notes` (ghi chú nội bộ): chỉ người có `judge.change_profile` thấy trên trang người dùng.
  - `ip_auth` (TK-13), `mute` (TK-29), `ban_reason` (TK-30), `user_script` (TK-20), `badges` (TK-21), `vnoj_points` (số nguyên; không thấy chỗ nào dùng ngoài trang quản trị), `current_contest`.
  - Mọi thay đổi hồ sơ được lưu lịch sử phiên bản, trừ `points`, `last_access`, `ip`, `rating`.
  - Trang quản trị hồ sơ xem 08.
- **Ai dùng được:** Người có `judge.change_profile` (xem 08).
- **Mã nguồn:** `judge/models/profile.py:270-277`, `:306-310`, `:351-353`, `:531-539`, `dmoj/settings.py:101-109`, `judge/admin/profile.py:59-64`, `judge/models/__init__.py:19`, `judge/views/ranked_submission.py:43`.

### TK-29. Cấm phát ngôn (mute) và hạn chế người dùng mới
- **Làm gì:** Chặn một người bình luận, viết blog, gửi ticket. Người mới chưa giải đủ bài cũng bị giới hạn tương tác.
- **Cách VNOJ làm:**
  - Cờ `Profile.mute` ("Một số người tốt nhất khi im lặng"). Người bị mute:
    - Không bình luận, không vote bình luận/blog, không sửa bình luận, không gửi ticket. Thông báo "Your part is silent, little toad." kèm lý do nếu có `ban_reason`.
    - Không vào trang chỉnh sửa hồ sơ.
    - Không tải dữ liệu cá nhân (404).
    - Ảnh đại diện bị thay bằng hình mặc định.
  - Người dùng mới (`is_new_user`): không phải staff và đã giải ít hơn `VNOJ_INTERACT_MIN_PROBLEM_COUNT` = 5 bài. Không bình luận, không vote, không đổi tự giới thiệu. Viết blog cần `VNOJ_BLOG_MIN_PROBLEM_COUNT` = 10 bài (xem 06).
- **Ai dùng được:** Quản trị viên bật `mute` trong trang quản trị (xem 08).
- **Mã nguồn:** `judge/models/profile.py:272-273`, `:355-361`, `judge/comments.py:62-68`, `judge/views/comment.py:38-48`, `:158`, `judge/views/blog.py:43-50`, `judge/views/ticket.py:53-55`, `judge/views/user.py:394`, `:483-484`, `dmoj/settings.py:127-129`.

### TK-30. Khóa và mở khóa tài khoản (ban/unban)
- **Làm gì:** Quản trị viên khóa một tài khoản kèm lý do. Người bị khóa không đăng nhập được và thấy lý do.
- **Cách VNOJ làm:**
  - Trang khóa (`user_ban`) chỉ có một ô: lý do khóa (bắt buộc). Trang mở khóa (`user_unban`) chỉ có nút xác nhận.
  - Khóa làm bốn việc: lưu `ban_reason`, đặt `display_rank='banned'`, đặt `is_unlisted=True`, đặt `User.is_active=False`.
  - Mở khóa: xóa `ban_reason`, trả `display_rank` về `user`, `is_unlisted=False`, `is_active=True`. Cấp bậc và trạng thái ẩn trước đó không được khôi phục.
  - Một người được coi là "bị khóa" khi `is_active=False` và có `ban_reason`.
  - Người bị khóa đăng nhập thì thấy "Tài khoản này đã bị khóa. Lý do: …".
  - Không khóa được chính mình hoặc superuser.
  - Mỗi lần khóa/mở khóa ghi lịch sử phiên bản ("Banned by …", "Unbanned by …").
  - Tự động khóa vì gian lận:
    - Bật bằng `VNOJ_SHOULD_BAN_FOR_CHEATING_IN_CONTESTS` (mặc định `False`).
    - Khi một người bị loại (disqualify) ở đủ `VNOJ_MAX_DISQUALIFICATIONS_BEFORE_BANNING` = 3 kỳ thi công khai (không riêng tổ chức), tài khoản tự bị khóa với lý do `VNOJ_CONTEST_CHEATING_BAN_MESSAGE`.
    - Chỉ đếm kỳ thi bắt đầu từ `VNOJ_BAN_COUNT_FROM_DATE` (mặc định 01/01/2026 UTC; `None` là đếm hết).
    - Nếu số lần bị loại giảm xuống dưới ngưỡng và lý do khóa đúng là thông điệp gian lận, tài khoản tự mở khóa.
    - Trang đăng nhập liệt kê các kỳ thi bị loại cho người bị khóa vì lý do này.
- **Ai dùng được:** Người có quyền `judge.ban_user`.
- **Mã nguồn:** `judge/models/profile.py:363-368`, `:503-523`, `judge/views/user.py:228-264`, `judge/forms.py:573-589`, `judge/models/contest.py:668-687`, `dmoj/settings.py:145-150`, `templates/user/ban.html`; trang `user_ban`, `user_unban` (`dmoj/urls.py:198-199`).

### TK-31. Tải dữ liệu cá nhân
- **Làm gì:** Người dùng tải về một file zip chứa bài nộp và bình luận của mình.
- **Cách VNOJ làm:**
  - Tắt mặc định (`DMOJ_USER_DATA_DOWNLOAD = False`). Cần đặt thêm thư mục lưu `DMOJ_USER_DATA_CACHE`.
  - Form chọn:
    - Tải bình luận? Tải bài nộp? Phải chọn ít nhất một.
    - Lọc bài nộp theo mã bài dạng glob (ví dụ `voi*`), mặc định `*`, tối đa 100 ký tự.
    - Lọc theo kết quả chấm (AC, WA…). Để trống là lấy hết.
  - Bấm gửi thì tạo tác vụ nền (Celery) `prepare_user_data`, có trang theo dõi tiến độ.
  - File zip `<profile_id>.zip` gồm:
    - `submissions/<id>.<đuôi>`: mã nguồn từng bài nộp.
    - `submissions/info.json`: mã bài, thời điểm, thời gian chạy, bộ nhớ, ngôn ngữ, trạng thái, kết quả, điểm.
    - `comments/<id>.txt`: nội dung từng bình luận.
    - `comments/info.json`: thời điểm, loại trang (blog, kỳ thi, bài, lời giải), trang, điểm vote.
  - Mỗi người chỉ chuẩn bị được một lần mỗi `DMOJ_USER_DATA_DOWNLOAD_RATELIMIT` = 1 ngày, trừ khi file cũ không còn. Đang có tác vụ chạy thì không cho tạo thêm.
  - Tải file (`user_download_data`) tên `<username>-data.zip`. Có thể giao cho nginx gửi file qua `DMOJ_USER_DATA_INTERNAL` (X-Accel-Redirect).
  - Người bị mute không dùng được.
- **Ai dùng được:** Người dùng đã đăng nhập, chỉ dữ liệu của chính mình.
- **Mã nguồn:** `judge/views/user.py:388-478`, `judge/forms.py:331-358`, `judge/tasks/user.py:20-121`, `dmoj/settings.py:263-267`; trang `user_prepare_data`, `user_download_data` (`dmoj/urls.py:194-195`).

### TK-32. Ghi nhận lần truy cập cuối và IP
- **Làm gì:** Hệ thống ghi lại lần cuối mỗi người dùng truy cập và IP cuối. Ghi log mỗi khi IP thay đổi.
- **Cách VNOJ làm:**
  - Middleware `LogUserAccessMiddleware` chạy sau mỗi request của người đã đăng nhập.
  - Cập nhật `Profile.last_access` và `Profile.ip` (lấy từ `REMOTE_ADDR`, nginx đã đổi thành IP thật).
  - Để giảm ghi cơ sở dữ liệu: bỏ qua nếu lần cập nhật trước cách chưa tới 10 phút và IP không đổi.
  - Khi IP đổi, ghi dòng `<username>,<IP cũ>,<IP mới>` vào logger `judge.user_log`.
  - Không cập nhật khi đang mạo danh (`no_profile_update`).
  - Hai trường này hiện trong danh sách hồ sơ ở trang quản trị và tìm được theo IP (xem 08).
- **Ai dùng được:** Tự động. Quản trị viên xem.
- **Mã nguồn:** `judge/user_log.py:10-36`, `judge/models/profile.py:262-263`, `judge/middleware.py:119-129`, `judge/admin/profile.py:65-68`.

### TK-33. Chế độ thi chính thức (ảnh hưởng tới tài khoản)
- **Làm gì:** Một cờ cấu hình biến site thành site thi chính thức, khóa bớt các chức năng tài khoản có thể dùng để gian lận.
- **Cách VNOJ làm:**
  - Cờ `VNOJ_OFFICIAL_CONTEST_MODE` (mặc định `False`). Middleware gắn vào `request.official_contest_mode`.
  - Ẩn ô họ tên, tự giới thiệu, huy hiệu, tổ chức ở trang chỉnh sửa hồ sơ (tránh nhét lời giải vào hồ sơ; tổ chức và huy hiệu do quản trị đặt).
  - Không bắt đổi mật khẩu bị lộ (TK-07).
  - Ảnh đại diện dùng biểu tượng nội bộ, không gọi Gravatar.
  - Ẩn tab Blog và Tạo blog trên trang người dùng.
  - Các ảnh hưởng khác ngoài tài khoản (bài tập, bảng xếp hạng) thuộc các khu vực khác.
  - Middleware `ContestMiddleware`: với mỗi request, kiểm tra kỳ thi người dùng đang tham gia. Kỳ thi đã kết thúc hoặc người dùng không còn quyền vào thì tự rời kỳ thi. Thanh trên cùng hiện tên kỳ thi và thời gian còn lại (chi tiết thuộc khu vực kỳ thi).
- **Ai dùng được:** Người cài đặt site.
- **Mã nguồn:** `dmoj/settings.py:60`, `judge/middleware.py:47-48`, `:132-145`, `judge/forms.py:69-75`, `:125-127`, `judge/jinja2/gravatar.py:15-17`, `judge/models/profile.py:476-486`, `templates/user/user-tabs.html:4-11`.

### TK-34. Lệnh dòng lệnh để tạo và gộp tài khoản
- **Làm gì:** Quản trị máy chủ tạo tài khoản hàng loạt hoặc gộp dữ liệu hai tài khoản mà không qua web.
- **Cách VNOJ làm:**
  - `adduser <tên> <email> <mật khẩu> [ngôn ngữ] [--superuser] [--staff]`: tạo một tài khoản đã kích hoạt.
  - `batchadduser <file vào.csv> <file ra.csv>`: đọc cột `username`, `fullname`. Sinh mật khẩu ngẫu nhiên 8 ký tự (bỏ các ký tự dễ nhầm). Ghi ra file CSV gồm tên, họ tên, mật khẩu. Tài khoản không có email.
  - `generate_api_token <tên>`: in ra API token mới (TK-14).
  - `move_user_content <nguồn> <đích>`: chuyển bài nộp, bình luận, vote bình luận từ tài khoản nguồn sang đích. Từ chối nếu tài khoản nguồn đã tham gia kỳ thi.
  - Khi khởi động, site tự tạo `Profile` cho mọi `User` chưa có hồ sơ. Tạo `User` trong trang quản trị cũng tự tạo `Profile`.
- **Ai dùng được:** Người có quyền chạy `manage.py` trên máy chủ.
- **Mã nguồn:** `judge/management/commands/adduser.py:8-32`, `judge/management/commands/batchadduser.py:10-56`, `judge/management/commands/generate_api_token.py`, `judge/management/commands/move_user_content.py:7-31`, `judge/apps.py:17-27`, `judge/admin/profile.py:180-183`.
