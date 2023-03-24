/*
  Warnings:

  - You are about to drop the column `lessonNum` on the `modules` table. All the data in the column will be lost.
  - You are about to drop the column `screenId` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the `info_screens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `screens` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `courseId` on table `modules` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `lessonId` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "info_screens" DROP CONSTRAINT "info_screens_screenId_fkey";

-- DropForeignKey
ALTER TABLE "modules" DROP CONSTRAINT "modules_courseId_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_screenId_fkey";

-- DropForeignKey
ALTER TABLE "screens" DROP CONSTRAINT "screens_moduleId_fkey";

-- DropIndex
DROP INDEX "questions_screenId_key";

-- AlterTable
ALTER TABLE "modules" DROP COLUMN "lessonNum",
ALTER COLUMN "courseId" SET NOT NULL;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "screenId",
ADD COLUMN     "lessonId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "info_screens";

-- DropTable
DROP TABLE "screens";

-- DropEnum
DROP TYPE "screen_types";

-- CreateTable
CREATE TABLE "lessons" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "moduleId" INTEGER NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
