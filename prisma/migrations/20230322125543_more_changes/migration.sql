/*
  Warnings:

  - The values [TARGET,NATIVE] on the enum `questions_types` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "questions_types_new" AS ENUM ('TARGET_TO_NATIVE', 'NATIVE_TO_TARGET', 'LISTENING', 'INFO');
ALTER TABLE "questions" ALTER COLUMN "type" TYPE "questions_types_new" USING ("type"::text::"questions_types_new");
ALTER TYPE "questions_types" RENAME TO "questions_types_old";
ALTER TYPE "questions_types_new" RENAME TO "questions_types";
DROP TYPE "questions_types_old";
COMMIT;
