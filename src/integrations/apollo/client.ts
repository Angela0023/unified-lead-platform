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

/**
 * Apollo API v1 (current spec, verified 2026-08-02):
 * - Base URL: https://api.apollo.io/api/v1
 * - Auth: `x-api-key` header
 * - Search filters are QUERY parameters (arrays as name[]=value)
 * - Credits: 1 credit per company-search page; 1 credit per person
 *   enrich result (0 when nothing found)
 */

const BASE_URL = "https://api.apollo.io/api/v1";

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-key": config.apolloApiKey,
  };
}

/** Builds a query string where arrays become repeated name[]=value pairs. */
function queryString(
  params: Record<string, string | number | string[] | undefined>,
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) searchParams.append(`${key}[]`, item);
      }
    } else {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
}

function normalizeCompany(raw: Record<string, unknown>): ApolloCompany {
  const count = raw.organization_employee_count_company_wide
    ? Number(raw.organization_employee_count_company_wide)
    : raw.employee_count
      ? Number(raw.employee_count)
      : undefined;
  const locationParts = [
    raw.organization_city ?? raw.city,
    raw.organization_state ?? raw.state,
    raw.organization_country ?? raw.country,
  ]
    .filter(Boolean)
    .map((part) => String(part));

  return {
    id: String(raw.organization_id ?? raw.id),
    name: String(raw.name ?? "Unknown"),
    domain: String(raw.primary_domain ?? raw.domain ?? ""),
    website: raw.website_url
      ? String(raw.website_url)
      : raw.website
        ? String(raw.website)
        : undefined,
    industry: raw.industry ? String(raw.industry) : undefined,
    employeeCount: Number.isNaN(Number(count)) ? undefined : Number(count),
    city: raw.organization_city
      ? String(raw.organization_city)
      : raw.city
        ? String(raw.city)
        : undefined,
    state: raw.organization_state
      ? String(raw.organization_state)
      : raw.state
        ? String(raw.state)
        : undefined,
    country: raw.organization_country
      ? String(raw.organization_country)
      : raw.country
        ? String(raw.country)
        : undefined,
    organizationSize: raw.organization_num_employees
      ? String(raw.organization_num_employees)
      : undefined,
    ...(locationParts.length > 0 ? { location: locationParts.join(", ") } : {}),
  } as ApolloCompany;
}

function normalizePerson(raw: Record<string, unknown>): ApolloPerson {
  const org = raw.organization as Record<string, unknown> | undefined;
  const firstName = raw.first_name ? String(raw.first_name) : "";
  const lastName = raw.last_name
    ? String(raw.last_name)
    : raw.last_name_obfuscated
      ? String(raw.last_name_obfuscated)
      : "";
  return {
    id: String(raw.id),
    name: `${firstName} ${lastName}`.trim(),
    title: raw.title ? String(raw.title) : undefined,
    email: raw.email ? String(raw.email) : null,
    linkedinUrl: raw.linkedin_url ? String(raw.linkedin_url) : null,
    organizationId: org?.id ? String(org.id) : undefined,
  };
}

async function request<T>(
  path: string,
  params: Record<string, string | number | string[] | undefined>,
  body: Record<string, unknown> | undefined = undefined,
): Promise<T> {
  try {
    const response = await retryWithBackoff(() =>
      fetchJson<T>(`${BASE_URL}${path}?${queryString(params)}`, {
        method: "POST",
        headers: headers(),
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
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
        is_logged_in?: boolean;
        error?: string;
      }>(`${BASE_URL}/auth/check`, {
        method: "GET",
        headers: headers(),
        timeoutMs: 15_000,
      });
      return {
        authenticated: response.is_logged_in === true,
        message: response.error ?? (response.is_logged_in ? "Authenticated" : "Unknown status"),
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
      const response = await fetchJson<{ credit_balance?: number }>(
        `${BASE_URL}/auth/credit_balance`,
        { method: "GET", headers: headers(), timeoutMs: 15_000 },
      );
      return { credits: response.credit_balance ?? null };
    } catch {
      return { credits: null };
    }
  },

  /**
   * Company discovery (Stage 3 / Phase 1): organization search.
   * 1 Apollo credit per page (per_page up to 100).
   */
  async searchCompanies(
    params: SearchCompaniesParams,
  ): Promise<SearchCompaniesResult> {
    if (config.demoMode) {
      return demo.apolloCompanies(params);
    }
    const sizeRange =
      params.employeeCountMin !== undefined
        ? `${params.employeeCountMin},${params.employeeCountMax ?? 50000}`
        : undefined;
    const response = await request<{
      accounts?: Record<string, unknown>[];
      organizations?: Record<string, unknown>[];
      pagination?: { total_entries?: number };
    }>(
      "/mixed_companies/search",
      {
        organization_locations: params.locations,
        organization_num_employees_ranges: sizeRange
          ? [sizeRange]
          : undefined,
        q_organization_keyword_tags: params.industries,
        page: params.page ?? 1,
        per_page: params.perPage ?? 25,
      },
      {},
    );

    // Apollo returns either `accounts` or `organizations` (sometimes an empty
    // array for the other) - take whichever actually contains results.
    const rawCompanies =
      response.accounts && response.accounts.length > 0
        ? response.accounts
        : (response.organizations ?? []);
    return {
      companies: rawCompanies.map(normalizeCompany),
      totalEntries: response.pagination?.total_entries ?? 0,
    };
  },

  /** Contact discovery (Stage 5 / Phase 3): decision makers at one company. */
  async findContacts(params: FindContactsParams): Promise<ApolloPerson[]> {
    if (config.demoMode) {
      return demo.apolloContacts(params);
    }
    const response = await request<{
      people?: Record<string, unknown>[];
    }>(
      "/mixed_people/api_search",
      {
        q_organization_domains_list: [params.domain],
        person_titles: params.titles,
        // Wider recall: seniority filter catches C-level, VPs and directors
        // even when their exact title differs from the requested role.
        person_seniorities: ["c-suite", "vp", "director"],
        per_page: params.limit ?? 2,
      },
      {},
    );
    return (response.people ?? []).map(normalizePerson);
  },

  /**
   * Email enrichment (Stage 6 / Phase 4): people/match by person id.
   * 1 credit only when an email/demographics result is found.
   */
  async getEmail(personId: string): Promise<string | null> {
    if (config.demoMode) return demo.apolloEmail(personId);
    const response = await request<{
      person?: Record<string, unknown>;
    }>(
      "/people/match",
      {
        id: personId,
        reveal_personal_emails: "false",
      },
      {},
    );
    const email = response.person?.email;
    return email ? String(email) : null;
  },
};
