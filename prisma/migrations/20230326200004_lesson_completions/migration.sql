/*
  Warnings:

  - You are about to drop the `UserCourse` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserCourse" DROP CONSTRAINT "UserCourse_course_id_fkey";

-- DropForeignKey
ALTER TABLE "UserCourse" DROP CONSTRAINT "UserCourse_user_id_fkey";

-- DropTable
DROP TABLE "UserCourse";

-- CreateTable
CREATE TABLE "user_course" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "lesson_index" INTEGER NOT NULL DEFAULT 0,
    "lesson_completions" INTEGER NOT NULL DEFAULT 0,
    "module_index" INTEGER NOT NULL DEFAULT 0,
    "is_current" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_course_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_course" ADD CONSTRAINT "user_course_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_course" ADD CONSTRAINT "user_course_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
