/*
  Warnings:

  - You are about to drop the `TrainingImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TrainingImage" DROP CONSTRAINT "TrainingImage_modelId_fkey";

-- DropTable
DROP TABLE "TrainingImage";
