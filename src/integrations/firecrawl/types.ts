/** Firecrawl API types (website scraping). */

export interface ScrapeResult {
  url: string;
  markdown: string;
  success: boolean;
}

export interface AuthCheckResult {
  authenticated: boolean;
  message?: string;
}

export interface CreditsResult {
  credits: number | null;
}
