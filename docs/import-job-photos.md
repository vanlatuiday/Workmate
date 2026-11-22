# Ảnh đăng tin từ frontend/dangtin

Đã áp dụng trên local ngày 22/11/2026 theo yêu cầu người dùng: 40 ảnh trong 20 folder doanh nghiệp được ghép vào 60 tin của đúng các doanh nghiệp đó. Chỉ thay Job.photo; nội dung, lương, ca, thời hạn, trạng thái duyệt, tài khoản và dữ liệu khác giữ nguyên. Không đổi logo hoặc ảnh bìa công ty, không thay ảnh các doanh nghiệp không có folder tương ứng.

Ảnh gốc được giữ nguyên và đã kiểm tra lại SHA256 đủ 40 file. Một số file đuôi jpg thực chất là WebP/PNG/AVIF; Chrome giải mã được và hàm prepareCover hiện có xuất bản WebP giữ tỷ lệ, giới hạn 1800×900, không phóng ảnh nhỏ. Bản tối ưu nằm ở frontend/dangtin/optimized/<slug>/anh-01.webp, anh-02.webp; manifest.json lưu kích thước và hash cả nguồn/lẫn kết quả. Tổng 21.375.021 byte nguồn → 3.334.940 byte tối ưu, giảm 84%.

Script scripts/import-job-photos.mjs có bảng PHOTO_SELECTION: mỗi công ty 3 tin dùng lại 2 ảnh theo hoạt động trong GHI-CHU-ANH.txt. Khóa kho ảnh chứa hash; database dùng URL trực tiếp. Toàn bộ 40 ảnh được sử dụng. Mặc định chỉ xem trước, chỉ --apply mới ghi; giới hạn database/kho ảnh về localhost, kiểm tra đủ 60 tin đúng chủ và đã đánh dấu thông báo trước đó. Upload và xác minh HTTP/MIME/SHA256 đủ 40 ảnh trước transaction. Transaction và snapshot bảo đảm chỉ photo/updatedAt của tin mục tiêu được đổi, không phát thông báo và không đổi các bảng khác.

```sh
# Trong backend, cần Postgres và kho ảnh hiện có đang chạy.
node --test test/import-job-photos.test.mjs test/import-local-profiles.test.mjs test/import-profiles-parse.test.mjs
node scripts/import-job-photos.mjs
node scripts/import-job-photos.mjs --apply
```

Kiểm tra: 20 test nhập dữ liệu/ảnh đạt; review độc lập không có lỗi chặn. Lượt ghi đầu thay 60 tin; lượt chạy lại update=0, skip=60, vẫn kiểm tra đủ 40 ảnh. Chrome xác nhận 60 tin tham chiếu 40 URL mới; đủ 40 ảnh giải mã và đọc pixel qua CORS thành công, popup hiển thị ảnh mới, bộ sưu tập phía người tìm việc hiển thị đúng ở desktop/mobile và không tràn ngang. Đã xem bảng ảnh 40 file và ảnh chụp popup/bộ sưu tập.

Trong lúc thực hiện đã khởi động lại đúng hai container workmate-db và workmate-storage đang dừng, giữ nguyên volume; web Vite 5173 và API Nest 8000 đã chạy lại. Không reset/seed dữ liệu, không tải thêm ảnh từ nguồn ngoài, không xóa ảnh dùng chung, không commit/push.
