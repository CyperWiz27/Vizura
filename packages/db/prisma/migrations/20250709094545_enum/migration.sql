/*
  Warnings:

  - The values [EastAsian,SouthAsian,SouthEastAsian,AsianAmerican,MiddleEastern] on the enum `EthnicityEnum` will be removed. If these variants are still used in the database, this will fail.
  - The values [Amber] on the enum `EyeColorEnum` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `age` to the `Model` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EthnicityEnum_new" AS ENUM ('Black', 'White', 'East Asian', 'South Asian', 'South East Asian', 'Asian American', 'Hispanic', 'Middle Eastern', 'Pacific');
ALTER TABLE "Model" ALTER COLUMN "ethnicity" TYPE "EthnicityEnum_new" USING ("ethnicity"::text::"EthnicityEnum_new");
ALTER TYPE "EthnicityEnum" RENAME TO "EthnicityEnum_old";
ALTER TYPE "EthnicityEnum_new" RENAME TO "EthnicityEnum";
DROP TYPE "EthnicityEnum_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EyeColorEnum_new" AS ENUM ('Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Other');
ALTER TABLE "Model" ALTER COLUMN "eyeColor" TYPE "EyeColorEnum_new" USING ("eyeColor"::text::"EyeColorEnum_new");
ALTER TYPE "EyeColorEnum" RENAME TO "EyeColorEnum_old";
ALTER TYPE "EyeColorEnum_new" RENAME TO "EyeColorEnum";
DROP TYPE "EyeColorEnum_old";
COMMIT;

-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "age" INTEGER NOT NULL;
