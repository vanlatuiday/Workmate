-- AlterEnum
ALTER TYPE "NotificationKind" ADD VALUE 'considering';

-- AlterTable
ALTER TABLE "Interest" ADD COLUMN     "consideringAt" TIMESTAMP(3),
ADD COLUMN     "viewedAt" TIMESTAMP(3);
