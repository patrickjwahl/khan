/*
  Warnings:

  - You are about to drop the column `checkpoints` on the `courses` table. All the data in the column will be lost.
  - Added the required column `isCheckpoint` to the `modules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "courses" DROP COLUMN "checkpoints";

-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "isCheckpoint" BOOLEAN NOT NULL;
