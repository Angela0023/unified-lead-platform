/**
 * Centralized environment configuration.
 * All env vars are read here so the rest of the app never touches process.env directly.
 */
function boolEnv(name: string, fallback = false): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

function intEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const config = {
  /** Demo mode runs the full pipeline with simulated data (no API keys needed). */
  get demoMode(): boolean {
    return boolEnv("DEMO_MODE");
  },

  /** Maximum companies to discover per search. */
  get companiesPerSearch(): number {
    return intEnv("COMPANIES_PER_SEARCH", 500);
  },

  get apolloApiKey(): string {
    return process.env.APOLLO_API_KEY ?? "";
  },

  get deepseekApiKey(): string {
    return process.env.DEEPSEEK_API_KEY ?? "";
  },

  get firecrawlApiKey(): string {
    return process.env.FIRECRAWL_API_KEY ?? "";
  },

  get millionVerifierApiKey(): string {
    return process.env.MILLION_VERIFIER_API_KEY ?? "";
  },

  get appUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },
};
