import { fetchJson } from "@/lib/http";
import { config } from "@/lib/config";
import type { AuthCheckResult, ExaSearchParams, ExaResult } from "./types";
import { ExaAuthError, ExaError } from "./errors";

const BASE_URL = "https://api.exa.ai";

export const exaClient = {
  async testConnection(): Promise<AuthCheckResult> {
    try {
      // Test with minimal query
      await this.search("test", { numResults: 1 });
      return { authenticated: true };
    } catch (error) {
      return {
        authenticated: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  async search(
    query: string,
    options: Partial<ExaSearchParams> = {},
  ): Promise<ExaResult[]> {
    try {
      const response = await fetchJson<{ results?: ExaResult[] }>(
        `${BASE_URL}/search`,
        {
          method: "POST",
          headers: {
            "x-api-key": config.exaApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            numResults: options.numResults || 10,
            category: options.category,
            type: "neural", // Semantic search
          }),
        },
      );

      return response.results || [];
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("401") || error.message.includes("403"))
      ) {
        throw new ExaAuthError(
          `Authentication failed: ${error.message}`,
        );
      }
      throw new ExaError(
        `Search failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },

  async searchCompanies(
    icpPrompt: string,
    filters: {
      industry?: string[];
      location?: string[];
    },
  ): Promise<ExaResult[]> {
    // Build semantic search query from ICP
    const industryPart = filters.industry?.join(" OR ") || "";
    const locationPart = filters.location?.join(" OR ") || "";
    const query = `B2B companies ${industryPart} ${locationPart} ${icpPrompt}`.trim();

    return this.search(query, { numResults: 50 });
  },
};
