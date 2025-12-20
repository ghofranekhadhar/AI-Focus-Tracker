-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "aiGeneratedMinutes" TEXT,
ADD COLUMN     "minutesGeneratedAt" TIMESTAMP(3);
