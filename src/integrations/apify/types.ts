export interface ApifyRunInput {
  searchQuery: string;
  maxResults: number;
  filters?: {
    companySize?: string;
    location?: string;
    industry?: string;
  };
}

export interface ApifyCompanyResult {
  companyName: string;
  companyUrl: string;
  website?: string;
  industry?: string;
  employeeCount?: number;
  location?: string;
}

export interface ApifyRunStatus {
  status: string;
  defaultDatasetId?: string;
}

export interface AuthCheckResult {
  authenticated: boolean;
  error?: string;
}
