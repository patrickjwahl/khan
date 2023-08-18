/*
  Warnings:

  - You are about to drop the column `lastLesson` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "lastLesson",
ADD COLUMN     "last_lesson" TEXT DEFAULT 'Thu Jan 01 1970';
