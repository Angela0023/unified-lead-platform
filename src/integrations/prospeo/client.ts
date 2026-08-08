import { fetchJson } from "@/lib/http";
import { config } from "@/lib/config";
import type {
  AuthCheckResult,
  CreditsResult,
  ProspeoCompanySearchParams,
  ProspeoCompany,
} from "./types";
import { ProspeoAuthError, ProspeoError } from "./errors";

const BASE_URL = "https://api.prospeo.io/v1";

export const prospeoClient = {
  async testConnection(): Promise<AuthCheckResult> {
    try {
      await fetchJson(`${BASE_URL}/account`, {
        headers: { "X-API-Key": config.prospeoApiKey },
      });
      return { authenticated: true };
    } catch (error) {
      return {
        authenticated: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  async getCreditsRemaining(): Promise<CreditsResult> {
    try {
      const response = await fetchJson<{ credits_remaining?: number }>(
        `${BASE_URL}/account`,
        {
          headers: { "X-API-Key": config.prospeoApiKey },
        },
      );
      return { credits: response.credits_remaining || 0 };
    } catch (error) {
      throw new ProspeoAuthError(
        `Failed to get credits: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },

  async searchCompanies(
    params: ProspeoCompanySearchParams,
  ): Promise<ProspeoCompany[]> {
    const body = {
      filters: {
        company_industries: params.industries,
        company_locations: params.locations,
        company_employee_count_min: params.employeeCountMin,
        company_employee_count_max: params.employeeCountMax,
      },
      limit: params.limit || 100,
    };

    try {
      const response = await fetchJson<{ companies?: ProspeoCompany[] }>(
        `${BASE_URL}/company/search`,
        {
          method: "POST",
          headers: {
            "X-API-Key": config.prospeoApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      return response.companies || [];
    } catch (error) {
      throw new ProspeoError(
        `Company search failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
};
