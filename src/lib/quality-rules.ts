import type { Company } from "@prisma/client";

export interface QualityDistribution {
  score1: number; // Rejected
  score2: number;
  score3: number;
  score4: number;
  score5: number;
  total: number;
}

export interface QualityCheckResult {
  passed: boolean;
  distribution: QualityDistribution;
  warnings: string[];
  needsBackfill: number; // How many more companies needed to hit target
  avgScore: number;
}

/**
 * Calculate quality distribution from companies
 */
export function calculateDistribution(
  companies: Company[],
): QualityDistribution {
  const dist = {
    score1: 0,
    score2: 0,
    score3: 0,
    score4: 0,
    score5: 0,
    total: companies.length,
  };

  companies.forEach((company) => {
    const score = company.score || 0;
    if (score === 1) dist.score1++;
    else if (score === 2) dist.score2++;
    else if (score === 3) dist.score3++;
    else if (score === 4) dist.score4++;
    else if (score === 5) dist.score5++;
  });

  return dist;
}

/**
 * Check quality rules:
 * - Rule 1: Score 1 (rejected) companies should be replaced via backfill
 * - Rule 2: Score 2 should be max 25-40% of validated companies (soft rule, no enforcement)
 */
export function checkQuality(
  companies: Company[],
  targetCount: number,
): QualityCheckResult {
  const dist = calculateDistribution(companies);
  const warnings: string[] = [];

  // Validated = scores 2-5
  const validatedCount = dist.score2 + dist.score3 + dist.score4 + dist.score5;

  // Calculate average score (excluding score 1)
  const validatedCompanies = companies.filter((c) => c.score && c.score >= 2);
  const avgScore =
    validatedCompanies.length > 0
      ? validatedCompanies.reduce((sum, c) => sum + (c.score || 0), 0) /
        validatedCompanies.length
      : 0;

  // Rule 1: Calculate backfill needed
  // We want `targetCount` validated companies, currently have `validatedCount`
  const needsBackfill = Math.max(0, targetCount - validatedCount);

  // Rule 2: Check score 2 percentage (informational only, no enforcement)
  const score2Percentage =
    validatedCount > 0 ? (dist.score2 / validatedCount) * 100 : 0;
  if (score2Percentage > 40) {
    warnings.push(
      `${score2Percentage.toFixed(1)}% of companies scored 2/5 (above 40% threshold, but continuing)`,
    );
  }

  return {
    passed: true, // Always pass (no auto-stop, just track)
    distribution: dist,
    warnings,
    needsBackfill,
    avgScore,
  };
}
