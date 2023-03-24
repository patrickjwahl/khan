/*
  Warnings:

  - You are about to drop the `Course` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FeedbackRule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InfoScreen` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Module` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Screen` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "screen_types" AS ENUM ('QUESTION', 'INFO');

-- CreateEnum
CREATE TYPE "questions_types" AS ENUM ('TARGET', 'NATIVE', 'LISTENING');

-- DropForeignKey
ALTER TABLE "InfoScreen" DROP CONSTRAINT "InfoScreen_screenId_fkey";

-- DropForeignKey
ALTER TABLE "Module" DROP CONSTRAINT "Module_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_screenId_fkey";

-- DropForeignKey
ALTER TABLE "Screen" DROP CONSTRAINT "Screen_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "_FeedbackRuleToQuestion" DROP CONSTRAINT "_FeedbackRuleToQuestion_A_fkey";

-- DropForeignKey
ALTER TABLE "_FeedbackRuleToQuestion" DROP CONSTRAINT "_FeedbackRuleToQuestion_B_fkey";

-- DropTable
DROP TABLE "Course";

-- DropTable
DROP TABLE "FeedbackRule";

-- DropTable
DROP TABLE "InfoScreen";

-- DropTable
DROP TABLE "Module";

-- DropTable
DROP TABLE "Question";

-- DropTable
DROP TABLE "Screen";

-- DropEnum
DROP TYPE "QuestionType";

-- DropEnum
DROP TYPE "ScreenType";

-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "language" TEXT NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" SERIAL NOT NULL,
    "lessonNum" INTEGER NOT NULL,
    "courseId" INTEGER,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screens" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "type" "screen_types" NOT NULL,

    CONSTRAINT "screens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "info_screens" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "screenId" INTEGER,

    CONSTRAINT "info_screens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "type" "questions_types" NOT NULL,
    "question" TEXT,
    "answers" TEXT[],
    "recording" INTEGER,
    "screenId" INTEGER,
    "notes" TEXT[],

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_rules" (
    "id" SERIAL NOT NULL,
    "trigger" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,

    CONSTRAINT "feedback_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "info_screens_screenId_key" ON "info_screens"("screenId");

-- CreateIndex
CREATE UNIQUE INDEX "questions_screenId_key" ON "questions"("screenId");

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screens" ADD CONSTRAINT "screens_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "info_screens" ADD CONSTRAINT "info_screens_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "screens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "screens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FeedbackRuleToQuestion" ADD CONSTRAINT "_FeedbackRuleToQuestion_A_fkey" FOREIGN KEY ("A") REFERENCES "feedback_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FeedbackRuleToQuestion" ADD CONSTRAINT "_FeedbackRuleToQuestion_B_fkey" FOREIGN KEY ("B") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
