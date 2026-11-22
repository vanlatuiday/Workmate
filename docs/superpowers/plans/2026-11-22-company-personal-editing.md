# Sửa hồ sơ doanh nghiệp ngay trang cá nhân

**Goal:** /ca-nhan phía doanh nghiệp hiển thị dữ liệu thật, sửa trực tiếp từng khối và lưu để người tìm việc thấy cùng nội dung ở /cong-ty/:id.

**Architecture:** Tái sử dụng PATCH /recruiter/company, companyStore và catalogStore. Dùng chung thẻ thông tin cho chủ doanh nghiệp/người xem, chủ có nút chỉnh sửa mở DialogShell; người xem không có điều khiển sửa. Giới thiệu, ngành/quy mô, văn hóa/giá trị/môi trường, địa chỉ, phúc lợi, liên hệ và ảnh bìa dùng trường hiện có. Thêm Company.foundedYear Int? để lưu năm thành lập tùy chọn; migration chỉ thêm cột nullable, không đổi dữ liệu cũ. Tuyển dụng lấy từ tin đúng công ty đã duyệt, đang mở, chưa hết hạn; sửa bằng form tin hiện có để tránh dữ liệu tuyển dụng trùng lặp.

**UI:** Giữ giao diện xanh sáng đã chốt; mỗi khung có nút Sửa có nhãn rõ ràng. Popup có Lưu/Hủy, báo lỗi, khóa đóng/lưu khi đang gửi hoặc tải ảnh; hủy không ghi nháp vào hồ sơ. Header sửa tên/email doanh nghiệp/số liên hệ và logo, đổi bìa qua PhotoPicker. Công khai chỉ dùng thông tin liên hệ doanh nghiệp, không lấy email đăng nhập làm dự phòng.

- [x] Backend: migration foundedYear nullable, DTO kiểm tra số nguyên/năm hợp lệ; GET/PATCH riêng và catalog đưa ra các trường hồ sơ công khai còn thiếu, giữ quyền thành viên/khóa và cờ ẩn trang. Test.
- [x] Frontend dữ liệu: CompanyProfile/Server picker/catalog type hỗ trợ foundedYear và dữ liệu công khai mới; tải lại catalog sau khi lưu để đồng bộ.
- [x] Editor: popup theo mục; logo dùng chức năng hiện có; năm/địa chỉ/giới thiệu/danh sách kiểm tra theo DTO. Bìa upload dùng lại PhotoPicker, lưu đúng thời điểm.
- [x] Cards: bỏ toàn bộ khung mẫu, dùng dữ liệu thật và trạng thái trống; dùng chung ở trang cá nhân và công khai, không giả phúc lợi/chi nhánh/việc làm.
- [x] Kiểm tra TS/lint/build/test, Chrome hai vai trò, lưu/tải lại/hủy/lỗi, bố cục 1440/768/390px, không sửa dữ liệu của doanh nghiệp khác. Review và dọn fixture QA.

Không thêm dependency, không reset/seed database, không gửi thư/thông báo trong QA và không commit/push trong lượt này.

## Kết quả ngày 22/11/2026

- Migration 20261122110000_company_founded_year đã áp dụng trên local: chỉ thêm INTEGER nullable; không tự điền năm cho doanh nghiệp cũ.
- Frontend 42 test, TypeScript và ESLint đạt; backend 53 test và build đạt. Kiểm tra mutation của guard companyStore.update chứng minh phản hồi cũ sau đăng xuất/đổi công ty bị bỏ qua. Catalog.load trả boolean để editor phân biệt đã lưu nhưng tải danh mục thất bại, không gửi lại PATCH đã thành công.
- Chrome thật: sửa và lưu tên/liên hệ, giới thiệu/ngành/quy mô/năm, văn hóa/giá trị/môi trường, địa chỉ/khu vực và phúc lợi. Tải lại /ca-nhan giữ toàn bộ nội dung; Hủy giữ nguyên phần đã lưu. Chọn/tải ảnh bìa rồi lưu, ảnh hiện trong header của cả chủ và trang công ty.
- Người tìm việc xem đủ nội dung đã lưu, không có điều khiển sửa, không thấy email đăng nhập riêng của tài khoản doanh nghiệp. Editor mobile vừa màn, Esc đóng và trả focus đúng nút. Đã chụp/đo 1440, 768 và 390px; xem ảnh desktop và editor mobile, không tràn ngang.
- HTTP thật: năm tương lai 400; năm null xóa được rồi lưu lại; người tìm việc sửa 403; doanh nghiệp bị khóa sửa 403. Hồ sơ bị ẩn không trả các trường công khai mới cho khách; chủ vẫn đọc được hồ sơ của mình.
- Review độc lập không còn vấn đề quan trọng. Đã xóa fixture tài khoản/công ty và 1 object ảnh QA, kiểm tra hash toàn bộ doanh nghiệp cũ giữ nguyên; số lượng trở về 47 tài khoản, 30 công ty, 81 tin và 20 thông báo. Không tạo tin/đánh giá/phúc lợi giả trong dữ liệu đang dùng.
