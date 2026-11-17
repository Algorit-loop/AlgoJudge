# Mẫu tài liệu thiết kế

Có hai loại tài liệu:

- **Mẫu A — Tổng quan hệ thống:** viết một lần cho cả site, cập nhật dần. (Hiện là `DESIGN.md`.)
- **Mẫu B — Thiết kế chức năng:** mỗi chức năng một file, viết ngay trước khi code milestone chứa nó. Lưu ở `docs/features/<ten-chuc-nang>.md`.

Quy ước: mục nào chưa quyết thì ghi `CHƯA QUYẾT: <câu hỏi>` thay vì bỏ trống, để dễ tìm lại.

---

## Mẫu A — Tổng quan hệ thống

```markdown
# Tổng quan hệ thống

## 1. Mục tiêu và phạm vi
- Site phục vụ ai
- Quy mô dự kiến: số user, số submission/ngày, số người thi cùng lúc
- Những gì KHÔNG làm

## 2. Danh sách chức năng
| Chức năng | Mô tả ngắn | Ai dùng | Ưu tiên (MVP / sau) | Milestone | File thiết kế |
|-----------|-----------|---------|---------------------|-----------|---------------|

## 3. Kiến trúc
- Sơ đồ các thành phần (web, API, DB, queue, judge) và cách chúng nói chuyện
- Lý do chọn từng công nghệ
- Ưu điểm
- Nhược điểm và giới hạn đã chấp nhận

### So sánh với hệ thống đang có
| Tiêu chí | Của mình | VNOJ/DMOJ | Hydro | QDUOJ | Codeforces |
|----------|----------|-----------|-------|-------|------------|

## 4. Mô hình dữ liệu chung
- Các entity chính và quan hệ giữa chúng

## 5. Yêu cầu chung
- Hiệu suất mục tiêu
- Bảo mật
- Phân quyền (các vai trò và quyền của từng vai trò)
```

---

## Mẫu B — Thiết kế chức năng

```markdown
# Chức năng: <tên>

Trạng thái: nháp | đã chốt | đã làm xong
Milestone: M<n>

## 1. Mô tả
- Làm gì, giải quyết vấn đề gì
- Ai dùng (vai trò nào)
- Tham khảo: OJ nào đã có chức năng này, file nào trong `reference/`

## 2. Vị trí
- Nằm ở trang nào, vào từ đâu (menu, nút, URL)
- Liên quan đến chức năng nào khác

## 3. Luồng chạy
### Luồng chính
1. Người dùng ...
2. Hệ thống ...

### Luồng phụ và luồng lỗi
- ...

### Vì sao chọn luồng này
- Phương án đã cân nhắc và lý do loại

## 4. Dữ liệu
- Bảng/trường thêm mới hoặc thay đổi, kèm kiểu và ràng buộc

## 5. API
| Method | Endpoint | Quyền | Request | Response | Lỗi |
|--------|----------|-------|---------|----------|-----|

## 6. Hiệu suất
- Tải dự kiến
- Điểm nghẽn có thể có
- Biện pháp: index, cache, phân trang, queue, rate limit

## 7. Các case phát sinh từ người dùng
| Case | Hậu quả nếu không xử lý | Cách xử lý |
|------|-------------------------|------------|

## 8. Tiêu chí hoàn thành
- [ ] ...
```

---

## Ví dụ: mục 7 của chức năng "Nộp bài"

| Case | Hậu quả nếu không xử lý | Cách xử lý |
|------|-------------------------|------------|
| Spam nộp liên tục | Nghẽn hàng đợi chấm | Rate limit theo user (ví dụ 1 bài / 10 giây) |
| Nộp file code rất lớn | Tốn DB, treo judge | Giới hạn kích thước (ví dụ 64 KB), kiểm tra ở cả FE và BE |
| Nộp sau khi contest kết thúc | Kết quả tính sai vào bảng xếp hạng | BE kiểm tra thời gian theo đồng hồ server, không tin FE |
| Xem code người khác bằng cách đổi ID trên URL | Lộ bài làm | Kiểm tra quyền ở mọi endpoint submission |
| Code độc (fork bomb, đọc file hệ thống) | Sập máy chấm | Sandbox của judge + giới hạn tiến trình/bộ nhớ |
| Judge chết giữa lúc chấm | Submission kẹt mãi ở "Đang chấm" | Timeout, tự đưa lại vào hàng đợi |
