# Nạp bộ ảnh và hồ sơ người dùng cung cấp

Yêu cầu 22/11/2026: đưa frontend/nguoi-tim-viec và frontend/workmate_20_logos vào web đang chạy, giữ tài khoản/dữ liệu hiện có. Có 20 người, 20 công ty và 60 tin. Người dùng chọn chỉ dùng ảnh người làm avatar, giữ bìa mặc định.

Không đổi schema. Dùng kho ảnh S3 hiện có, bản ghi có id namespace riêng, tạo mật khẩu ngẫu nhiên không xuất ra file, không gửi thư/thông báo. Email/điện thoại lấy từ hồ sơ, giữ quyền riêng tư liên hệ của app. Không cập nhật tài khoản trùng email/id thuộc dữ liệu khác; lỗi thì dừng transaction.

- [x] Parser TXT: giữ nguyên nội dung, chuẩn hóa khu vực/kỹ năng/loại việc, lịch chỉ nhận buổi được khung giờ nguồn bao phủ đủ; lưu lịch chính xác và học vấn trong about. Test độc lập.
- [x] Script mặc định dry-run, chỉ --apply mới ghi. Kiểm tra local DB/storage, upload ảnh tên theo hash, insert dữ liệu theo transaction; chạy lại không đổi bản ghi có sẵn.
- [x] Ghi matchAlertedAt bằng updatedAt trong transaction để import không kích hoạt thông báo nền.
- [x] Đối chiếu tổng số/id dữ liệu trước và sau, ảnh HTTP200, API catalog/candidate và Chrome cho hai vai trò; giữ dữ liệu cũ nguyên vẹn.
- [x] Review, ghi báo cáo import và hướng dẫn chạy lại; không commit/push.

## Kết quả trên máy local ngày 22/11/2026

| Dữ liệu | Trước | Sau | Thêm |
| --- | ---: | ---: | ---: |
| Tài khoản | 27 | 47 | 20 |
| Hồ sơ người tìm việc | 23 | 43 | 20 |
| Doanh nghiệp | 10 | 30 | 20 |
| Tin tuyển dụng | 21 | 81 | 60 |
| Thông báo | 19 | 19 | 0 |

Đã so sánh toàn bộ trường của các tài khoản, hồ sơ, cài đặt, công ty và tin cũ: giữ nguyên. Đã kiểm tra HTTP và SHA256 cho 40 ảnh (tổng 5.229.654 byte, khoảng 4,99 MiB), giữ nguyên chất lượng file gốc. Ảnh nằm trong kho ảnh S3 local hiện có, không đưa ảnh vào bundle JavaScript.

Người tìm việc dùng ảnh làm avatar, coverUrl=null để giữ bìa mặc định. ID/username/đường dẫn avatar dùng hash của file ảnh, không ghép họ tên/email vào URL công khai. Đã sửa riêng các bản ghi mới của lần nhập đầu và xóa 20 object avatar có đường dẫn theo tên; ảnh nguồn giữ nguyên. Tên và số liên hệ vẫn theo quyền riêng tư hiện có, không tạo đánh giá, kinh nghiệm chính thức hoặc kết nối giả. Mật khẩu ngẫu nhiên không được lưu ra báo cáo. Email digest tắt; job_match=false trên 20 tài khoản nhập để cả tin cũ đang xử lý cũng không gửi gợi ý/thư đến các địa chỉ này.

**Giới hạn lịch rảnh:** 6/20 hồ sơ không bao phủ trọn buổi cố định của app (sáng 07–12, chiều 13–17, tối 17–22, khuya 22–06). Những hồ sơ này vẫn được công khai và có đầy đủ lịch giờ gốc trong phần giới thiệu; lưới lịch rảnh không tự nới giờ để tăng điểm phù hợp. Khu vực và tọa độ quy đổi theo quận của app, không phải GPS đã xác minh. Thông tin doanh nghiệp/tin giữ nhãn Demo như bộ nguồn.

Chrome thật: phía người tìm việc nhận đủ 20 công ty/60 tin, logo Highlands tải đúng, có 3 tin đang tuyển và mở chi tiết bằng popup; phía nhà tuyển dụng nhận đủ 20 ứng viên có avatar, hồ sơ không lộ số điện thoại/ngày sinh trước kết nối, giữ ảnh bìa mặc định. Đã xem ảnh chụp desktop 1440px/mobile 390px, không tràn ngang. Kiểm tra lại sau đổi ID ẩn danh và chạy --apply lần nữa: tạo 0, bỏ qua 20 hồ sơ/20 công ty/60 tin, dữ liệu không đổi.

## Chạy lại

Chạy trong backend, cần backend/.env và Postgres/kho ảnh local đang hoạt động:

```sh
node --test test/import-local-profiles.test.mjs test/import-profiles-parse.test.mjs
node scripts/import-local-profiles.mjs
node scripts/import-local-profiles.mjs --apply
```

13 kiểm tra parser/importer và 46 kiểm tra backend hiện có đều đạt. Không thay đổi code giao diện/schema hoặc cài dependency trong lượt này. Không dùng db:seed/db:reset để nhập bộ này vì các lệnh đó có thể xóa dữ liệu cũ. Chạy lại chỉ bổ sung bản ghi còn thiếu; chỉnh nội dung hoặc đổi ảnh của hồ sơ đã nhập cần thao tác có chủ đích riêng, importer không ghi đè chỉnh sửa của người dùng. Thay ảnh nguồn làm ID thay đổi sẽ dừng ở kiểm tra trùng email để tránh tạo sai hồ sơ.

Bộ dữ liệu hiện đã nạp trên local; manifest nguồn vẫn mô tả trạng thái khi chuẩn bị file và không phải cờ điều khiển importer. Chưa triển khai máy chủ bên ngoài, chưa commit/push bộ hồ sơ có thông tin liên hệ.

Cập nhật theo yêu cầu tiếp theo ngày 22/11/2026: bỏ hậu tố `(Demo)` ở tên 20 doanh nghiệp trên database và mapper nhập dữ liệu, ví dụ `Highlands Coffee`. Đã xác nhận catalog trả đủ 20 tên mới; các trường còn lại và doanh nghiệp cũ giữ nguyên. File nguồn vẫn được giữ nguyên.

Cập nhật tiếp theo ngày 22/11/2026: người dùng yêu cầu xóa toàn bộ chữ demo trên web. Đã dọn chữ trong tagline/about của 20 doanh nghiệp và title/description của 60 tin; bỏ email liên hệ `@workmate-demo.invalid` vì không nhận thư. Các trường khác, mã liên kết, ảnh và trạng thái tuyển dụng giữ nguyên, không tạo thông báo. `cleanDemoText` trong mapper áp dụng cả lần nhập sau để không tái thêm nhãn; file nguồn/metadata kỹ thuật giữ nguyên. Frontend cũng bỏ chữ trong nhãn đăng nhập nhanh, mã xác nhận/đặt lại mật khẩu và ghi chú tra cứu. Rà AST chuỗi hiển thị frontend và trường chữ catalog không còn từ này; Chrome xác nhận Việc làm/Công ty/Cá nhân/Đăng tin/Kết nối, vẫn đủ ba tin tại Highlands. Các hàm/kiểu/khóa kỹ thuật chứa từ này không phải nội dung hiển thị và không đổi tên.
