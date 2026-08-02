import { config } from "@/lib/config";
import { fetchJson, retryWithBackoff } from "@/lib/http";
import { demo } from "@/lib/demo-data";
import { DeepSeekError } from "./errors";
import type { AuthCheckResult, BalanceResult, ValidationResult } from "./types";

const BASE_URL = "https://api.deepseek.com";

/**
 * Company validation prompt template (WORKFLOW.md Stage 4).
 * The model receives scraped website content plus the user's ICP and
 * returns a JSON score (1-5), reasoning, and detected conflicts.
 */
export function buildValidationPrompt(
  company: {
    name: string;
    website: string;
    scrapedContent: string;
  },
  icpPrompt: string,
): string {
  return `You are evaluating companies against an ideal customer profile (ICP).

Company Information:
Name: ${company.name}
Website: ${company.website}
Scraped Content: ${company.scrapedContent.slice(0, 6000)}

Ideal Customer Profile:
${icpPrompt}

Task:
1. Score this company from 1-5:
   - 1 = Not a fit at all (completely wrong industry/size/offering)
   - 2 = Potential fit (some overlap but missing key criteria)
   - 3 = Okay fit (meets basic criteria, not ideal)
   - 4 = Good fit (meets most criteria, strong match)
   - 5 = Perfect fit (meets all criteria, ideal customer)

2. Provide brief reasoning (2-3 sentences) explaining the score.

3. Identify any conflicting signals (e.g., website says "enterprise focus" but pricing suggests SMB).

Return ONLY JSON in this exact shape:
{
  "score": 4,
  "reasoning": "Brief explanation...",
  "conflicts": ["Conflicting signal 1", "Conflicting signal 2"]
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
