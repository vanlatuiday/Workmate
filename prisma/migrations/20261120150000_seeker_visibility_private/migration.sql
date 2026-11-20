-- Người tìm việc: "Ẩn hồ sơ" (hidden) xưa nay chạy y hệt "Chỉ nhà tuyển dụng đã kết nối" (connected):
-- chỉ công ty đã được ứng tuyển / đã kết nối xem được hồ sơ. Gộp về một lựa chọn "Riêng tư" = connected.
-- Nhà tuyển dụng giữ nguyên: với họ, hidden = tắt "Công khai trang công ty".
UPDATE "UserSettings" s SET "visibility" = 'connected'
FROM "User" u
WHERE u."id" = s."userId" AND u."role" = 'jobseeker' AND s."visibility" = 'hidden';
