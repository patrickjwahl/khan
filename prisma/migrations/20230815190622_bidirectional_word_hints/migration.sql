/*
  Warnings:

  - You are about to drop the column `question_id` on the `word_hints` table. All the data in the column will be lost.
  - You are about to drop the column `nativeAlt` on the `words` table. All the data in the column will be lost.
  - You are about to drop the column `targetAlt` on the `words` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "word_hints" DROP CONSTRAINT "word_hints_question_id_fkey";

-- AlterTable
ALTER TABLE "word_hints" RENAME COLUMN "question_id" TO "backward_question_id";
ALTER TABLE "word_hints" ADD COLUMN     "forward_question_id" INTEGER;

-- AlterTable
ALTER TABLE "words" RENAME COLUMN "nativeAlt" TO "native_alt";
ALTER TABLE "words" RENAME COLUMN "targetAlt" TO "target_alt";

-- AddForeignKey
ALTER TABLE "word_hints" ADD CONSTRAINT "word_hints_forward_question_id_fkey" FOREIGN KEY ("forward_question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_hints" ADD CONSTRAINT "word_hints_backward_question_id_fkey" FOREIGN KEY ("backward_question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
