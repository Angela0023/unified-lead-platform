import { prisma } from "../../lib/db";
import { apolloClient } from "../../integrations/apollo/client";
import { parseCompanySize } from "../../lib/constants";
import { config } from "../../lib/config";
import { guardApolloCredits } from "../../lib/credit-guards";
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
 * Queries Apollo for companies matching the search filters, saves them with
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

    const size = parseCompanySize(search.companySize);

    // Cost guard: never start discovery if Apollo credits are too low
    const requiredCredits = config.companiesPerSearch * 3 + 50;
    await guardApolloCredits(requiredCredits);

    const result = await apolloClient.searchCompanies({
      industries: search.industry,
      locations: search.location,
      employeeCountMin: size?.min,
      employeeCountMax: size?.max ?? null,
      page: 1,
      perPage: config.companiesPerSearch,
    });

    const companies = result.companies.map((company) => ({
      searchId,
      name: company.name,
      website: company.domain || company.website || "",
      industry: company.industry,
      size: company.employeeCount,
      location: company.location,
      apolloId: company.id,
      status: "DISCOVERED" as const,
    }));

    // Batch insert with checkpoint (BATCH_SIZE handled by createMany chunking)
    const CHUNK = 50;
    for (let i = 0; i < companies.length; i += CHUNK) {
      const chunk = companies.slice(i, i + CHUNK);
      await prisma.company.createMany({ data: chunk });
      const stored = Math.min(i + CHUNK, companies.length);
      await updateJobProgress(
        job.id,
        Math.round((stored / companies.length) * 100),
      );
      console.log(
        `[pipeline] Discovery checkpoint: ${stored}/${companies.length} companies`,
      );
    }

    await updateSearchProgress(searchId, "company-discovery", 15, {
      companiesFound: companies.length,
    });
    await completePhaseJob(job.id);
    await enqueueNextPhase("company-discovery", searchId);
    console.log(
      `[pipeline] Discovery complete for ${searchId}: ${companies.length} companies (${result.totalEntries} total matches)`,
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
