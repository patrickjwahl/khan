/*
  Warnings:

  - Added the required column `title` to the `lessons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `modules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "title" TEXT NOT NULL;
