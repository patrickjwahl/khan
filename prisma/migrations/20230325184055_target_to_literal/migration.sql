-- AlterTable
ALTER TABLE "questions" ALTER COLUMN "target" DROP NOT NULL,
ALTER COLUMN "target" SET DATA TYPE TEXT;
