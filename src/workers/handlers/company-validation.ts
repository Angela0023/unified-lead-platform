import { prisma } from "../../lib/db";
import { firecrawlClient } from "../../integrations/firecrawl/client";
import { deepseekClient } from "../../integrations/deepseek/client";
import { config } from "../../lib/config";
import { guardFirecrawlCredits, guardDeepSeekBalance } from "../../lib/credit-guards";
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
import { checkQuality } from "../../lib/quality-rules";

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

    // Cost guards: never start scraping/validation if credits are too low.
    // DeepSeek's balance endpoint is known to serve stale cached values,
    // so use a hard floor instead of a proportional estimate (a false
    // positive would block searches that actually have plenty of balance).
    await guardFirecrawlCredits(companies.length + 25);
    await guardDeepSeekBalance(0.5);

    console.log(
      `[pipeline] Validating ${companies.length} companies for search ${searchId}`,
    );

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

        } catch (error) {
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
      );

      // Quality check
      const allCompanies = await prisma.company.findMany({
        where: {
          searchId,
          status: { in: ["VALIDATED", "REJECTED"] },
        },
      });

      const qualityCheck = checkQuality(
        allCompanies,
        search.targetCompanyCount || 500,
      );

      // Update search with quality metrics
      await prisma.search.update({
        where: { id: searchId },
        data: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          qualityDistribution: qualityCheck.distribution as any,
          qualityWarnings: qualityCheck.warnings,
        },
      });

      console.log(
        `[pipeline] Validation checkpoint: ${processed}/${companies.length} companies processed`,
      );
      console.log(
        `[quality] Score distribution: 1=${qualityCheck.distribution.score1}, 2=${qualityCheck.distribution.score2}, 3=${qualityCheck.distribution.score3}, 4=${qualityCheck.distribution.score4}, 5=${qualityCheck.distribution.score5}`,
      );
    }

    // Idempotent stats: count actual DB state (safe on re-runs)
    const validated = await prisma.company.count({
      where: { searchId, status: "VALIDATED" },
    });
    await updateSearchProgress(searchId, "company-validation", 45, {
      companiesValidated: validated,
    });
    await completePhaseJob(job.id);
    await enqueueNextPhase("company-validation", searchId);
    console.log(
      `[pipeline] Validation complete for ${searchId}: ${validated} validated (from DB)`,
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
