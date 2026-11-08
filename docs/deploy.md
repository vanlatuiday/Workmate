# Đưa Workmate lên mạng

Cần 4 thứ: **máy chủ Node** (backend), **PostgreSQL 16**, **kho file chuẩn S3** (R2/S3) và **dịch vụ SMTP**;
frontend là trang tĩnh nên đặt ở đâu cũng được.

## 1. Biến môi trường backend
Xem `.env.example`. Với `NODE_ENV=production`, máy chủ từ chối khởi động nếu thiếu hoặc sai cấu hình và in rõ tên biến.

- `JWT_SECRET`: tạo bằng `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Đổi giá trị này là mọi người bị đăng xuất.
- `CORS_ORIGIN`: địa chỉ https của frontend, nhiều địa chỉ thì cách nhau bằng dấu phẩy.
- `TRUST_PROXY`: số lớp proxy phía trước, thường là `1`; có CDN và proxy của nền tảng thì `2`.
  **Đặt sai là giới hạn tần suất sai:** thiếu thì mọi người bị tính chung một IP; thừa thì người dùng tự giả được IP.
- `SMTP_*`: tài khoản của nhà cung cấp email, kiểm tra bằng `MAIL_TEST_TO=ban@gmail.com npm run mail:test`. `SMTP_FROM` phải thuộc tên miền đã xác thực với họ.
  Gmail dùng được khi mới bắt đầu (xem `.env.example`), nhưng giới hạn khoảng 500 thư/ngày và thư dễ vào mục Thư rác hơn dịch vụ chuyên dụng.

## 2. Backend
```bash
npm ci
npx prisma generate
npm run build
npm run db:deploy        # áp dụng migration, chạy lại mỗi lần cập nhật
ADMIN_EMAIL=ban@congty.vn ADMIN_PASSWORD='...' npm run admin:create   # chỉ lần đầu
npm start                # node dist/main.js
```
Kiểm tra sống: `GET /api/health`. Máy chủ cần hỗ trợ WebSocket (đường dẫn `/socket.io`) để tin nhắn đến ngay.

**Không chạy trên database thật:** `npm run db:seed` (xóa sạch mọi bảng, đã bị chặn ngoài localhost) và `npm run db:reset`.

## 3. Kho file
Tạo 2 bucket: `workmate-public` (cho phép đọc công khai, gắn với `STORAGE_PUBLIC_URL`) và `workmate-private`
(**không** công khai, chứa CV). `npm run storage:init` tạo được bucket nếu tài khoản có quyền, nhưng quyền đọc công khai
phải đặt ở trang quản trị của nhà cung cấp. Cho phép tên miền frontend đọc ảnh nếu kho yêu cầu CORS.

## 4. Frontend
```bash
VITE_API_URL=https://api.ten-mien.vn/api VITE_SOCKET_URL=https://api.ten-mien.vn npm run build
```
Biến `VITE_*` được đóng cứng lúc build, đổi địa chỉ phải build lại. Đưa thư mục `dist/` lên nơi host và cấu hình
**mọi đường dẫn không phải file đều trả về `index.html`**, nếu không tải lại trang sẽ báo 404.

## 5. Kiểm tra sau khi lên
- [ ] Đăng ký tài khoản mới, đăng nhập, không có nút đăng nhập nhanh
- [ ] Quên mật khẩu: email tới nơi, trang không hiện mã
- [ ] Đăng tin bằng tài khoản doanh nghiệp, admin duyệt, tin hiện công khai
- [ ] Hai tài khoản nhắn tin qua lại, tin đến không cần tải lại trang
- [ ] Tải ảnh đại diện (xem được) và CV (chỉ mở qua link tạm thời)
- [ ] Đăng nhập sai liên tiếp bị chặn, và người khác cùng lúc không bị ảnh hưởng (kiểm tra `TRUST_PROXY`)
- [ ] Bật sao lưu tự động cho PostgreSQL
