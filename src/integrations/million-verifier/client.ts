import { config } from "@/lib/config";
import { fetchJson } from "@/lib/http";
import { demo } from "@/lib/demo-data";
import { MillionVerifierError } from "./errors";
import type {
  AuthCheckResult,
  BatchStatusResult,
  BatchUploadResult,
  CreditsResult,
  EmailVerdict,
} from "./types";
import { BATCH_MAX_WAIT_MS, BATCH_POLL_INTERVAL_MS } from "./types";

const BASE_URL = "https://api.millionverifier.com/api/v4";

function buildUrl(path: string): string {
  return `${BASE_URL}${path}?apiKey=${encodeURIComponent(config.millionVerifierApiKey)}`;
}

/** Maps Million Verifier result strings to our verdict enum. */
function mapVerdict(result: string): EmailVerdict {
  switch (result.toLowerCase()) {
    case "ok":
      return "VALID";
    case "invalid":
      return "INVALID";
    case "catch_all":
    case "risky":
    case "unknown_risky":
      return "RISKY";
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
        buildUrl("/credits-balance"),
        { method: "GET", timeoutMs: 15_000 },
      );
      return {
        authenticated: response.error ? false : true,
        message: response.error ?? `Credits: ${response.credits ?? "unknown"}`,
      };
    } catch (error) {
      return {
        authenticated: false,
        message: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },

  /** Current credit balance (null when unavailable). */
  async getCreditsRemaining(): Promise<CreditsResult> {
    if (config.demoMode) return demo.mvCredits();
    if (!config.millionVerifierApiKey) return { credits: null };
    try {
      const response = await fetchJson<{ credits?: number }>(
        buildUrl("/credits-balance"),
        { method: "GET", timeoutMs: 15_000 },
      );
      return { credits: response.credits ?? null };
    } catch {
      return { credits: null };
    }
  },

  /** Email validation (Stage 7 / Phase 5): upload a batch of emails. */
  async uploadBatch(emails: string[]): Promise<BatchUploadResult> {
    if (config.demoMode) return demo.mvUploadBatch(emails);
    try {
      const response = await fetchJson<{ id?: string; error?: string }>(
        buildUrl("/batches"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emails),
          timeoutMs: 60_000,
        },
      );
      if (!response.id) {
        throw new MillionVerifierError(
          response.error ?? "Million Verifier returned no batch id",
          0,
          false,
        );
      }
      return { batchId: response.id };
    } catch (error) {
      if (error instanceof MillionVerifierError) throw error;
      throw new MillionVerifierError(
        error instanceof Error ? error.message : "Batch upload failed",
        0,
        false,
      );
    }
  },

  /** Polls a batch until results are ready (WORKFLOW.md Stage 7: 5-10 min). */
  async pollBatch(batchId: string): Promise<BatchStatusResult> {
    if (config.demoMode) return demo.mvPollBatch(batchId);

    const startedAt = Date.now();
    while (Date.now() - startedAt < BATCH_MAX_WAIT_MS) {
      const response = await fetchJson<{
        id?: string;
        status?: string;
        progress?: number;
        results?: {
          email?: string;
          result?: string;
          reason?: string;
        }[];
      }>(buildUrl(`/batches/${batchId}`), {
        method: "GET",
        timeoutMs: 20_000,
      });

      const results = (response.results ?? []).map((item) => ({
        email: item.email ?? "",
        verdict: mapVerdict(item.result ?? ""),
        reason: item.reason,
      }));

      if (response.status === "ready" || results.length > 0) {
        return {
          batchId: response.id ?? batchId,
          status: response.status ?? "ready",
          progress: response.progress ?? 100,
          results,
        };
      }
      await new Promise((resolve) =>
        setTimeout(resolve, BATCH_POLL_INTERVAL_MS),
      );
    }
    throw new MillionVerifierError(
      `Batch ${batchId} did not complete within ${BATCH_MAX_WAIT_MS / 60000} minutes`,
      0,
      false,
    );
  },
};
