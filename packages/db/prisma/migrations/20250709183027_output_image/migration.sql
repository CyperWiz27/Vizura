/*
  Warnings:

  - The values [Generator] on the enum `OutputImageStatusEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OutputImageStatusEnum_new" AS ENUM ('Pending', 'Generated', 'Failed');
ALTER TABLE "OutputImage" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "OutputImage" ALTER COLUMN "status" TYPE "OutputImageStatusEnum_new" USING ("status"::text::"OutputImageStatusEnum_new");
ALTER TYPE "OutputImageStatusEnum" RENAME TO "OutputImageStatusEnum_old";
ALTER TYPE "OutputImageStatusEnum_new" RENAME TO "OutputImageStatusEnum";
DROP TYPE "OutputImageStatusEnum_old";
ALTER TABLE "OutputImage" ALTER COLUMN "status" SET DEFAULT 'Pending';
COMMIT;
