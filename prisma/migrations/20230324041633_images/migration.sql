-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_lessonId_fkey";

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "image" TEXT,
ALTER COLUMN "index" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
