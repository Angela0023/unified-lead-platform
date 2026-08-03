/** Apollo.io API types (mixed_companies/search, people/search, people/match). */

export interface ApolloCompany {
  id: string;
  name: string;
  domain: string;
  website?: string;
  industry?: string;
  employeeCount?: number;
  city?: string;
  state?: string;
  country?: string;
  organizationSize?: string;
  /** Computed display location ("City, State, Country"). */
  location?: string;
}

export interface ApolloPerson {
  id: string;
  name: string;
  title?: string;
  email?: string | null;
  linkedinUrl?: string | null;
  organizationId?: string;
}

export interface SearchCompaniesParams {
  industries: string[];
  employeeCountMin?: number;
  employeeCountMax?: number | null;
  locations: string[];
  page?: number;
  perPage?: number;
}

export interface SearchCompaniesResult {
  companies: ApolloCompany[];
  totalEntries: number;
}

export interface FindContactsParams {
  /** Company domain (e.g. "apple.com") - Apollo people search key. */
  domain: string;
  /** Target roles/titles to search for (Apollo fuzzy-matches each). */
  titles: string[];
  limit?: number;
}

export interface AuthCheckResult {
  authenticated: boolean;
  message?: string;
}

export interface CreditBalanceResult {
  credits: number | null;
}
