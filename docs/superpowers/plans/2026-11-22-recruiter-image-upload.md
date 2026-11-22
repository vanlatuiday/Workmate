# Tải ảnh cho tin tuyển dụng và bước giới thiệu doanh nghiệp

**Goal:** Nhà tuyển dụng chọn ảnh từ máy ở /dang-tin (kể cả tin đầu tiên/sửa tin), bước 3 /tuyen-dung/bat-dau và phần ảnh bìa hồ sơ công ty; ảnh lưu được và hiển thị đúng mọi nơi.

**Architecture:** Tái sử dụng kho S3 và kiểm tra JPG/PNG/WebP ≤2MB trên backend; POST /recruiter/company/images nhận multipart file trả Photo {url,alt}, kiểm tra thành viên và công ty không bị khóa. Chỉ chọn ảnh nháp, dữ liệu cover/photo lưu qua PATCH/POST hiện có khi người dùng xác nhận. Dùng picker chung, tái sử dụng prepareCover để nén trước upload, không thêm package/schema, giữ ảnh mẫu và ảnh đã tải khi sửa tin. Photo frontend hỗ trợ id Unsplash hoặc url; mọi renderer dùng helper chọn đúng nguồn.

**UI:** Khung xem ảnh đang chọn, nút Tải ảnh lên/Đổi ảnh, trạng thái tải/lỗi, lưới ảnh mẫu. Dùng page-* và hằng nút có sẵn, hỗ trợ bàn phím/mobile, khóa lưu/đi tiếp khi đang tải để tránh lưu nhầm ảnh cũ. Giữ nguyên thiết kế nền đã chốt.

- [x] Backend: test thiếu/sai/vượt dung lượng, chưa thuộc công ty/bị khóa và upload hợp lệ; endpoint upload ảnh dùng storage hiện có, không thay dữ liệu công ty/tin cho tới lúc lưu form.
- [x] Frontend renderer: Photo hỗ trợ url và id, kiểm tra helper và toàn bộ nơi dựng URL ảnh (gồm WebGL, preview, public, admin).
- [x] Frontend picker: dùng chung ba vị trí, preview/lỗi/busy, giữ ảnh upload khi sửa tin và khi chuyển bước.
- [x] Kiểm tra TS/lint/build, bộ test hiện có, upload thật Chrome desktop/tablet/mobile, lưu/tải lại và popup, quyền API. Review trước bàn giao.

Không tạo tin tuyển dụng công khai hoặc gửi thông báo chỉ để QA. Ảnh đã tải nhưng bỏ dở nháp có thể còn trong kho, giống các asset upload; chưa thêm hệ thống dọn file định kỳ trong lượt này.

## Kết quả kiểm tra

- Backend: 50 test đạt; build đạt. Endpoint mới giới hạn 15 lần/phút, 60 lần/giờ. HTTP thật: khách 401, người tìm việc 403, thiếu/giả ảnh 400, file vượt 2MB 413.
- Frontend: 29 test đạt; TypeScript, ESLint và build đạt. Helper hỗ trợ URL tải lên và id Unsplash; không tạo srcSet giả cho file tải lên.
- Chrome thật: chọn file từ máy ở bước 3, nén WebP (ảnh thử 214.670 byte), xem trước, bấm Tiếp theo và xác nhận URL đã lưu; hoàn thành form rồi tải ảnh cho tin đầu tiên, gửi vào chờ duyệt, tải lại trang sửa và giữ đúng ảnh. File giả báo lỗi và giữ ảnh trước; nút lưu khóa khi request tải ảnh đang chờ.
- Ảnh đã hiện trong popup tin, trang công ty và trình sửa hồ sơ công ty. Đã bắt và sửa điều kiện cũ job.photo?.id làm popup bỏ ảnh URL. Audit lại cả optional chaining, không còn guard ảnh chỉ dựa trên id.
- Đã chụp/xem desktop 1440px, tablet 768px và mobile 390px cho phần tải ảnh; không tràn ngang. Kho ảnh local trả CORS đúng origin frontend; WebGL được review về nguồn ảnh/texture và có DOM dự phòng khi nguồn không hỗ trợ CORS. Không dùng screenshot để khẳng định đã kiểm tra hiệu ứng WebGL với ảnh tải lên.
- Review độc lập không còn vấn đề quan trọng. Đã dọn tài khoản/công ty/tin chờ duyệt và 4 object ảnh QA; tổng trở về 47 tài khoản, 30 công ty, 81 tin, 20 thông báo. Không có thông báo nào từ QA; dữ liệu đang dùng không bị thay.
