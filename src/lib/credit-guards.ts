import { config } from "./config";
import { apolloClient } from "@/integrations/apollo/client";
import { firecrawlClient } from "@/integrations/firecrawl/client";
import { mvClient } from "@/integrations/million-verifier/client";
import { deepseekClient } from "@/integrations/deepseek/client";

/**
 * Credit guards: cheap safety checks run BEFORE expensive API work.
 * Each guard makes at most one free balance call, then aborts the phase
 * if the balance is below the estimated requirement - so we never start
 * a search that cannot finish (and never waste partial spend).
 *
 * Guards are skipped when the balance is unknown (null) or in demo mode.
 */

export class InsufficientCreditsError extends Error {
  constructor(service: string, available: number, required: number) {
    super(
      `${service} credits too low for this search: ${available} available, ~${required} required. ` +
        `Top up in the ${service} dashboard or reduce COMPANIES_PER_SEARCH.`,
    );
    this.name = "InsufficientCreditsError";
  }
}

/** Apollo: 1 credit per record returned (search + contacts + email match). */
export async function guardApolloCredits(required: number): Promise<void> {
  if (config.demoMode) return;
  const { credits } = await apolloClient.getCreditsRemaining();
  if (credits !== null && credits < required) {
    throw new InsufficientCreditsError("Apollo", credits, required);
  }
}

/** Firecrawl: 1 credit per scrape. */
export async function guardFirecrawlCredits(required: number): Promise<void> {
  if (config.demoMode) return;
  const { credits } = await firecrawlClient.getCreditsRemaining();
  if (credits !== null && credits < required) {
    throw new InsufficientCreditsError("Firecrawl", credits, required);
  }
}

/** Million Verifier: 1 credit per verification. */
export async function guardMvCredits(required: number): Promise<void> {
  if (config.demoMode) return;
  const { credits } = await mvClient.getCreditsRemaining();
  if (credits !== null && credits < required) {
    throw new InsufficientCreditsError("Million Verifier", credits, required);
  }
}

/** DeepSeek: prepaid balance, ~$0.005-0.01 per validation. */
export async function guardDeepSeekBalance(requiredUsd: number): Promise<void> {
  if (config.demoMode) return;
  const { balance } = await deepseekClient.getBalance();
  if (balance !== null && balance < requiredUsd) {
    throw new InsufficientCreditsError(
      "DeepSeek",
      Math.round(balance * 100) / 100,
      Math.round(requiredUsd * 100) / 100,
    );
  }
}
