import { config } from "@/lib/config";
import { fetchJson } from "@/lib/http";
import { demo } from "@/lib/demo-data";
import type {
  AuthCheckResult,
  CreditsResult,
  EmailVerdict,
  EmailVerification,
} from "./types";

/**
 * Million Verifier API v3 (real-time single verification).
 * See https://developer.millionverifier.com
 *
 * Base: https://api.millionverifier.com/api/v3
 * - GET /credits?api=KEY            -> { credits, bulk_credits, ... }
 * - GET /?api=KEY&email=...         -> { result, error, credits, ... }
 *
 * Note: verified 2026-08-02 - the v4 batch API used in earlier planning
 * docs does not exist; v3 single verification costs the same 1 credit
 * per email and is used for the MVP (see DECISIONS.md).
 */

const BASE_URL = "https://api.millionverifier.com/api/v3";

function buildUrl(path: string): string {
  return `${BASE_URL}${path}?api=${encodeURIComponent(config.millionVerifierApiKey)}`;
}

/** Maps Million Verifier result strings to our verdict enum. */
function mapVerdict(result: string): EmailVerdict {
  switch (result.toLowerCase()) {
    case "ok":
      return "VALID";
    case "catch_all":
      return "RISKY";
    case "disposable":
    case "invalid":
      return "INVALID";
    default:
      return "UNKNOWN";
  }
}

export const mvClient = {
  /** Verifies the API key is valid. */
  async testConnection(): Promise<AuthCheckResult> {
    if (config.demoMode) return demo.mvAuth();
    if (!config.millionVerifierApiKey) {
      return {
        authenticated: false,
        message: "MILLION_VERIFIER_API_KEY not set",
      };
    }
    try {
      const response = await fetchJson<{ credits?: number; error?: string }>(
        buildUrl("/credits"),
        { method: "GET", timeoutMs: 15_000 },
      );
      return {
        authenticated: typeof response.credits === "number",
        message: response.error ?? `Credits: ${response.credits ?? "unknown"}`,
      };
    } catch (error) {
      return {
        authenticated: false,
        message: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },

  /** Current single-verification credit balance (null when unavailable). */
  async getCreditsRemaining(): Promise<CreditsResult> {
    if (config.demoMode) return demo.mvCredits();
    if (!config.millionVerifierApiKey) return { credits: null };
    try {
      const response = await fetchJson<{ credits?: number }>(
        buildUrl("/credits"),
        { method: "GET", timeoutMs: 15_000 },
      );
      return { credits: response.credits ?? null };
    } catch {
      return { credits: null };
    }
  },

  /** Verifies a single email in real time (1 credit). */
  async verifyEmail(email: string): Promise<EmailVerification> {
    if (config.demoMode) return demo.mvVerifyEmail(email);
    const response = await fetchJson<{
      result?: string;
      error?: string;
    }>(
      `${BASE_URL}/?api=${encodeURIComponent(config.millionVerifierApiKey)}&email=${encodeURIComponent(email)}&timeout=10`,
      { method: "GET", timeoutMs: 30_000 },
    );
    return {
      email,
      verdict: response.error ? "UNKNOWN" : mapVerdict(response.result ?? ""),
      reason: response.error || undefined,
    };
  },

  /**
   * Verifies a list of emails with bounded concurrency.
   * Used by the email-validation phase (Stage 7).
   */
  async verifyEmails(
    emails: string[],
    options: { concurrency?: number } = {},
  ): Promise<EmailVerification[]> {
    const { concurrency = 5 } = options;
    const results: EmailVerification[] = [];
    let cursor = 0;

    async function worker(): Promise<void> {
      while (cursor < emails.length) {
        const email = emails[cursor];
        cursor++;
        try {
          results.push(await mvClient.verifyEmail(email));
        } catch (error) {
          results.push({
            email,
            verdict: "UNKNOWN",
            reason: error instanceof Error ? error.message : "Verification failed",
          });
        }
      }
    }

    const workers = Array.from(
      { length: Math.min(concurrency, emails.length) },
      () => worker(),
    );
    await Promise.all(workers);
    return results;
  },
};
