-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "apolloId" TEXT;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "apolloId" TEXT;

-- AlterTable
ALTER TABLE "Search" ADD COLUMN     "estimatedCost" DOUBLE PRECISION,
ADD COLUMN     "estimatedTimeMinutes" INTEGER;
