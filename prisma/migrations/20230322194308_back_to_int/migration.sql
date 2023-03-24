/*
  Warnings:

  - The `recording` column on the `questions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "questions" DROP COLUMN "recording",
ADD COLUMN     "recording" SERIAL NOT NULL;
