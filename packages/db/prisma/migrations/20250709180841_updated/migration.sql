-- CreateEnum
CREATE TYPE "ModelStatusEnum" AS ENUM ('Pending', 'Generated', 'Failed');

-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "falaiRequestId" TEXT,
ADD COLUMN     "status" "ModelStatusEnum" NOT NULL DEFAULT 'Pending',
ADD COLUMN     "tensorPath" TEXT,
ADD COLUMN     "triggerWord" TEXT;

-- AlterTable
ALTER TABLE "OutputImage" ADD COLUMN     "falaiRequestId" TEXT;
