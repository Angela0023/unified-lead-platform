export class ExaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExaError";
  }
}

export class ExaAuthError extends ExaError {
  constructor(message = "Exa authentication failed") {
    super(message);
    this.name = "ExaAuthError";
  }
}

export class ExaRateLimitError extends ExaError {
  constructor(message = "Exa rate limit exceeded") {
    super(message);
    this.name = "ExaRateLimitError";
  }
}
