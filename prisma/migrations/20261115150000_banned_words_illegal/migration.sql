-- Thêm các cụm phạm pháp rõ ràng vào danh sách cấm tuyệt đối (dùng cho cả tin đăng và tên / giới thiệu công ty)
UPDATE "SystemConfig" SET "bannedWords" = (
  SELECT array_agg(DISTINCT w) FROM unnest("bannedWords" || ARRAY['buôn người', 'mua bán người', 'mại dâm']) AS w
);
