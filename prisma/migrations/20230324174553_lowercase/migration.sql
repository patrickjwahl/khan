/*
  Warnings:

  - You are about to drop the column `ownerId` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `questionId` on the `feedback_rules` table. All the data in the column will be lost.
  - You are about to drop the column `moduleId` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `modules` table. All the data in the column will be lost.
  - You are about to drop the column `isCheckpoint` on the `modules` table. All the data in the column will be lost.
  - You are about to drop the column `infoTitle` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `canEdit` on the `users` table. All the data in the column will be lost.
  - Added the required column `owner_id` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question_id` to the `feedback_rules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `module_id` to the `lessons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course_id` to the `modules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lesson_id` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "feedback_rules" DROP CONSTRAINT "feedback_rules_questionId_fkey";

-- DropForeignKey
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "modules" DROP CONSTRAINT "modules_courseId_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_lessonId_fkey";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "ownerId",
ADD COLUMN     "owner_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "feedback_rules" DROP COLUMN "questionId",
ADD COLUMN     "question_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "moduleId",
ADD COLUMN     "module_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "modules" DROP COLUMN "courseId",
DROP COLUMN "isCheckpoint",
ADD COLUMN     "course_id" INTEGER NOT NULL,
ADD COLUMN     "is_checkpoint" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "infoTitle",
DROP COLUMN "lessonId",
ADD COLUMN     "info_title" TEXT,
ADD COLUMN     "lesson_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "canEdit",
ADD COLUMN     "can_edit" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_rules" ADD CONSTRAINT "feedback_rules_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
