/** Million Verifier API types (batch email validation). */

export type EmailVerdict = "VALID" | "INVALID" | "RISKY" | "UNKNOWN";

export interface EmailVerification {
  email: string;
  verdict: EmailVerdict;
  reason?: string;
}

export interface BatchUploadResult {
  batchId: string;
}

export interface BatchStatusResult {
  batchId: string;
  status: string;
  progress: number;
  results: EmailVerification[];
}

export interface AuthCheckResult {
  authenticated: boolean;
  message?: string;
}

export interface CreditsResult {
  credits: number | null;
}

export const BATCH_POLL_INTERVAL_MS = 5_000;
export const BATCH_MAX_WAIT_MS = 10 * 60 * 1000;
