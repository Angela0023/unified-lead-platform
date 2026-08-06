export class ApifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApifyError";
  }
}

export class ApifyAuthError extends ApifyError {
  constructor(message = "Apify authentication failed") {
    super(message);
    this.name = "ApifyAuthError";
  }
}

export class ApifyTimeoutError extends ApifyError {
  constructor(message = "Apify actor timeout") {
    super(message);
    this.name = "ApifyTimeoutError";
  }
}

export class ApifyRunError extends ApifyError {
  constructor(message = "Apify actor run failed") {
    super(message);
    this.name = "ApifyRunError";
  }
}
