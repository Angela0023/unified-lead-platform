import { HttpError } from "@/lib/http";

/** Firecrawl-specific error. */
export class FirecrawlError extends HttpError {
  constructor(message: string, status: number, retryable: boolean) {
    super(message, status, retryable);
    this.name = "FirecrawlError";
  }
}
