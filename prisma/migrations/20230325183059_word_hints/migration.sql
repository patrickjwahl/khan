/*
  Warnings:

  - The values [TARGET_TO_NATIVE,NATIVE_TO_TARGET,LISTENING] on the enum `questions_types` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `answers` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `questions` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "questions_types_new" AS ENUM ('QUESTION', 'INFO');
ALTER TABLE "questions" ALTER COLUMN "type" TYPE "questions_types_new" USING ("type"::text::"questions_types_new");
ALTER TYPE "questions_types" RENAME TO "questions_types_old";
ALTER TYPE "questions_types_new" RENAME TO "questions_types";
DROP TYPE "questions_types_old";
COMMIT;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "answers",
DROP COLUMN "question",
ADD COLUMN     "native" TEXT,
ADD COLUMN     "target" TEXT[];

-- CreateTable
CREATE TABLE "WordHint" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "word_string" TEXT NOT NULL,
    "wordEntityId" INTEGER,

    CONSTRAINT "WordHint_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WordHint" ADD CONSTRAINT "WordHint_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordHint" ADD CONSTRAINT "WordHint_wordEntityId_fkey" FOREIGN KEY ("wordEntityId") REFERENCES "words"("id") ON DELETE SET NULL ON UPDATE CASCADE;
