/** DeepSeek API types (chat completions for company validation). */

export interface ValidationResult {
  score: number;
  reasoning: string;
  conflicts: string[];
}

export interface AuthCheckResult {
  authenticated: boolean;
  message?: string;
}

export interface BalanceResult {
  balance: number | null;
}
