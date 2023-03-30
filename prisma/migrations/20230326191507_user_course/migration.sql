-- AlterTable
ALTER TABLE "UserCourse" ADD COLUMN     "is_current" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lesson_index" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "module_index" INTEGER NOT NULL DEFAULT 0;
