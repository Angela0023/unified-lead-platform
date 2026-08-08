import type { JobName } from "./queue";

/** Checkpoint batch size (WORKFLOW.md: save progress every 50 records). */
export const BATCH_SIZE = 50;

/** Default maximum companies per search (Apollo). */
export const DEFAULT_COMPANIES_PER_SEARCH = 500;

/** Maximum contacts kept per company during contact discovery (WORKFLOW.md Stage 5). */
export const MAX_CONTACTS_PER_COMPANY = 2;

export interface PhaseMeta {
  jobType: JobName;
  label: string;
  description: string;
  /** Cumulative progress percent range for this phase (WORKFLOW.md stages). */
  startPercent: number;
  endPercent: number;
}

export const PHASES: PhaseMeta[] = [
  {
    jobType: "company-discovery",
    label: "Company Discovery",
    description: "Finding companies that match your filters",
    startPercent: 0,
    endPercent: 15,
  },
  {
    jobType: "company-validation",
    label: "Company Validation",
    description: "Scraping websites and scoring against your ICP",
    startPercent: 15,
    endPercent: 45,
  },
  {
    jobType: "contact-discovery",
    label: "Contact Discovery",
    description: "Finding decision makers at validated companies",
    startPercent: 45,
    endPercent: 65,
  },
  {
    jobType: "email-enrichment",
    label: "Email Enrichment",
    description: "Finding email addresses for contacts",
    startPercent: 65,
    endPercent: 85,
  },
  {
    jobType: "email-validation",
    label: "Email Validation",
    description: "Verifying emails with Million Verifier",
    startPercent: 85,
    endPercent: 100,
  },
];

export function getPhaseMeta(jobType: JobName): PhaseMeta | undefined {
  return PHASES.find((phase) => phase.jobType === jobType);
}

/** Industry options for the search form (Stage 0). */
export const INDUSTRY_OPTIONS = [
  "Software",
  "Information Technology & Services",
  "Financial Services",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Marketing & Advertising",
  "Professional Services",
  "Insurance",
  "Construction",
  "Energy",
  "Transportation & Logistics",
  "Education",
  "Media & Entertainment",
  "Real Estate",
  "Telecommunications",
  "Hospitality",
  "Agriculture",
];

/** Location options for the search form (Stage 0). */
export const LOCATION_OPTIONS = [
  "United States",
  "United Kingdom",
  "Germany",
  "Canada",
  "Australia",
  "France",
  "Netherlands",
  "Spain",
  "Italy",
  "Switzerland",
  "Ireland",
  "Sweden",
  "Denmark",
  "Norway",
  "Belgium",
  "Austria",
  "Poland",
  "United Arab Emirates",
  "Singapore",
  "India",
];

/** Company size options for the search form (WORKFLOW.md Stage 0). */
export const COMPANY_SIZE_OPTIONS = [
  { label: "1-10", min: 1, max: 10 },
  { label: "11-50", min: 11, max: 50 },
  { label: "51-200", min: 51, max: 200 },
  { label: "201-500", min: 201, max: 500 },
  { label: "501-1000", min: 501, max: 1000 },
  { label: "1000+", min: 1000, max: null },
];

export function parseCompanySize(
  size: string,
): { min: number; max: number | null } | undefined {
  return COMPANY_SIZE_OPTIONS.find((option) => option.label === size);
}
