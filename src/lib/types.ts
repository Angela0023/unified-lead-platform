import type { Prisma } from "@prisma/client";

/** User-submitted search input (POST /api/searches and POST /api/estimates). */
export interface SearchInput {
  industry: string[];
  companySize: string;
  location: string[];
  targetRole: string;
  icpPrompt: string;
  targetCompanyCount: number;
  leadsPerCompany: number;
}

/** Database-friendly version of the search input. */
export type SearchInputData = Prisma.SearchCreateInput;

export interface EstimatePhase {
  phase: string;
  costMin: number;
  costMax: number;
  timeMinutes: number;
  detail: string;
}

export interface SearchEstimate {
  companiesExpected: number;
  leadsExpectedMin: number;
  leadsExpectedMax: number;
  costMin: number;
  costMax: number;
  timeMinutes: number;
  credits: {
    apollo: number;
    firecrawl: number;
    millionVerifier: number;
    deepseek: number;
  };
  phases: EstimatePhase[];
  source: "apollo" | "estimated";
}

export interface PreflightCheck {
  key: string;
  label: string;
  status: "ok" | "fail" | "unknown";
  message: string;
  detail?: string;
}

export interface PreflightResult {
  demo: boolean;
  checks: PreflightCheck[];
  allPassed: boolean;
}

export interface SearchStatusResponse {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  currentPhase?: string | null;
  progressPercent: number;
  errorMessage?: string | null;
  stats: {
    companiesFound: number;
    companiesValidated: number;
    contactsFound: number;
    emailsFound: number;
    emailsValid: number;
  };
  qualityDistribution?: {
    score1: number;
    score2: number;
    score3: number;
    score4: number;
    score5: number;
    total: number;
  } | null;
  qualityWarnings?: string[] | null;
  createdAt: string;
  completedAt?: string | null;
  estimatedCompletion?: string | null;
  input: {
    industry: string[];
    companySize: string;
    location: string[];
    targetRole: string;
    icpPrompt: string;
    targetCompanyCount: number;
    leadsPerCompany: number;
  };
}

export interface LeadResult {
  company: string;
  companyScore: number | null;
  website: string;
  industry: string | null;
  name: string;
  title: string;
  email: string | null;
  emailStatus: string | null;
  linkedinUrl: string | null;
}

export interface SearchResultsResponse {
  searchId: string;
  summary: {
    totalLeads: number;
    companiesProcessed: number;
    validEmails: number;
    riskyEmails: number;
    successRate: number;
  };
  leads: LeadResult[];
}
