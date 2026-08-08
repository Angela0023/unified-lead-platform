import { config } from "@/lib/config";
import { fetchJson, retryWithBackoff } from "@/lib/http";
import { demo } from "@/lib/demo-data";
import { DeepSeekError } from "./errors";
import type { AuthCheckResult, BalanceResult, ValidationResult } from "./types";

const BASE_URL = "https://api.deepseek.com";

/**
 * Company validation prompt template (WORKFLOW.md Stage 4).
 * Validates companies against Intelsol's B2B lead generation ICP.
 */
export function buildValidationPrompt(
  company: {
    name: string;
    website: string;
    scrapedContent: string;
  },
  icpPrompt: string,
): string {
  const scrapedText = company.scrapedContent.slice(0, 6000);
  const hasScrapedContent = scrapedText.trim().length > 100;

  return `Determine whether this company matches the ICP for B2B lead generation services.

Company Information:
Name: ${company.name}
Website: ${company.website}
${hasScrapedContent ? `Scraped Content:\n${scrapedText}` : `Scraped Content: [INSUFFICIENT DATA - YOU MUST ANALYZE THE WEBSITE DIRECTLY]\nWebsite URL: ${company.website}\n\nIMPORTANT: The scraped content is empty or incomplete. You MUST infer information from the website URL, company name, and any available context. Do NOT return an empty result. Make your best assessment based on available information.`}

Ideal Customer Profile (ICP):
${icpPrompt}

Evaluation Criteria:
A match should be:
- B2B company (sells to other businesses, NOT consumers)
- Offers one of: Service company (IT services, consulting), SaaS product, or B2B physical/industrial products
- High-ticket offers ($20K+ per deal)
- Active sales process (not just passive/distributor model)
- Has a clear value proposition on their website
- Could benefit from outbound email campaigns
- Geographic focus: Belgium, Netherlands, Germany, Austria, Switzerland, France (primary); UK, Nordics, other EU (secondary)

NOT a match if:
- B2C company (sells to consumers)
- eCommerce selling low-ticket consumer goods
- One-man band (solo founder with no team)
- Very large enterprises (500+ employees)
- Recruitment/staffing agencies
- Sells only through distributors (no direct sales)
- Commodity/low-margin businesses
- Website is outdated or broken
- Already has large in-house SDR/sales team
- Non-EU website with no European market presence

Scoring Guide:
1 = REJECTED - Clearly NOT a fit (B2C, wrong geography, wrong business model, or fails multiple critical criteria)
2 = WEAK FIT - Some overlap but missing key criteria (e.g., right industry but wrong geography, or B2B but too small/large)
3 = POSSIBLE FIT - Meets basic criteria but unclear on key details (needs more research, borderline on ticket size or sales model)
4 = GOOD FIT - Meets most criteria, strong match for outbound campaigns
5 = PERFECT FIT - Ideal customer, meets all criteria, high priority target

CRITICAL: You MUST return a score and reasoning even if information is limited. Use company name, website domain, and any available context to make an informed assessment. Never return empty results.

Return ONLY JSON in this exact shape:
{
  "score": 3,
  "reasoning": "Brief explanation of why this score was assigned (2-3 sentences)",
  "conflicts": ["Any conflicting signals found, e.g., 'Website says enterprise but pricing suggests SMB'"]
}`;
}

export const deepseekClient = {
  /** Verifies the API key is valid. */
  async testConnection(): Promise<AuthCheckResult> {
    if (config.demoMode) return demo.deepseekAuth();
    if (!config.deepseekApiKey) {
      return { authenticated: false, message: "DEEPSEEK_API_KEY not set" };
    }
    try {
      const response = await fetchJson<{
        choices?: { message?: { content?: string } }[];
      }>(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.deepseekApiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: "Reply with the word OK" }],
          max_tokens: 5,
        }),
        timeoutMs: 20_000,
      });
      return {
        authenticated: response.choices?.length ? true : false,
        message: "API key valid",
      };
    } catch (error) {
      return {
        authenticated: false,
        message: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },

  /** Current account balance (null when unavailable). */
  async getBalance(): Promise<BalanceResult> {
    if (config.demoMode) return demo.deepseekBalance();
    if (!config.deepseekApiKey) return { balance: null };
    try {
      const response = await fetchJson<{
        balance_infos?: { total_balance?: string }[];
      }>(`${BASE_URL}/user/balance`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${config.deepseekApiKey}`,
        },
        timeoutMs: 15_000,
      });
      const balance = response.balance_infos?.[0]?.total_balance;
      return { balance: balance ? Number(balance) : null };
    } catch {
      return { balance: null };
    }
  },

  /** AI company validation (Stage 4 / Phase 2): score company 1-5 against ICP. */
  async validate(
    company: { name: string; website: string; scrapedContent: string },
    icpPrompt: string,
  ): Promise<ValidationResult> {
    if (config.demoMode) {
      return demo.deepseekValidate(company, icpPrompt);
    }
    try {
      const response = await retryWithBackoff(() =>
        fetchJson<{
          choices?: { message?: { content?: string } }[];
        }>(`${BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.deepseekApiKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "user",
                content: buildValidationPrompt(company, icpPrompt),
              },
            ],
            max_tokens: 800,
            temperature: 0.2,
            response_format: { type: "json_object" },
          }),
          timeoutMs: 45_000,
        }),
      );
      const content = response.choices?.[0]?.message?.content ?? "{}";
      return parseValidationResult(content, company.name);
    } catch (error) {
      if (error instanceof DeepSeekError) throw error;
      throw new DeepSeekError(
        error instanceof Error ? error.message : "DeepSeek validation failed",
        0,
        false,
      );
    }
  },
};

function parseValidationResult(
  content: string,
  companyName: string,
): ValidationResult {
  try {
    const parsed = JSON.parse(content) as Partial<ValidationResult>;
    const score = Math.min(5, Math.max(1, Number(parsed.score) || 1));
    return {
      score,
      reasoning: parsed.reasoning ?? "No reasoning provided",
      conflicts: Array.isArray(parsed.conflicts)
        ? parsed.conflicts.map(String)
        : [],
    };
  } catch {
    // Non-JSON response: treat as a 3 (unknown) rather than failing the company
    return {
      score: 3,
      reasoning: `Could not parse validation response for ${companyName}. Raw content: ${content.slice(0, 200)}`,
      conflicts: [],
    };
  }
}
