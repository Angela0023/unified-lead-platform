export interface ExaSearchParams {
  query: string;
  numResults?: number;
  category?: string;
}

export interface ExaResult {
  url: string;
  title: string;
  snippet: string;
  publishedDate?: string;
}

export interface AuthCheckResult {
  authenticated: boolean;
  error?: string;
}
