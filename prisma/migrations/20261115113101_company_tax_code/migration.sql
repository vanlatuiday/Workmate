-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "taxCode" TEXT,
ADD COLUMN     "taxLookup" JSONB;

-- CreateIndex
CREATE INDEX "Company_taxCode_idx" ON "Company"("taxCode");
