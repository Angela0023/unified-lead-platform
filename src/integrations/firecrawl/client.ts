import { config } from "@/lib/config";
import { fetchJson, retryWithBackoff } from "@/lib/http";
import { demo } from "@/lib/demo-data";
import { FirecrawlError } from "./errors";
import type { AuthCheckResult, CreditsResult, ScrapeResult } from "./types";

const BASE_URL = "https://api.firecrawl.dev/v2";

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.firecrawlApiKey}`,
  };
}

/** Normalizes a website URL to a scrapeable https URL. */
export function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

export const firecrawlClient = {
  /** Verifies the API key is valid. */
  async testConnection(): Promise<AuthCheckResult> {
    if (config.demoMode) return demo.firecrawlAuth();
    if (!config.firecrawlApiKey) {
      return { authenticated: false, message: "FIRECRAWL_API_KEY not set" };
    }
    try {
      const response = await fetchJson<{
        success?: boolean;
        data?: { remainingCredits?: number };
      }>(`${BASE_URL}/team/credit-usage`, {
        method: "GET",
        headers: headers(),
        timeoutMs: 15_000,
      });
      return {
        authenticated: response.success === true,
        message: `Credits: ${response.data?.remainingCredits ?? "unknown"}`,
      };
    } catch (error) {
      return {
        authenticated: false,
        message: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },

  /** Current credit balance (null when unavailable). */
  async getCreditsRemaining(): Promise<CreditsResult> {
    if (config.demoMode) return demo.firecrawlCredits();
    if (!config.firecrawlApiKey) return { credits: null };
    try {
      const response = await fetchJson<{
        data?: { remainingCredits?: number };
      }>(`${BASE_URL}/team/credit-usage`, {
        method: "GET",
        headers: headers(),
        timeoutMs: 15_000,
      });
      return { credits: response.data?.remainingCredits ?? null };
    } catch {
      return { credits: null };
    }
  },

  /** Website scraping (Stage 4 / Phase 2): homepage + about content as markdown. */
  async scrape(url: string): Promise<ScrapeResult> {
    if (config.demoMode) return demo.firecrawlScrape(url);
    try {
      const response = await retryWithBackoff(() =>
        fetchJson<{
          success?: boolean;
          data?: { markdown?: string };
        }>(`${BASE_URL}/scrape`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            url: normalizeUrl(url),
            formats: ["markdown"],
          }),
          timeoutMs: 45_000,
        }),
      );
      return {
        url: normalizeUrl(url),
        markdown: response.data?.markdown ?? "",
        success: response.success ?? true,
      };
    } catch (error) {
      if (error instanceof FirecrawlError) throw error;
      throw new FirecrawlError(
        error instanceof Error ? error.message : "Firecrawl scrape failed",
        0,
        false,
      );
    }
  },
};
