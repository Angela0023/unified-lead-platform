import { fetchJson } from "@/lib/http";
import { config } from "@/lib/config";
import type {
  ApifyRunInput,
  ApifyCompanyResult,
  ApifyRunStatus,
  AuthCheckResult,
} from "./types";
import {
  ApifyAuthError,
  ApifyError,
  ApifyTimeoutError,
  ApifyRunError,
} from "./errors";

const BASE_URL = "https://api.apify.com/v2";
const ACTOR_ID = "apify/linkedin-sales-navigator-company-scraper";

export const apifyClient = {
  async testConnection(): Promise<AuthCheckResult> {
    try {
      await fetchJson(`${BASE_URL}/actor-tasks`, {
        headers: { Authorization: `Bearer ${config.apifyApiKey}` },
      });
      return { authenticated: true };
    } catch (error) {
      return {
        authenticated: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  async runActor(input: ApifyRunInput): Promise<string> {
    try {
      const response = await fetchJson<{ data: { id: string } }>(
        `${BASE_URL}/acts/${ACTOR_ID}/runs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apifyApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        },
      );

      return response.data.id;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("401") || error.message.includes("403"))
      ) {
        throw new ApifyAuthError(
          `Authentication failed: ${error.message}`,
        );
      }
      throw new ApifyError(
        `Failed to start actor: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },

  async pollRunStatus(runId: string): Promise<ApifyRunStatus> {
    try {
      const response = await fetchJson<{
        data: { status: string; defaultDatasetId?: string };
      }>(`${BASE_URL}/actor-runs/${runId}`, {
        headers: { Authorization: `Bearer ${config.apifyApiKey}` },
      });

      return {
        status: response.data.status,
        defaultDatasetId: response.data.defaultDatasetId,
      };
    } catch (error) {
      throw new ApifyError(
        `Failed to poll run status: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },

  async getResults(datasetId: string): Promise<ApifyCompanyResult[]> {
    try {
      const response = await fetchJson<ApifyCompanyResult[]>(
        `${BASE_URL}/datasets/${datasetId}/items`,
        {
          headers: { Authorization: `Bearer ${config.apifyApiKey}` },
        },
      );

      return response || [];
    } catch (error) {
      throw new ApifyError(
        `Failed to get results: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },

  async searchCompanies(
    params: ApifyRunInput,
  ): Promise<ApifyCompanyResult[]> {
    // Run actor
    const runId = await this.runActor(params);

    // Poll until complete (max 5 minutes)
    const maxAttempts = 60; // 5 minutes (5s intervals)
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5s

      const status = await this.pollRunStatus(runId);

      if (status.status === "SUCCEEDED" && status.defaultDatasetId) {
        return this.getResults(status.defaultDatasetId);
      }

      if (status.status === "FAILED") {
        throw new ApifyRunError("Actor run failed");
      }
    }

    throw new ApifyTimeoutError("Actor run timeout (5 minutes)");
  },
};
