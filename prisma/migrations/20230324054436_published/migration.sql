-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false;
