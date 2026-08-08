-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "discoveryRound" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "discoverySource" TEXT;

-- AlterTable
ALTER TABLE "Search" ADD COLUMN     "leadsPerCompany" INTEGER,
ADD COLUMN     "qualityDistribution" JSONB,
ADD COLUMN     "qualityWarnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "targetCompanyCount" INTEGER;

-- CreateTable
CREATE TABLE "DiscoveryAttempt" (
    "id" TEXT NOT NULL,
    "searchId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "isDryRun" BOOLEAN NOT NULL DEFAULT false,
    "sampleSize" INTEGER NOT NULL,
    "companiesFound" INTEGER NOT NULL,
    "avgQualityScore" DOUBLE PRECISION,
    "costEstimate" DOUBLE PRECISION,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DiscoveryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscoveryAttempt_searchId_source_idx" ON "DiscoveryAttempt"("searchId", "source");

-- CreateIndex
CREATE INDEX "DiscoveryAttempt_round_idx" ON "DiscoveryAttempt"("round");

-- CreateIndex
CREATE INDEX "Company_discoverySource_idx" ON "Company"("discoverySource");

-- CreateIndex
CREATE INDEX "Company_discoveryRound_idx" ON "Company"("discoveryRound");

-- AddForeignKey
ALTER TABLE "DiscoveryAttempt" ADD CONSTRAINT "DiscoveryAttempt_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "Search"("id") ON DELETE CASCADE ON UPDATE CASCADE;
