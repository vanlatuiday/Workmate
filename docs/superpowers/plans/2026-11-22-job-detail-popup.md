# Chi tiết tin tuyển dụng trong popup

**Goal:** Bỏ trang riêng `/viec-lam/:id`; mọi nút xem tin mở popup trên trang hiện tại.

**Approach:** Dùng `?tin=<id>` cùng pathname hiện tại để giữ màn hình nền và hỗ trợ Back/link chia sẻ. `JobDetailLink` dùng chung tạo URL và giữ đăng nhập như trước. App chỉ lazy-load popup khi cần. Route cũ chuyển đến `/viec-lam?tin=<id>` để liên kết đã gửi vẫn dùng được. Tái sử dụng DialogShell cho Esc, focus, khóa cuộn. Không thêm package.

- [x] Chuyển nội dung JobDetailPage sang JobDetailDialog, giữ nút hành động/trạng thái/quyền, mô tả tin thật; không còn màn chi tiết riêng.
- [x] Tạo helper URL và JobDetailLink; thay toàn bộ link xem tin (công ty, Việc làm, dashboard, trang chủ, thông báo).
- [x] App mount popup theo query; đóng xóa query, Back hoạt động; route cũ redirect. Không làm nền remount/cuộn lại khi mở popup.
- [x] Kiểm tra URL/query, TypeScript/lint/tests/build; Chrome desktop/tablet/mobile: mở/đóng/Escape/Back, giữ nền và vị trí cuộn, link cũ, tin đóng/thiếu, guest login. Không gửi ứng tuyển/tin nhắn thật khi QA.
- [x] Review độc lập và cập nhật tài liệu.

**Validation:** TypeScript, lint src, 21/21 node tests, production build và git diff --check đều qua. Chrome 1440/768/390px: công ty mở popup giữ DOM/cuộn, Escape trả focus; tin liên quan thay query/giữ Shell/đặt lại cuộn; báo cáo lồng nhau chỉ đóng lớp trên; Back giữ bộ lọc. Link localhost:5173/viec-lam/m11 của khách đăng nhập rồi mở đúng popup Lễ tân trung tâm. Dashboard giữ trang/cuộn/focus; thông báo chuyển và trả focus đúng; nút Nhắn tin đóng popup trước khi mở chat. Fixture tạm trong bộ nhớ xác nhận tin đóng/hết hạn không có ứng tuyển, tin thiếu hiện trạng thái không tìm thấy; đã phục hồi. Không gửi ứng tuyển/báo cáo/tin nhắn khi QA. Review độc lập hoàn tất; focus handoff thông báo được làm rõ bằng flushSync và kiểm tra lại. Chưa commit/push.
