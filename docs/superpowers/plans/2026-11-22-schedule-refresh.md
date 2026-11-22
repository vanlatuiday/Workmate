# Làm mới lịch phỏng vấn

**Goal:** `/lich-phong-van` theo phong cách xanh trắng hiện tại, dùng lịch thật và giữ hành động hai vai trò.

**Approach:** Đưa route vào chế độ ban ngày, giữ dải 7 ngày và tabs có bàn phím. Header gọn, số lượng theo trạng thái, thẻ lịch dễ đọc (giờ, đối tác, vị trí, hình thức, địa điểm, ghi chú). Bố cục rộng và có khối lịch gần nhất trên desktop, xếp dọc trên mobile. Không thêm tháng/lịch kéo thả/package hoặc đổi API.

- [x] Tách logic nhóm/sắp xếp lịch nhỏ để bảo đảm lịch gần nhất và nhóm ngày đúng, kiểm tra bằng node tests; giữ phân loại trạng thái hiện có.
- [x] Dựng giao diện blue-white và trạng thái đang tải/trống; giữ ChooseSlotDialog, CancelDialog, HireAction, nhắn tin, PlaceText và quyền theo vai trò.
- [x] Kích hoạt DayBackdrop/header/footer ban ngày; đồng bộ màu hai hộp thoại chọn giờ/hủy ở trang lịch bằng tùy chọn styling hiện có.
- [x] Chạy TypeScript/lint/tests/build, review độc lập và Chrome thật 1440/768/390px cho seeker/recruiter. Fixture chỉ trong bộ nhớ, không xác nhận/hủy lịch, gửi lời mời nhận việc hoặc nhắn tin thật.
- [x] Cập nhật DESIGN.md/prj-context.md; chưa commit/push.

**Validation:** TypeScript, lint src, 25/25 node tests, production build và diff --check đạt. Chrome thật 1440/768/390px với dữ liệu live của admin1/admin2; fixture chỉ trong bộ nhớ kiểm tra cả upcoming/pending/past, thứ tự nhóm và lịch gần nhất, loading/empty, tabs bàn phím, ngày rộng44px ở390, cuộn tới nhóm cách header112px, hộp chọn giờ/hủy/nhận việc. Tất cả yêu cầu API ghi trong fixture tương tác bị chặn và đếm0, đã phục hồi dữ liệu thật. Review phát hiện mất nút từ chối khi khung giờ đã hết và lệch múi giờ giữa card/dialog; đã thêm xác nhận từ chối riêng và tùy chọn timeZone cho ChooseSlotDialog/fmtSlot, browser New_York xác nhận dialog vẫn đúng giờ Việt Nam. Review lại không còn vấn đề. Không xác nhận/hủy/từ chối/nhận việc thật trong QA. Chưa commit/push.
