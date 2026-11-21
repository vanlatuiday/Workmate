# Hai cột thông báo

Yêu cầu đã duyệt: desktop có “Cần phản hồi” và “Cập nhật”; điện thoại/tablet dùng hai tab. Giữ phong cách xanh trắng và không khôi phục trang thông báo riêng.

- [x] Phân loại theo dữ liệu thật, có kiểm tra bằng Node: trạng thái pending/offered, khung giờ tương lai, ngày bắt đầu theo Việt Nam, hồ sơ chưa xem, chống lặp và liên kết đúng cặp.
- [x] Đổi cửa sổ sang hai cột rộng trên desktop và tab có bàn phím trên màn hình nhỏ. Giữ trạng thái đọc độc lập với trạng thái xử lý.
- [x] Dùng lại luồng chọn giờ/nhận việc/hồ sơ; xử lý lớp hộp thoại và focus khi mở từ thông báo. Không thay API hoặc trạng thái máy chủ.
- [x] Chạy TS/lint/build, kiểm tra Chrome responsive, trạng thái tải/trống, keyboard, dữ liệu thật và dữ liệu thử chỉ trong bộ nhớ. Không gửi lời mời/tin nhắn hoặc chấp nhận nhận việc khi kiểm tra.

Xác minh: 15 kiểm tra Node qua; TypeScript/lint/build qua. Chrome ở 1440/768/390/320px, hai vai trò, dữ liệu thật và fixture chỉ trong bộ nhớ. Đã kiểm tra thao tác mở biểu mẫu, khung giờ tương lai, trạng thái đọc độc lập xử lý, chuyển cột, tab bàn phím, tải/trống và dọn portal/khóa cuộn khi đổi trang. Không gửi quyết định nhận việc hoặc tạo bản ghi thử trên máy chủ.
