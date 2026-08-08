import { DiscoveryOrchestrator } from "./discovery-orchestrator";
import { checkQuality } from "./quality-rules";
import { prisma } from "./db";
import { enqueueSearchJob } from "./queue";

const MAX_BACKFILL_ROUNDS = 5;

/**
 * Trigger backfill if quality check indicates we need more companies
 */
export async function triggerBackfillIfNeeded(
  searchId: string,
): Promise<boolean> {
  const search = await prisma.search.findUniqueOrThrow({
    where: { id: searchId },
    include: { companies: true },
  });

  const qualityCheck = checkQuality(
    search.companies,
    search.targetCompanyCount || 500,
  );

  if (qualityCheck.needsBackfill === 0) {
    console.log(`[backfill] No backfill needed (target reached)`);
    return false;
  }

  // Check current round
  const currentRound = Math.max(
    ...search.companies.map((c) => c.discoveryRound),
    0,
  );

  if (currentRound >= MAX_BACKFILL_ROUNDS) {
    console.log(
      `[backfill] Max rounds (${MAX_BACKFILL_ROUNDS}) reached, stopping`,
    );
    return false;
  }

  const nextRound = currentRound + 1;
  console.log(
    `[backfill] Round ${nextRound}: Need ${qualityCheck.needsBackfill} more companies`,
  );

  // Use orchestrator to discover more
  const orchestrator = new DiscoveryOrchestrator();
  const searchInput = {
    industry: search.industry,
    companySize: search.companySize,
    location: search.location,
    targetRole: search.targetRole,
    icpPrompt: search.icpPrompt,
    targetCompanyCount: search.targetCompanyCount || 500,
    leadsPerCompany: search.leadsPerCompany || 2,
  };

  const newCompanies = await orchestrator.discoverCompanies(
    searchId,
    searchInput,
    nextRound,
    qualityCheck.needsBackfill,
  );

  console.log(
    `[backfill] Round ${nextRound}: Found ${newCompanies.length} additional companies`,
  );

  // Queue validation for new companies
  if (newCompanies.length > 0) {
    await enqueueSearchJob("company-validation", searchId);
  }

  return true;
}
