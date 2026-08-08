import { apolloClient } from "@/integrations/apollo/client";
import { prospeoClient } from "@/integrations/prospeo/client";
import { exaClient } from "@/integrations/exa/client";
import { apifyClient } from "@/integrations/apify/client";
import { prisma } from "@/lib/db";
import type { SearchInput } from "@/lib/types";
import { CompanyStatus, type Company } from "@prisma/client";

interface DiscoverySource {
  name: "apollo" | "sales-navigator" | "prospeo" | "exa";
  priority: number;
  dryRunSize: number;
  costPerCompany: number;
  handler: {
    test: () => Promise<{ authenticated: boolean }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dryRun: (params: SearchInput, limit: number) => Promise<any[]>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    discover: (params: SearchInput, limit: number) => Promise<any[]>;
  };
}

const SOURCES: DiscoverySource[] = [
  {
    name: "apollo",
    priority: 1, // Cheapest, most reliable
    dryRunSize: 10,
    costPerCompany: 0.01,
    handler: {
      test: () => apolloClient.testConnection(),
      dryRun: async (params, limit) => {
        const result = await apolloClient.searchCompanies({
          industries: params.industry,
          locations: params.location,
          employeeCountMin: parseCompanySize(params.companySize).min,
          employeeCountMax: parseCompanySize(params.companySize).max,
          page: 1,
          perPage: limit,
        });
        return result.companies || [];
      },
      discover: async (params, limit) => {
        const result = await apolloClient.searchCompanies({
          industries: params.industry,
          locations: params.location,
          employeeCountMin: parseCompanySize(params.companySize).min,
          employeeCountMax: parseCompanySize(params.companySize).max,
          page: 1,
          perPage: Math.min(limit, 100), // Apollo max per page
        });
        return result.companies || [];
      },
    },
  },
  {
    name: "sales-navigator",
    priority: 2, // High quality LinkedIn data
    dryRunSize: 5, // Smaller sample (Apify costs more)
    costPerCompany: 0.05,
    handler: {
      test: () => apifyClient.testConnection(),
      dryRun: async (params, limit) => {
        return apifyClient.searchCompanies({
          searchQuery: params.industry.join(" OR "),
          maxResults: limit,
          filters: {
            companySize: params.companySize,
            location: params.location.join(" OR "),
          },
        });
      },
      discover: async (params, limit) => {
        return apifyClient.searchCompanies({
          searchQuery: params.industry.join(" OR "),
          maxResults: limit,
          filters: {
            companySize: params.companySize,
            location: params.location.join(" OR "),
          },
        });
      },
    },
  },
  {
    name: "prospeo",
    priority: 3, // Better filters than Apollo
    dryRunSize: 10,
    costPerCompany: 0.02,
    handler: {
      test: () => prospeoClient.testConnection(),
      dryRun: async (params, limit) => {
        return prospeoClient.searchCompanies({
          industries: params.industry,
          locations: params.location,
          employeeCountMin: parseCompanySize(params.companySize).min,
          employeeCountMax: parseCompanySize(params.companySize).max,
          limit,
        });
      },
      discover: async (params, limit) => {
        return prospeoClient.searchCompanies({
          industries: params.industry,
          locations: params.location,
          employeeCountMin: parseCompanySize(params.companySize).min,
          employeeCountMax: parseCompanySize(params.companySize).max,
          limit,
        });
      },
    },
  },
  {
    name: "exa",
    priority: 4, // Semantic search for tricky ICPs
    dryRunSize: 5,
    costPerCompany: 0.03,
    handler: {
      test: () => exaClient.testConnection(),
      dryRun: async (params, limit) => {
        const results = await exaClient.searchCompanies(params.icpPrompt, {
          industry: params.industry,
          location: params.location,
        });
        return results.slice(0, limit);
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      discover: async (params, _limit) => {
        return exaClient.searchCompanies(params.icpPrompt, {
          industry: params.industry,
          location: params.location,
        });
      },
    },
  },
];

export class DiscoveryOrchestrator {
  /**
   * Main discovery method with dry-run testing
   */
  async discoverCompanies(
    searchId: string,
    input: SearchInput,
    round: number = 1,
    needed: number,
  ): Promise<Company[]> {
    console.log(`[discovery] Round ${round}: Need ${needed} companies`);

    // Step 1: Dry-run phase (test each source)
    const viableSources = await this.dryRunPhase(searchId, input, round);

    if (viableSources.length === 0) {
      console.error("[discovery] No viable sources found");
      return [];
    }

    // Step 2: Execute discovery from viable sources
    return this.executeDiscovery(searchId, input, viableSources, round, needed);
  }

  /**
   * Test each source with small sample to avoid wasting credits
   */
  private async dryRunPhase(
    searchId: string,
    input: SearchInput,
    round: number,
  ): Promise<DiscoverySource[]> {
    const viable: DiscoverySource[] = [];

    for (const source of SOURCES) {
      try {
        console.log(
          `[dry-run] Testing ${source.name} (sample: ${source.dryRunSize})`,
        );

        // Test connection first
        const authCheck = await source.handler.test();
        if (!authCheck.authenticated) {
          console.log(`[dry-run] ${source.name} not authenticated, skipping`);
          await this.recordAttempt(
            searchId,
            source.name,
            round,
            true,
            0,
            "SKIPPED",
            "Not authenticated",
          );
          continue;
        }

        // Run small sample
        const results = await source.handler.dryRun(input, source.dryRunSize);

        await this.recordAttempt(
          searchId,
          source.name,
          round,
          true,
          results.length,
          results.length > 0 ? "SUCCESS" : "SKIPPED",
          results.length === 0 ? "No results returned" : undefined,
        );

        if (results.length > 0) {
          console.log(
            `[dry-run] ${source.name} returned ${results.length} companies ✓`,
          );
          viable.push(source);
        } else {
          console.log(`[dry-run] ${source.name} returned 0 results, skipping`);
        }
      } catch (error) {
        console.error(`[dry-run] ${source.name} failed:`, error);
        await this.recordAttempt(
          searchId,
          source.name,
          round,
          true,
          0,
          "FAILED",
          String(error),
        );
      }
    }

    return viable;
  }

  /**
   * Execute discovery from viable sources (priority order)
   */
  private async executeDiscovery(
    searchId: string,
    input: SearchInput,
    sources: DiscoverySource[],
    round: number,
    needed: number,
  ): Promise<Company[]> {
    const companies: Company[] = [];
    let remaining = needed;

    // Try sources in priority order until we have enough companies
    for (const source of sources.sort((a, b) => a.priority - b.priority)) {
      if (remaining <= 0) break;

      try {
        console.log(
          `[discovery] Fetching ${remaining} companies from ${source.name}`,
        );

        const results = await source.handler.discover(input, remaining);

        // Map to Company records
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = results.map((r: any) => ({
          searchId,
          name: r.name || r.companyName || r.title || "Unknown",
          website:
            r.website || r.domain || r.companyUrl || r.url || "unknown.com",
          industry: r.industry,
          size: r.employeeCount || r.size,
          location: r.location || r.headquarters,
          apolloId: r.id,
          discoverySource: source.name,
          discoveryRound: round,
          status: CompanyStatus.DISCOVERED,
        }));

        // Filter out duplicates by website
        const existingWebsites = new Set(
          await prisma.company
            .findMany({
              where: { searchId },
              select: { website: true },
            })
            .then((rows) => rows.map((r) => r.website)),
        );

        const uniqueMapped = mapped.filter(
          (c) => !existingWebsites.has(c.website),
        );

        if (uniqueMapped.length === 0) {
          console.log(
            `[discovery] ${source.name} returned only duplicates, skipping`,
          );
          continue;
        }

        // Save to database
        await prisma.company.createMany({ data: uniqueMapped });

        await this.recordAttempt(
          searchId,
          source.name,
          round,
          false,
          uniqueMapped.length,
          "SUCCESS",
        );

        companies.push(...(uniqueMapped as Company[]));
        remaining -= uniqueMapped.length;

        console.log(
          `[discovery] ${source.name} provided ${uniqueMapped.length} companies (${remaining} still needed)`,
        );
      } catch (error) {
        console.error(`[discovery] ${source.name} failed:`, error);
        await this.recordAttempt(
          searchId,
          source.name,
          round,
          false,
          0,
          "FAILED",
          String(error),
        );
      }
    }

    return companies;
  }

  /**
   * Record discovery attempt in database
   */
  private async recordAttempt(
    searchId: string,
    source: string,
    round: number,
    isDryRun: boolean,
    companiesFound: number,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    const sourceConfig = SOURCES.find((s) => s.name === source);

    await prisma.discoveryAttempt.create({
      data: {
        searchId,
        source,
        round,
        isDryRun,
        sampleSize: isDryRun ? sourceConfig?.dryRunSize || 0 : 0,
        companiesFound,
        status,
        errorMessage,
        completedAt: new Date(),
      },
    });
  }
}

function parseCompanySize(sizeStr: string): { min?: number; max?: number } {
  // Parse "50-200" format
  const match = sizeStr.match(/(\d+)-(\d+)/);
  if (match) {
    return { min: Number(match[1]), max: Number(match[2]) };
  }
  return {};
}
