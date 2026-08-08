/** Shared HTTP helpers for integration clients. */

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

interface FetchJsonOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * fetch wrapper with timeout, JSON parsing, and retryable-error normalization.
 * Retries (429 and 5xx) are handled by callers via retryWithBackoff.
 */
export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  const { timeoutMs = 30_000, ...init } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    const isTimeout = error instanceof Error && error.name === "AbortError";
    throw new HttpError(
      isTimeout ? `Request timed out after ${timeoutMs}ms` : message,
      0,
      !isTimeout,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const retryable = response.status === 429 || response.status >= 500;
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as {
        message?: string;
        error?: string;
      };
      message = body.message ?? body.error ?? message;
    } catch {
      // non-JSON error body - keep generic message
    }
    throw new HttpError(message, response.status, retryable);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** 3 retries with exponential backoff (1s, 2s, 4s) per ARCHITECTURE.md. */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: { retries?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const { retries = 3, baseDelayMs = 1000 } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof HttpError
          ? error.retryable
          : !(error instanceof Error && "retryable" in error);
      if (attempt === retries || !retryable) {
        throw error;
      }
      const delay = baseDelayMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
