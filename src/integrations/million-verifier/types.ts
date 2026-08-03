/** Million Verifier API types (v3 single verification). */

export type EmailVerdict = "VALID" | "INVALID" | "RISKY" | "UNKNOWN";

export interface EmailVerification {
  email: string;
  verdict: EmailVerdict;
  reason?: string;
}

export interface AuthCheckResult {
  authenticated: boolean;
  message?: string;
}

export interface CreditsResult {
  credits: number | null;
}
