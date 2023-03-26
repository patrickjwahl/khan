/*
  Warnings:

  - You are about to drop the column `pass` on the `questions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "questions" DROP COLUMN "pass",
ADD COLUMN     "firstPass" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "module_id" INTEGER NOT NULL DEFAULT 5,
ALTER COLUMN "lesson_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
