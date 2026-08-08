import { prisma } from "../../lib/db";
import { DiscoveryOrchestrator } from "../../lib/discovery-orchestrator";
import {
  completePhaseJob,
  enqueueNextPhase,
  failPhaseJob,
  failSearch,
  startPhaseJob,
  updateJobProgress,
  updateSearchProgress,
} from "../../lib/pipeline";

/**
 * Phase 1: Company Discovery (WORKFLOW.md Stage 3).
 * Uses DiscoveryOrchestrator to query multiple sources (Apollo, Sales Navigator,
 * Prospeo, Exa AI) with dry-run testing to save credits. Saves companies with
 * status DISCOVERED, then chains to company validation.
 *
 * Idempotent: if companies already exist for this search (crash recovery),
 * the phase is skipped and the pipeline continues.
 */
export async function handleCompanyDiscovery(searchId: string) {
  const search = await prisma.search.findUniqueOrThrow({
    where: { id: searchId },
  });
  const job = await startPhaseJob(searchId, "company-discovery");

  try {
    const existing = await prisma.company.count({ where: { searchId } });
    if (existing > 0) {
      console.log(
        `[pipeline] ${existing} companies already stored for search ${searchId}, skipping discovery`,
      );
      await updateSearchProgress(searchId, "company-discovery", 15, {
        companiesFound: existing,
      });
      await completePhaseJob(job.id);
      await enqueueNextPhase("company-discovery", searchId);
      return;
    }

    await updateJobProgress(job.id, 0);

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

    // Initial discovery (round 1)
    // Start with ~20% buffer over target (account for expected rejections)
    const initialNeeded = Math.ceil(
      (search.targetCompanyCount || 500) * 1.2,
    );

    console.log(
      `[pipeline] Starting discovery for ${searchId}: need ${initialNeeded} companies (target: ${search.targetCompanyCount || 500})`,
    );

    const companies = await orchestrator.discoverCompanies(
      searchId,
      searchInput,
      1,
      initialNeeded,
    );

    await updateSearchProgress(searchId, "company-discovery", 15, {
      companiesFound: companies.length,
    });

    await completePhaseJob(job.id);
    await enqueueNextPhase("company-discovery", searchId);
    console.log(
      `[pipeline] Discovery complete for ${searchId}: ${companies.length} companies`,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Company discovery failed";
    console.error(`[pipeline] Discovery failed for ${searchId}:`, error);
    await failPhaseJob(job.id, message);
    await failSearch(searchId, message);
    throw error;
  }
}
