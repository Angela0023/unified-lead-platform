import { config } from "@/lib/config";
import { fetchJson, retryWithBackoff } from "@/lib/http";
import { demo } from "@/lib/demo-data";
import { ApolloError } from "./errors";
import type {
  ApolloCompany,
  ApolloPerson,
  AuthCheckResult,
  CreditBalanceResult,
  FindContactsParams,
  SearchCompaniesParams,
  SearchCompaniesResult,
} from "./types";

const BASE_URL = "https://api.apollo.io/v1";

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Api-Key": config.apolloApiKey,
  };
}

function normalizeCompany(raw: Record<string, unknown>): ApolloCompany {
  const count = raw.organization_employee_count_company_wide
    ? Number(raw.organization_employee_count_company_wide)
    : raw.employee_count
      ? Number(raw.employee_count)
      : undefined;
  const locationParts = [
    raw.city,
    raw.state,
    raw.country === "us" ? "United States" : raw.country,
  ]
    .filter(Boolean)
    .map((part) => String(part));

  return {
    id: String(raw.id),
    name: String(raw.name ?? "Unknown"),
    domain: String(raw.primary_domain ?? raw.domain ?? ""),
    website: raw.website ? String(raw.website) : undefined,
    industry: raw.industry ? String(raw.industry) : undefined,
    employeeCount: Number.isNaN(Number(count)) ? undefined : Number(count),
    city: raw.city ? String(raw.city) : undefined,
    state: raw.state ? String(raw.state) : undefined,
    country: raw.country ? String(raw.country) : undefined,
    organizationSize: raw.organization_num_employees
      ? String(raw.organization_num_employees)
      : undefined,
    ...(locationParts.length > 0 ? { location: locationParts.join(", ") } : {}),
  } as ApolloCompany;
}

function normalizePerson(raw: Record<string, unknown>): ApolloPerson {
  return {
    id: String(raw.id),
    name: String(raw.name ?? "Unknown"),
    title: raw.title ? String(raw.title) : undefined,
    email: raw.email ? String(raw.email) : null,
    linkedinUrl: raw.linkedin_url ? String(raw.linkedin_url) : null,
    organizationId: raw.organization_id
      ? String(raw.organization_id)
      : undefined,
  };
}

async function request<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  try {
    const response = await retryWithBackoff(() =>
      fetchJson<T>(`${BASE_URL}${path}`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
        timeoutMs: 30_000,
      }),
    );
    return response;
  } catch (error) {
    if (error instanceof ApolloError) throw error;
    throw new ApolloError(
      error instanceof Error ? error.message : "Apollo request failed",
      "status" in (error as object) ? (error as { status: number }).status : 0,
      "retryable" in (error as object) &&
        (error as { retryable: boolean }).retryable,
    );
  }
}

export const apolloClient = {
  /** Verifies the API key is valid and authenticated. */
  async testConnection(): Promise<AuthCheckResult> {
    if (config.demoMode) return demo.apolloAuth();
    if (!config.apolloApiKey) {
      return { authenticated: false, message: "APOLLO_API_KEY not set" };
    }
    try {
      const response = await fetchJson<{
        data: { status?: string };
      }>(`${BASE_URL}/auth/check`, {
        method: "GET",
        headers: headers(),
        timeoutMs: 15_000,
      });
      const status = response.data?.status;
      return {
        authenticated: status === "valid" || status === "authenticated",
        message: status ? `Status: ${status}` : "Unknown status",
      };
    } catch (error) {
      return {
        authenticated: false,
        message: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },

  /** Current credit balance (null when the endpoint is unavailable). */
  async getCreditsRemaining(): Promise<CreditBalanceResult> {
    if (config.demoMode) return demo.apolloCredits();
    if (!config.apolloApiKey) return { credits: null };
    try {
      const response = await fetchJson<{
        credit_balance?: number;
      }>(`${BASE_URL}/auth/credit_balance`, {
        method: "GET",
        headers: headers(),
        timeoutMs: 15_000,
      });
      return { credits: response.credit_balance ?? null };
    } catch {
      return { credits: null };
    }
  },

  /**
   * Company discovery (Stage 3 / Phase 1).
   * Single bulk query; returns up to perPage companies plus the total match count.
   */
  async searchCompanies(
    params: SearchCompaniesParams,
  ): Promise<SearchCompaniesResult> {
    if (config.demoMode) {
      return demo.apolloCompanies(params);
    }
    const body: Record<string, unknown> = {
      filters: {
        industries: params.industries,
        organization_locations: params.locations,
        employee_count: {
          min: params.employeeCountMin ?? 1,
          ...(params.employeeCountMax ? { max: params.employeeCountMax } : {}),
        },
      },
      page: params.page ?? 1,
      per_page: params.perPage ?? 25,
    };
    const response = await request<{
      organizations?: Record<string, unknown>[];
      pagination?: { total_entries?: number };
    }>("/mixed_companies/search", body);

    return {
      companies: (response.organizations ?? []).map(normalizeCompany),
      totalEntries: response.pagination?.total_entries ?? 0,
    };
  },

  /** Contact discovery (Stage 5 / Phase 3): decision makers at one company. */
  async findContacts(params: FindContactsParams): Promise<ApolloPerson[]> {
    if (config.demoMode) {
      return demo.apolloContacts(params);
    }
    const body: Record<string, unknown> = {
      filters: {
        organization_ids: [params.organizationId],
        person_titles: [params.title],
      },
      page: 1,
      per_page: params.limit ?? 2,
    };
    const response = await request<{
      people?: Record<string, unknown>[];
    }>("/people/search", body);
    return (response.people ?? []).map(normalizePerson);
  },

  /** Email enrichment (Stage 6 / Phase 4): reveal email for a person by id. */
  async getEmail(personId: string): Promise<string | null> {
    if (config.demoMode) return demo.apolloEmail(personId);
    const body: Record<string, unknown> = {
      id: personId,
      reveal_personal_emails: false,
    };
    const response = await request<{
      person?: Record<string, unknown>;
    }>("/people/match", body);
    const email = response.person?.email;
    return email ? String(email) : null;
  },
};
