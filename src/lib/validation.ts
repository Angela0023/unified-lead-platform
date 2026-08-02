import {
  INDUSTRY_OPTIONS,
  LOCATION_OPTIONS,
  COMPANY_SIZE_OPTIONS,
} from "./constants";
import type { SearchInput } from "./types";

const MIN_ICP_LENGTH = 20;

/**
 * Server-side validation of search input (QUALITY-GATES.md Gate 0).
 * Returns a normalized SearchInput, or null when invalid.
 */
export function validateSearchInput(
  body: Record<string, unknown>,
): SearchInput | null {
  const industry = body.industry;
  const companySize = body.companySize;
  const location = body.location;
  const targetRole = body.targetRole;
  const icpPrompt = body.icpPrompt;

  if (
    !Array.isArray(industry) ||
    industry.length === 0 ||
    !industry.every(
      (item) => typeof item === "string" && INDUSTRY_OPTIONS.includes(item),
    )
  ) {
    return null;
  }

  if (
    typeof companySize !== "string" ||
    !COMPANY_SIZE_OPTIONS.some((option) => option.label === companySize)
  ) {
    return null;
  }

  if (
    !Array.isArray(location) ||
    location.length === 0 ||
    !location.every(
      (item) => typeof item === "string" && LOCATION_OPTIONS.includes(item),
    )
  ) {
    return null;
  }

  if (typeof targetRole !== "string" || targetRole.trim().length === 0) {
    return null;
  }

  if (
    typeof icpPrompt !== "string" ||
    icpPrompt.trim().length < MIN_ICP_LENGTH
  ) {
    return null;
  }

  return {
    industry: industry as string[],
    companySize,
    location: location as string[],
    targetRole: targetRole.trim(),
    icpPrompt: icpPrompt.trim(),
  };
}
