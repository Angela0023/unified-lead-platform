export interface ProspeoCompanySearchParams {
  industries?: string[];
  locations?: string[];
  employeeCountMin?: number;
  employeeCountMax?: number;
  limit?: number;
}

export interface ProspeoCompany {
  name: string;
  domain: string;
  industry?: string;
  employeeCount?: number;
  location?: string;
  description?: string;
}

export interface AuthCheckResult {
  authenticated: boolean;
  error?: string;
}

export interface CreditsResult {
  credits: number;
}
