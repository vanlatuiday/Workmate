-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationKind" ADD VALUE 'job_match';
ALTER TYPE "NotificationKind" ADD VALUE 'candidate_match';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "matchAlertedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SeekerProfile" ADD COLUMN     "matchAlertedAt" TIMESTAMP(3);

-- Dữ liệu có sẵn coi như đã xét: chỉ tin/hồ sơ mới hoặc sửa sau khi triển khai mới sinh thông báo (tránh gửi dồn một lúc).
-- Dùng "updatedAt" của chính dòng, không dùng now(): cột không có múi giờ lưu giờ UTC còn now() theo múi giờ CSDL (VN).
UPDATE "Job" SET "matchAlertedAt" = "updatedAt";
UPDATE "SeekerProfile" SET "matchAlertedAt" = "updatedAt";
