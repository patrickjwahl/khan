-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastLesson" TIMESTAMP(3),
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0;
