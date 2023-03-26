-- DropForeignKey
ALTER TABLE "words" DROP CONSTRAINT "words_moduleId_fkey";

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "words_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
