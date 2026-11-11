-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "JobView" (
    "jobId" TEXT NOT NULL,
    "viewerKey" TEXT NOT NULL,
    "day" DATE NOT NULL,

    CONSTRAINT "JobView_pkey" PRIMARY KEY ("jobId","viewerKey","day")
);

-- CreateIndex
CREATE INDEX "JobView_day_idx" ON "JobView"("day");

-- AddForeignKey
ALTER TABLE "JobView" ADD CONSTRAINT "JobView_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
