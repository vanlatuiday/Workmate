# Workmate

Nền tảng việc làm bán thời gian, linh hoạt tại Đà Nẵng, kết nối **người tìm việc** và **nhà tuyển dụng**
(quán cà phê, cửa hàng, sự kiện…) theo kỹ năng, ca rảnh, khoảng cách và mức lương.

## Mã nguồn nằm ở đâu

Repo chia thành hai nhánh, mỗi nhánh là một phần độc lập:

| Nhánh | Nội dung | Công nghệ |
|---|---|---|
| [`frontend`](../../tree/frontend) | Giao diện web (trang công khai, khu người tìm việc, nhà tuyển dụng, quản trị) | React 18, TypeScript, Vite 6, Tailwind 3, Zustand |
| [`backend`](../../tree/backend) | API, cơ sở dữ liệu, lưu file, email, realtime | NestJS 12, Prisma 5, PostgreSQL 16, Socket.IO, S3 (SeaweedFS trên máy) |

Thay đổi giao diện được commit vào nhánh `frontend`, thay đổi API/cơ sở dữ liệu vào nhánh `backend`.
Nhánh `main` chỉ chứa trang giới thiệu này.

## Chạy trên máy

Cần: Node.js ≥ 20.19, npm, Docker Desktop.

```bash
# Lấy hai phần vào hai thư mục cạnh nhau
git clone -b backend  https://github.com/vanlatuiday/Workmate.git backend
git clone -b frontend https://github.com/vanlatuiday/Workmate.git frontend

# Backend — http://localhost:8000/api
cd backend
docker compose up -d          # PostgreSQL + kho file
npm install
cp .env.example .env
npx prisma migrate deploy
npm run db:seed               # dữ liệu demo
npm run storage:init
npm run dev

# Frontend — http://localhost:3000 (cửa sổ Terminal khác)
cd ../frontend
npm install
npx vite
```

Tài khoản demo (mật khẩu `123456`): `admin1` người tìm việc, `admin2` nhà tuyển dụng, `admin3` quản trị viên.

Tài liệu chi tiết: `backend/docs/` (mô hình dữ liệu, triển khai, sơ đồ database cho dbdiagram.io)
và `frontend/DESIGN.md` (hệ thống thiết kế).
