/*
  Warnings:

  - You are about to drop the column `hasRecording` on the `questions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "questions" DROP COLUMN "hasRecording",
ADD COLUMN     "recording" TEXT;
