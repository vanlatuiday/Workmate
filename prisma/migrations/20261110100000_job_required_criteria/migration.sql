-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "requireAllSlots" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[];
