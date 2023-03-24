-- CreateEnum
CREATE TYPE "ScreenType" AS ENUM ('QUESTION', 'INFO');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TARGET', 'NATIVE', 'LISTENING');

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" SERIAL NOT NULL,
    "lessonNum" INTEGER NOT NULL,
    "courseId" INTEGER,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Screen" (
    "id" SERIAL NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "type" "ScreenType" NOT NULL,

    CONSTRAINT "Screen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfoScreen" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "screenId" INTEGER,

    CONSTRAINT "InfoScreen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "type" "QuestionType" NOT NULL,
    "question" TEXT,
    "answers" TEXT[],
    "recording" INTEGER,
    "screenId" INTEGER,
    "notes" TEXT[],

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackRule" (
    "id" SERIAL NOT NULL,
    "trigger" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,

    CONSTRAINT "FeedbackRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FeedbackRuleToQuestion" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "InfoScreen_screenId_key" ON "InfoScreen"("screenId");

-- CreateIndex
CREATE UNIQUE INDEX "Question_screenId_key" ON "Question"("screenId");

-- CreateIndex
CREATE UNIQUE INDEX "_FeedbackRuleToQuestion_AB_unique" ON "_FeedbackRuleToQuestion"("A", "B");

-- CreateIndex
CREATE INDEX "_FeedbackRuleToQuestion_B_index" ON "_FeedbackRuleToQuestion"("B");

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Screen" ADD CONSTRAINT "Screen_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfoScreen" ADD CONSTRAINT "InfoScreen_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "Screen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "Screen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FeedbackRuleToQuestion" ADD CONSTRAINT "_FeedbackRuleToQuestion_A_fkey" FOREIGN KEY ("A") REFERENCES "FeedbackRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FeedbackRuleToQuestion" ADD CONSTRAINT "_FeedbackRuleToQuestion_B_fkey" FOREIGN KEY ("B") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
