-- AlterTable
ALTER TABLE "SeekerExperience" ADD COLUMN     "bullets" TEXT[];

-- AlterTable
ALTER TABLE "SeekerProfile" ADD COLUMN     "birthDate" DATE,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "headline" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "hobbies" TEXT[],
ADD COLUMN     "showPersonal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "skillLevels" JSONB NOT NULL DEFAULT '{}';
