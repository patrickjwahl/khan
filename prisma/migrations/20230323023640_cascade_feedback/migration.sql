-- DropForeignKey
ALTER TABLE "feedback_rules" DROP CONSTRAINT "feedback_rules_questionId_fkey";

-- AddForeignKey
ALTER TABLE "feedback_rules" ADD CONSTRAINT "feedback_rules_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
