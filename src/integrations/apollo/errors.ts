import { HttpError } from "@/lib/http";

/** Apollo-specific error with retry guidance. */
export class ApolloError extends HttpError {
  constructor(message: string, status: number, retryable: boolean) {
    super(message, status, retryable);
    this.name = "ApolloError";
  }
}

/** True when the API key is missing or rejected by Apollo. */
export function isAuthError(error: unknown): boolean {
  return error instanceof ApolloError && (error.status === 401 || error.status === 403);
}
