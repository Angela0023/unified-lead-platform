import { config } from "./config";
import { parseCompanySize } from "./constants";
import { apolloClient } from "@/integrations/apollo/client";
import type { EstimatePhase, SearchEstimate, SearchInput } from "./types";

/**
 * Cost & time estimation (WORKFLOW.md Stage 2).
 * Unit prices based on the documented breakdown:
 *   Discovery:     $0.50-1.00 flat (bulk query)
 *   Scraping:      $0.01-0.02 / company
 *   DeepSeek:      $0.004-0.01 / company
 *   Contacts:      $0.01-0.02 / contact
 *   Enrichment:    $0.015-0.025 / email
 *   MillionVerifier: $0.004-0.006 / email
 */

const PRICE = {
  discovery: { min: 0.5, max: 1.0 },
  scrape: { min: 0.01, max: 0.02 },
  deepseek: { min: 0.004, max: 0.01 },
  contacts: { min: 0.01, max: 0.02 },
  enrichment: { min: 0.015, max: 0.025 },
  verification: { min: 0.004, max: 0.006 },
};

// Funnel rates from WORKFLOW.md examples
const VALIDATED_RATE = 0.64;
const CONTACTS_PER_COMPANY = 1.3;
const EMAIL_RATE = 0.7;
const VALID_RATE = 0.754;

const TIME_BASE = {
  discovery: 3,
  validation: { perCompanyMin: 5 / 500, clampMin: 5, clampMax: 25 },
  contacts: { perCompanyMin: 8 / 320, clampMin: 2, clampMax: 15 },
  enrichment: { perEmailMin: 9 / 285, clampMin: 2, clampMax: 15 },
  verification: { perEmailMin: 5 / 285, clampMin: 2, clampMax: 10 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Estimates the number of companies Apollo will return for these filters. */
export async function estimateCompanyCount(
  input: SearchInput,
): Promise<{ count: number; source: "apollo" | "estimated" }> {
  if (config.demoMode) {
    return { count: config.companiesPerSearch, source: "estimated" };
  }
  try {
    const size = parseCompanySize(input.companySize);
    const result = await apolloClient.searchCompanies({
      industries: input.industry,
      locations: input.location,
      employeeCountMin: size?.min,
      employeeCountMax: size?.max ?? null,
      perPage: 1,
    });
    if (result.totalEntries > 0) {
      return {
        count: Math.min(result.totalEntries, 500),
        source: "apollo",
      };
    }
  } catch {
    // Fall through to estimated default
  }
  return { count: 500, source: "estimated" };
}

export async function buildEstimate(input: SearchInput): Promise<SearchEstimate> {
  const { count: companies, source } = await estimateCompanyCount(input);

  const validated = Math.round(companies * VALIDATED_RATE);
  const contacts = Math.round(validated * CONTACTS_PER_COMPANY);
  const emails = Math.round(contacts * EMAIL_RATE);
  const validEmails = Math.round(emails * VALID_RATE);

  const phases: EstimatePhase[] = [
    {
      phase: "Phase 1: Company Discovery",
      costMin: PRICE.discovery.min,
      costMax: PRICE.discovery.max,
      timeMinutes: TIME_BASE.discovery,
      detail: `${companies} companies via Apollo bulk query`,
    },
    {
      phase: "Phase 2: Company Validation",
      costMin:
        companies * PRICE.scrape.min + companies * PRICE.deepseek.min,
      costMax:
        companies * PRICE.scrape.max + companies * PRICE.deepseek.max,
      timeMinutes: clamp(
        companies * TIME_BASE.validation.perCompanyMin,
        TIME_BASE.validation.clampMin,
        TIME_BASE.validation.clampMax,
      ),
      detail: `Scrape ${companies} websites (Firecrawl) + AI scoring (DeepSeek)`,
    },
    {
      phase: "Phase 3: Contact Discovery",
      costMin: contacts * PRICE.contacts.min,
      costMax: contacts * PRICE.contacts.max,
      timeMinutes: clamp(
        validated * TIME_BASE.contacts.perCompanyMin,
        TIME_BASE.contacts.clampMin,
        TIME_BASE.contacts.clampMax,
      ),
      detail: `~${contacts} decision makers at ${validated} validated companies`,
    },
    {
      phase: "Phase 4: Email Enrichment",
      costMin: emails * PRICE.enrichment.min,
      costMax: emails * PRICE.enrichment.max,
      timeMinutes: clamp(
        emails * TIME_BASE.enrichment.perEmailMin,
        TIME_BASE.enrichment.clampMin,
        TIME_BASE.enrichment.clampMax,
      ),
      detail: `~${emails} emails expected (${Math.round(EMAIL_RATE * 100)}% discovery rate)`,
    },
    {
      phase: "Phase 5: Email Validation",
      costMin: emails * PRICE.verification.min,
      costMax: emails * PRICE.verification.max,
      timeMinutes: clamp(
        emails * TIME_BASE.verification.perEmailMin,
        TIME_BASE.verification.clampMin,
        TIME_BASE.verification.clampMax,
      ),
      detail: `Validate ${emails} emails via Million Verifier`,
    },
  ];

  const costMin = phases.reduce((sum, phase) => sum + phase.costMin, 0);
  const costMax = phases.reduce((sum, phase) => sum + phase.costMax, 0);
  const timeMinutes = phases.reduce(
    (sum, phase) => sum + phase.timeMinutes,
    0,
  );

  return {
    companiesExpected: companies,
    leadsExpectedMin: Math.round(validEmails * 0.9),
    leadsExpectedMax: validEmails,
    costMin,
    costMax,
    timeMinutes,
    credits: {
      apollo: companies + contacts + emails,
      firecrawl: companies,
      millionVerifier: emails,
      deepseek: companies,
    },
    phases,
    source,
  };
}
