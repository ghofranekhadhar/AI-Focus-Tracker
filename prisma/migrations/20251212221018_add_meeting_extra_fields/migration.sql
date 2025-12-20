-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "actionItems" JSONB,
ADD COLUMN     "agenda" JSONB,
ADD COLUMN     "decisions" JSONB,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "nextSteps" TEXT[];

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "priority" TEXT;
