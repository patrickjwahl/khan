-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "backwardEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "forwardEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "recordingEnabled" BOOLEAN NOT NULL DEFAULT true;
