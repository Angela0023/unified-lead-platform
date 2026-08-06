export class ProspeoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProspeoError";
  }
}

export class ProspeoAuthError extends ProspeoError {
  constructor(message = "Prospeo authentication failed") {
    super(message);
    this.name = "ProspeoAuthError";
  }
}

export class ProspeoRateLimitError extends ProspeoError {
  constructor(message = "Prospeo rate limit exceeded") {
    super(message);
    this.name = "ProspeoRateLimitError";
  }
}
