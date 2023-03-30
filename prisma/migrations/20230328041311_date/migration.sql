/*
  Warnings:

  - You are about to drop the column `day` on the `exp` table. All the data in the column will be lost.
  - Added the required column `date` to the `exp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "exp" DROP COLUMN "day",
ADD COLUMN     "date" TEXT NOT NULL;
