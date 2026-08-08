import { HttpError } from "@/lib/http";

/** Million Verifier-specific error. */
export class MillionVerifierError extends HttpError {
  constructor(message: string, status: number, retryable: boolean) {
    super(message, status, retryable);
    this.name = "MillionVerifierError";
  }
}
