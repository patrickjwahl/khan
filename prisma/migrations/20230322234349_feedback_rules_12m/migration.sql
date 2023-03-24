/*
  Warnings:

  - You are about to drop the `_FeedbackRuleToQuestion` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `questionId` to the `feedback_rules` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_FeedbackRuleToQuestion" DROP CONSTRAINT "_FeedbackRuleToQuestion_A_fkey";

-- DropForeignKey
ALTER TABLE "_FeedbackRuleToQuestion" DROP CONSTRAINT "_FeedbackRuleToQuestion_B_fkey";

-- AlterTable
ALTER TABLE "feedback_rules" ADD COLUMN     "questionId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_FeedbackRuleToQuestion";

-- AddForeignKey
ALTER TABLE "feedback_rules" ADD CONSTRAINT "feedback_rules_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
