/*
  Warnings:

  - You are about to drop the `WordHint` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "WordHint" DROP CONSTRAINT "WordHint_question_id_fkey";

-- DropForeignKey
ALTER TABLE "WordHint" DROP CONSTRAINT "WordHint_wordEntityId_fkey";

-- DropTable
DROP TABLE "WordHint";

-- CreateTable
CREATE TABLE "word_hints" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "word_string" TEXT NOT NULL,
    "wordEntityId" INTEGER,

    CONSTRAINT "word_hints_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "word_hints" ADD CONSTRAINT "word_hints_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_hints" ADD CONSTRAINT "word_hints_wordEntityId_fkey" FOREIGN KEY ("wordEntityId") REFERENCES "words"("id") ON DELETE SET NULL ON UPDATE CASCADE;
