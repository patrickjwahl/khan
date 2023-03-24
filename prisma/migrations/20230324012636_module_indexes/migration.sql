-- AlterTable
ALTER TABLE "lessons" ALTER COLUMN "index" DROP DEFAULT;

-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "index" INTEGER NOT NULL DEFAULT 0;
