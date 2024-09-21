-- DropForeignKey
ALTER TABLE "user_course" DROP CONSTRAINT "user_course_lesson_id_fkey";

-- AlterTable
ALTER TABLE "user_course" ALTER COLUMN "lesson_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "user_course" ADD CONSTRAINT "user_course_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
