-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "emailedAt" TIMESTAMP(3);

-- Thông báo đã có trước khi bật gửi email: coi như đã xử lý để không ai nhận thư về chuyện cũ
UPDATE "Notification" SET "emailedAt" = CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Notification_emailedAt_at_idx" ON "Notification"("emailedAt", "at");
