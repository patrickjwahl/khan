/*
  Warnings:

  - You are about to drop the column `lesson_index` on the `user_course` table. All the data in the column will be lost.
  - You are about to drop the column `module_index` on the `user_course` table. All the data in the column will be lost.
  - Added the required column `lesson_id` to the `user_course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `module_id` to the `user_course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_course" DROP COLUMN "lesson_index",
DROP COLUMN "module_index",
ADD COLUMN     "lesson_id" INTEGER NOT NULL,
ADD COLUMN     "module_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "user_course" ADD CONSTRAINT "user_course_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_course" ADD CONSTRAINT "user_course_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
