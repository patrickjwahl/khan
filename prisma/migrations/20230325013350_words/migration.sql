-- AlterTable
ALTER TABLE "questions" ALTER COLUMN "module_id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "words" (
    "id" SERIAL NOT NULL,
    "native" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "recording" TEXT,
    "moduleId" INTEGER NOT NULL,

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "words_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
