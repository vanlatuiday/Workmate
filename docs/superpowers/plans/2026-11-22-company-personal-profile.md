# Trang cá nhân công ty và tin đang tuyển

**Goal:** Người tìm việc đi từ Việc làm/Kết nối → đúng công ty → đúng tin tuyển dụng.

**Architecture:** Giữ route `/cong-ty/:id`, thay bố cục case study bằng phong cách cá nhân xanh trắng đã duyệt. Đọc công ty theo id từ catalog thật; giữ kiểm tra quyền xem trang ẩn. Tái sử dụng JobLinks và trang `/viec-lam/:id`, không sửa thiết kế chi tiết tin.

**Constraints:** Không thêm package, không đổi trang cá nhân của tài khoản hiện tại, không dùng thông tin liên hệ riêng tư của chủ tài khoản, không tạo dữ liệu tuyển dụng giả. Tin đang tuyển phải thuộc công ty đang xem, công khai/đã duyệt/đang mở/chưa hết hạn.

- [x] Thay CompanyDetailPage bằng header ảnh bìa/logo/tên và các khung thông tin, việc tuyển, đánh giá; loading/lỗi tải/không tìm thấy/trang ẩn có trạng thái rõ ràng.
- [x] Kiểm tra logic lọc tin bằng test nhỏ: đúng công ty, trạng thái, hạn tuyển, thứ tự mới nhất; không sửa mảng nguồn.
- [x] Giữ nguồn trang khi đi từ Kết nối; JobLinks nhận nguồn công ty và BackLink quay về công ty.
- [x] Chạy tests, TypeScript, lint, build; kiểm tra luồng thật trong Chrome và ảnh 1440/768/390px, không ghi dữ liệu tuyển dụng.
- [x] Review độc lập và sửa lỗi nếu có; cập nhật mô tả route trong prj-context.md.

**Validation:** 18/18 node tests; TypeScript, eslint toàn src, production build và diff --check đều qua. Chrome tài khoản admin1: Việc làm → song-han → j1 → công ty; Kết nối (khung chi tiết thật) → gio-song-han → quay lại Kết nối. Ảnh 1440/768/390px và CTA cuộn trên 390px đạt, không tràn ngang. Trạng thái ẩn/loading/lỗi/thử lại/không tồn tại/không có tin được kiểm tra qua snapshot catalog tạm trong bộ nhớ trình duyệt, đã phục hồi. Review độc lập không có P1/P2/P3. Không đổi thiết kế JobDetailPage; chưa commit/push.

**Yêu cầu tiếp theo:** Trang chi tiết tin riêng đã được thay bằng popup theo `2026-11-22-job-detail-popup.md`; nút xem tin hiện giữ nguyên trang công ty.
