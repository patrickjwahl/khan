/*
  Warnings:

  - You are about to drop the column `content` on the `lessons` table. All the data in the column will be lost.
  - Added the required column `index` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "questions_types" ADD VALUE 'INFO';

-- AlterTable
ALTER TABLE "lessons" DROP COLUMN "content";

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "difficulty" INTEGER,
ADD COLUMN     "index" INTEGER NOT NULL,
ADD COLUMN     "info" TEXT,
ADD COLUMN     "pass" INTEGER;
