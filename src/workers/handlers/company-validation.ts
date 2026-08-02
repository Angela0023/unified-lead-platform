import { prisma } from "../../lib/db";
import { firecrawlClient } from "../../integrations/firecrawl/client";
import { deepseekClient } from "../../integrations/deepseek/client";
import { config } from "../../lib/config";
import {
  completePhaseJob,
  enqueueNextPhase,
  failPhaseJob,
  failSearch,
  phaseProgress,
  startPhaseJob,
  updateJobProgress,
  updateSearchProgress,
} from "../../lib/pipeline";

const SCRAPE_RATE_LIMIT_DELAY_MS = 6_000; // Firecrawl ~10 req/min

/**
 * Phase 2: Company Validation (WORKFLOW.md Stage 4).
 * Scrapes each discovered company's website, scores it against the ICP
 * with DeepSeek (1-5), and marks it VALIDATED (score 2-5) or REJECTED
 * (score 1). Checkpoint saved after every 50 companies.
 *
 * Graceful failure: one failed company (scrape/validation) never stops
 * the search - it is marked FAILED and processing continues.
 */
export async function handleCompanyValidation(searchId: string) {
  const search = await prisma.search.findUniqueOrThrow({
    where: { id: searchId },
  });
  const job = await startPhaseJob(searchId, "company-validation");

  try {
    const companies = await prisma.company.findMany({
      where: { searchId, status: "DISCOVERED" },
      orderBy: { createdAt: "asc" },
    });

    console.log(
      `[pipeline] Validating ${companies.length} companies for search ${searchId}`,
    );

    let validated = 0;
    let rejected = 0;
    let failed = 0;

    for (let i = 0; i < companies.length; i += 50) {
      const batch = companies.slice(i, i + 50);

      for (const company of batch) {
        try {
          // Scrape website (30s timeout handled by client)
          const scraped = await firecrawlClient.scrape(company.website);
          if (!config.demoMode) {
            // Respect Firecrawl rate limits (~10 req/min)
            await new Promise((resolve) =>
              setTimeout(resolve, SCRAPE_RATE_LIMIT_DELAY_MS),
            );
          }

          // AI validation against ICP
          const verdict = await deepseekClient.validate(
            {
              name: company.name,
              website: company.website,
              scrapedContent: scraped.markdown,
            },
            search.icpPrompt,
          );

          const status = verdict.score === 1 ? "REJECTED" : "VALIDATED";
          await prisma.company.update({
            where: { id: company.id },
            data: {
              score: verdict.score,
              scoreReasoning: verdict.reasoning,
              scrapedData: {
                markdown: scraped.markdown,
                conflicts: verdict.conflicts,
              },
              status,
            },
          });

          if (status === "VALIDATED") validated++;
          else rejected++;
        } catch (error) {
          failed++;
          await prisma.company.update({
            where: { id: company.id },
            data: {
              status: "FAILED",
              errorMessage:
                error instanceof Error ? error.message : "Validation failed",
            },
          });
        }
      }

      // CHECKPOINT after every 50 companies
      const processed = Math.min(i + 50, companies.length);
      await updateJobProgress(
        job.id,
        Math.round((processed / companies.length) * 100),
      );
      await updateSearchProgress(
        searchId,
        "company-validation",
        phaseProgress("company-validation", processed / companies.length),
        { companiesValidated: validated },
      );
      console.log(
        `[pipeline] Validation checkpoint: ${processed}/${companies.length} companies (${validated} validated, ${rejected} rejected, ${failed} failed)`,
      );
    }

    await updateSearchProgress(searchId, "company-validation", 45, {
      companiesValidated: validated,
    });
    await completePhaseJob(job.id);
    await enqueueNextPhase("company-validation", searchId);
    console.log(
      `[pipeline] Validation complete for ${searchId}: ${validated} validated, ${rejected} rejected, ${failed} failed`,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Company validation failed";
    console.error(`[pipeline] Validation failed for ${searchId}:`, error);
    await failPhaseJob(job.id, message);
    await failSearch(searchId, message);
    throw error;
  }
}
