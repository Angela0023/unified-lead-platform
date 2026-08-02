/**
 * Demo mode providers for all integrations.
 *
 * When DEMO_MODE=true, the integration clients return realistic simulated
 * data instead of calling external APIs. This lets the full pipeline be
 * exercised locally without API keys, and lets Angela see the product.
 *
 * All generation is deterministic (seeded by input strings) and includes
 * small artificial delays so progress updates are visible in the UI.
 */

import { MAX_CONTACTS_PER_COMPANY } from "./constants";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Process-local store for demo email batches (uploadBatch → pollBatch).
 * Lives only in the worker process; demo mode only.
 */
const demoBatches = new Map<string, string[]>();

/** Simple deterministic string hash (FNV-1a). */
export function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Deterministic PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAME_PREFIXES = [
  "Nimbus", "Quantum", "Vertex", "Orbit", "Cobalt", "Lumina", "Atlas",
  "Stratus", "Nova", "Pulse", "Meridian", "Helix", "Apex", "Fusion",
  "Zenith", "Cascade", "Incline", "Relay", "Signal", "Vector",
];
const NAME_SUFFIXES = [
  "Systems", "Labs", "Technologies", "Software", "Analytics", "Digital",
  "Solutions", "Networks", "Data", "Platforms", "Cloud", "Intelligence",
];
const FIRST_NAMES = [
  "James", "Sarah", "Michael", "Emma", "David", "Olivia", "Daniel",
  "Sophia", "Matthew", "Isabella", "Andrew", "Mia", "Christopher", "Charlotte",
  "Joshua", "Amelia", "Ryan", "Emily", "Nathan", "Grace",
];
const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Anderson", "Taylor", "Thomas", "Moore",
  "Jackson", "Martin", "Lee", "Thompson", "White", "Harris",
];

function makeCompanyName(seed: number): string {
  const random = mulberry32(seed);
  const prefix = NAME_PREFIXES[Math.floor(random() * NAME_PREFIXES.length)];
  const suffix = NAME_SUFFIXES[Math.floor(random() * NAME_SUFFIXES.length)];
  return `${prefix} ${suffix}`;
}

function toDomain(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;
}

function makeEmail(name: string, domain: string): string {
  const parts = name.toLowerCase().split(" ");
  const first = parts[0] ?? "user";
  const last = parts[parts.length - 1] ?? "name";
  return `${first}.${last}@${domain}`;
}

const COMPANY_SIZE_BOUNDS: Record<string, { min: number; max: number }> = {
  "1-10": { min: 1, max: 10 },
  "11-50": { min: 11, max: 50 },
  "51-200": { min: 51, max: 200 },
  "201-500": { min: 201, max: 500 },
  "501-1000": { min: 501, max: 1000 },
  "1000+": { min: 1000, max: 5000 },
};

function makeScrapedContent(
  name: string,
  industry: string,
  size: number,
  seed: number,
): string {
  const random = mulberry32(seed);
  const hasApi = random() < 0.8;
  const hasEnterprise = random() < 0.75;
  const hasSaaS = random() < 0.85;
  const customers = random() < 0.7 ? "enterprise" : "mid-market";

  return [
    `# ${name}`,
    `${name} is a ${industry} company headquartered in the ${random() < 0.5 ? "United States" : "United Kingdom"}.`,
    `About us: We ${hasSaaS ? "provide a SaaS platform" : "develop software solutions"} for ${customers} customers.`,
    hasApi
      ? "Products: Our platform offers a full API-first architecture with developer documentation, REST endpoints, and SDKs for major languages."
      : "Products: We deliver managed services with a strong focus on customer success.",
    `Team: We employ approximately ${size} people across engineering, product, and go-to-market teams.`,
    hasEnterprise
      ? "Customers: We serve enterprises including Fortune 500 companies, with dedicated account management and SLAs."
      : "Customers: Our customer base spans small and medium businesses, with self-serve onboarding.",
    "Pricing: Available on request. We offer annual contracts with volume discounts.",
    "Contact: sales@example.com | Careers: careers.example.com",
  ].join("\n\n");
}

function makeReasoning(score: number, name: string, industry: string): string {
  switch (score) {
    case 5:
      return `Strong fit. ${name} is a ${industry} company that matches all key ICP criteria including size, offering, and customer profile.`;
    case 4:
      return `Good fit. ${name} meets most ICP criteria with a ${industry} focus, though one or two secondary criteria are not a perfect match.`;
    case 3:
      return `Okay fit. ${name} meets the basic criteria (industry, size) but the offering or customer profile is not clearly aligned with the ICP.`;
    case 2:
      return `Potential fit. ${name} overlaps on some criteria but misses key requirements such as product type or target customer.`;
    default:
      return `Not a fit. ${name} is a ${industry} company whose size, offering, or customer profile does not match the ICP requirements.`;
  }
}

export const demo = {
  async apolloAuth() {
    await sleep(300);
    return { authenticated: true, message: "Demo mode (simulated)" };
  },

  async apolloCredits() {
    await sleep(200);
    return { credits: 10000 };
  },

  async deepseekAuth() {
    await sleep(300);
    return { authenticated: true, message: "Demo mode (simulated)" };
  },

  async deepseekBalance() {
    await sleep(200);
    return { balance: 25.0 };
  },

  async firecrawlAuth() {
    await sleep(300);
    return { authenticated: true, message: "Demo mode (simulated)" };
  },

  async firecrawlCredits() {
    await sleep(200);
    return { credits: 500 };
  },

  async mvAuth() {
    await sleep(300);
    return { authenticated: true, message: "Demo mode (simulated)" };
  },

  async mvCredits() {
    await sleep(200);
    return { credits: 10000 };
  },

  async apolloCompanies(params: {
    industries: string[];
    locations: string[];
    employeeCountMin?: number;
    employeeCountMax?: number | null;
    page?: number;
    perPage?: number;
  }): Promise<{
    companies: {
      id: string;
      name: string;
      domain: string;
      industry: string;
      employeeCount: number;
      location: string;
    }[];
    totalEntries: number;
  }> {
    await sleep(600);
    const perPage = params.perPage ?? 25;
    const bounds = params.employeeCountMin
      ? { min: params.employeeCountMin, max: params.employeeCountMax ?? 500 }
      : COMPANY_SIZE_BOUNDS["51-200"];
    const industry =
      params.industries[0] ?? "Software";
    const location = params.locations[0] ?? "United States";
    const companies = Array.from({ length: perPage }, (_, index) => {
      const seed = hashString(`${industry}-${location}-${index}-${params.page ?? 1}`);
      const name = makeCompanyName(seed);
      const random = mulberry32(seed);
      const size =
        Math.floor(random() * (bounds.max - bounds.min + 1)) + bounds.min;
      return {
        id: `demo-org-${seed}`,
        name,
        domain: toDomain(name),
        industry,
        employeeCount: size,
        location,
      };
    });
    return { companies, totalEntries: 500 };
  },

  async apolloContacts(params: {
    organizationId: string;
    title: string;
    limit?: number;
  }): Promise<
    {
      id: string;
      name: string;
      title: string;
      linkedinUrl: string;
      organizationId: string;
    }[]
  > {
    await sleep(400);
    const limit = params.limit ?? MAX_CONTACTS_PER_COMPANY;
    const orgSeed = Number(params.organizationId.replace("demo-org-", ""));
    const random = mulberry32(orgSeed);
    const count = 1 + Math.floor(random() * limit);
    const titleVariants = [
      params.title,
      `VP Engineering`,
      `Head of ${params.title}`,
      `Chief Technology Officer`,
    ];
    return Array.from({ length: count }, (_, index) => {
      const personSeed = orgSeed + index * 7919;
      const firstName =
        FIRST_NAMES[Math.floor(mulberry32(personSeed)() * FIRST_NAMES.length)];
      const lastName =
        LAST_NAMES[
          Math.floor(mulberry32(personSeed + 1)() * LAST_NAMES.length)
        ];
      const name = `${firstName} ${lastName}`;
      return {
        id: `demo-contact-${orgSeed}-${index}`,
        name,
        title: titleVariants[Math.floor(random() * titleVariants.length)],
        linkedinUrl: `linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
        organizationId: params.organizationId,
      };
    });
  },

  async apolloEmail(personId: string): Promise<string | null> {
    await sleep(500);
    const random = mulberry32(hashString(personId));
    if (random() > 0.7) return null;
    const parts = personId.replace("demo-contact-", "").split("-");
    const orgSeed = Number(parts[0] ?? 0);
    const index = Number(parts[1] ?? 0);
    const domain = toDomain(makeCompanyName(orgSeed));
    const personSeed = orgSeed + index * 7919;
    const name = `${FIRST_NAMES[personSeed % FIRST_NAMES.length]} ${
      LAST_NAMES[(personSeed * 7) % LAST_NAMES.length]
    }`;
    return makeEmail(name, domain);
  },

  async deepseekValidate(
    company: { name: string; website: string; scrapedContent: string },
    icpPrompt: string,
  ): Promise<{ score: number; reasoning: string; conflicts: string[] }> {
    await sleep(700);
    const random = mulberry32(hashString(`${company.name}-${icpPrompt}`));
    const roll = random();
    let score = 3;
    if (roll < 0.2) score = 1;
    else if (roll < 0.35) score = 2;
    else if (roll < 0.55) score = 3;
    else if (roll < 0.8) score = 4;
    else score = 5;
    const industry = company.scrapedContent.split(" is a ")[1]?.split(" ")[0] ?? "software";
    return {
      score,
      reasoning: makeReasoning(score, company.name, industry),
      conflicts: random() < 0.2 ? ["Website employee count differs from Apollo data"] : [],
    };
  },

  async firecrawlScrape(url: string): Promise<{
    url: string;
    markdown: string;
    success: boolean;
  }> {
    await sleep(800);
    const seed = hashString(url);
    const name = makeCompanyName(seed);
    const random = mulberry32(seed);
    const size = 50 + Math.floor(random() * 400);
    const industry = ["Software", "Fintech", "Healthcare", "Data", "Cloud"][
      Math.floor(random() * 5)
    ];
    return {
      url,
      markdown: makeScrapedContent(name, industry, size, seed),
      success: true,
    };
  },

  async mvUploadBatch(emails: string[]): Promise<{ batchId: string }> {
    await sleep(300);
    const batchId = `demo-batch-${hashString(emails.join("_"))}`;
    demoBatches.set(batchId, emails);
    return { batchId };
  },

  async mvPollBatch(batchId: string): Promise<{
    batchId: string;
    status: string;
    progress: number;
    results: {
      email: string;
      verdict: "VALID" | "INVALID" | "RISKY" | "UNKNOWN";
      reason?: string;
    }[];
  }> {
    await sleep(1500);
    const emails = demoBatches.get(batchId) ?? [];
    const results = emails.map((email) => {
      const random = mulberry32(hashString(email));
      const roll = random();
      if (roll < 0.75) {
        return { email, verdict: "VALID" as const, reason: "Deliverable" };
      }
      if (roll < 0.81) {
        return {
          email,
          verdict: "RISKY" as const,
          reason: "Catch-all domain",
        };
      }
      if (roll < 0.93) {
        return {
          email,
          verdict: "INVALID" as const,
          reason: "Mailbox not found",
        };
      }
      return {
        email,
        verdict: "UNKNOWN" as const,
        reason: "Unable to verify",
      };
    });
    return { batchId, status: "ready", progress: 100, results };
  },
};
