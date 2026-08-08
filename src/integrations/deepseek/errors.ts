import { HttpError } from "@/lib/http";

/** DeepSeek-specific error. */
export class DeepSeekError extends HttpError {
  constructor(message: string, status: number, retryable: boolean) {
    super(message, status, retryable);
    this.name = "DeepSeekError";
  }
}
