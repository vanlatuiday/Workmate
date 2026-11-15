-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "autoModerated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN     "suspectWords" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Tự lọc tin đăng: tách danh sách từ thành "cấm tuyệt đối" (bannedWords) và "đáng ngờ" (suspectWords).
-- "việc nhẹ lương cao" là lời hứa quá đà, không phải lừa tiền trực tiếp → chuyển sang đáng ngờ.
UPDATE "SystemConfig" SET
  "bannedWords" = (
    SELECT array_agg(DISTINCT w) FROM unnest(
      array_remove("bannedWords", 'việc nhẹ lương cao')
      || ARRAY['nộp tiền trước', 'phí hồ sơ', 'cọc trước', 'ck trước']
    ) AS w
  ),
  "suspectWords" = ARRAY[
    'việc nhẹ lương cao', 'phí đào tạo', 'mua đồng phục', 'nộp CCCD gốc', 'giữ CCCD', 'giữ căn cước',
    'việc online tại nhà', 'cộng tác viên online', 'không cần làm gì', 'thu nhập khủng', 'kiếm tiền nhanh', 'đa cấp'
  ];
