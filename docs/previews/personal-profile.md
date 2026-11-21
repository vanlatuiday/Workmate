# Bản mẫu trang cá nhân, 22/11/2026

Chủ dự án yêu cầu bố cục theo ảnh tham khảo và xác nhận đặt ở `/ca-nhan`.
Giữ phong cách xanh trắng đã chọn. Người tìm việc đã nối dữ liệu thật; nội dung doanh nghiệp vẫn là bản mẫu.

- Ảnh bìa ngang, avatar tròn, tên và liên hệ; người tìm việc xem thông tin của chính mình ở đầu trang.
- Người tìm việc: cột trái gồm Tóm tắt làm việc và Sẵn sàng nhận việc. Cột phải gồm Công ty và lịch sử nhận việc, Đánh giá từ doanh nghiệp, Kỹ năng và điểm mạnh, Giới thiệu và kinh nghiệm tự khai.
- Nền xanh sáng, thẻ sáng viền xanh mờ; desktop hai cột, tablet/mobile xếp lại theo bề rộng.
- Nút sửa dẫn tới `/ho-so`; khách được đưa tới đăng nhập trước. Không có thao tác lưu dữ liệu trong bản mẫu.
- Bản doanh nghiệp dùng chung bố cục, ảnh bìa và nền. Đầu trang đọc tên/logo/liên hệ từ hồ sơ công ty của nhà tuyển dụng.
- Sáu khối doanh nghiệp gồm Giới thiệu doanh nghiệp, Thông tin tuyển dụng, Văn hóa, Địa điểm làm việc, Vị trí đang tuyển, Phúc lợi; nội dung vẫn giữ chỗ. Nút sửa dẫn về `/tuyen-dung/ho-so-cong-ty`, liên kết quản lý tin dẫn về `/tuyen-dung/tin-dang`.
- Các URL `?xem=…` giữ giao diện trước. Không thay cấu trúc điều hướng dùng chung.

Mã riêng ở `src/pages/public/personal/PersonalProfilePrototype.tsx` và `personalPrototype.css`.
Các khối người tìm việc ở `SeekerProfileSections.tsx`; `useSeekerOverview.ts` chỉ đọc các API đã có:
`/seeker/profile`, `/hires`, `/reviews/seekers/:id` và `/catalog`. Danh mục có cả tin cũ liên quan đến tài khoản dù đã đóng/ẩn.
Chỉ tính lời mời `accepted` của chính tài khoản; nhiều vị trí cùng doanh nghiệp chỉ tính một công ty.
Điểm trung bình lấy từ tất cả đánh giá của doanh nghiệp, kèm số đánh giá; chưa có đánh giá thì không hiển thị điểm 0/5.
Ngày bắt đầu tương lai ghi “Sắp bắt đầu”. Chưa có dữ liệu hoàn thành ca, chuyên cần hoặc xác nhận kết thúc công việc nên không hiển thị các chỉ số đó.
Kinh nghiệm người dùng tự nhập được ghi riêng, không cộng vào số công ty xác nhận. Điểm mạnh chỉ lấy từ thẻ đánh giá thật.
Có trạng thái tải, lỗi và thử lại; hủy yêu cầu cũ khi đổi phiên. Khách không tải hoặc hiển thị dữ liệu cá nhân của người tìm việc.
Phần lịch sử nhận việc và đánh giá chỉ đọc dữ liệu. Nút sửa hồ sơ vẫn dẫn tới trình sửa hiện có.

## Đổi ảnh bìa người tìm việc

Nút “Đổi ảnh bìa” mở hộp thoại dùng chung, cho chọn ảnh từ thiết bị, xem trước, lưu, hủy hoặc trở về ảnh mặc định.
Đầu vào JPG/PNG/WebP tối đa 10 MB; trình duyệt giữ tỉ lệ, thu nhỏ tối đa 1800×900, xuất WebP chất lượng 0,82 và kiểm tra đầu ra ≤2 MB.
Máy chủ tiếp tục kiểm tra loại/chữ ký và giới hạn 2 MB qua `POST /seeker/profile/cover`; `DELETE` cùng URL trả về ảnh mặc định.
`GET /seeker/profile` trả thêm `coverUrl`; migration `20261122090000_seeker_cover` chỉ thêm cột nullable, đã áp dụng trên local.
Ảnh dùng kho file công khai hiện có và gắn với đúng chủ tài khoản. Thay thành công mới dọn ảnh cũ; lưu DB thất bại thì dọn file mới.
Phần này chỉ áp dụng cho người tìm việc; bản doanh nghiệp vẫn dùng ảnh bìa mẫu. Không lưu URL ảnh bìa vào localStorage.
Đã thử lưu/tải lại trang thật, hủy, mặc định, lỗi mạng, kiểm tra định dạng và bố cục 1440/768/390px. Tài khoản demo được trả về ảnh mặc định sau kiểm tra.

Kiểm tra phép tổng hợp: `node --test tests/seeker-work-history.test.mjs`.
Đã thử Chrome ở 1440/768/390px với dữ liệu tài khoản hiện có; thử thêm dữ liệu trong bộ nhớ trình duyệt cho nhiều đánh giá,
ngày bắt đầu tương lai, buổi Khuya, lỗi mạng/thử lại và đăng xuất/chuyển sang nhà tuyển dụng. Không thêm bản ghi kiểm thử vào cơ sở dữ liệu.

Ảnh ở `src/assets/images/personal-cover-preview.webp` (1800×600, 60.846 byte).
Ảnh tạo bằng công cụ imagegen tích hợp, giữ bản PNG gốc tại thư mục generated_images của Codex.

Prompt ảnh bìa: ảnh chụp ngang 3:1, bầu trời xanh và mây trắng nhẹ, tòa nhà trắng hiện đại ở phía phải,
lá cây xanh ở góc phải trên, bên trái nhiều khoảng trời trống cho avatar và chữ xanh đậm;
ánh sáng buổi sáng, không người, không chữ, không logo hoặc watermark.
