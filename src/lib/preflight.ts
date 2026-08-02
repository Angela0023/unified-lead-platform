import { prisma } from "./db";
import { config } from "./config";
import { apolloClient } from "@/integrations/apollo/client";
import { deepseekClient } from "@/integrations/deepseek/client";
import { firecrawlClient } from "@/integrations/firecrawl/client";
import { mvClient } from "@/integrations/million-verifier/client";
import IORedis from "ioredis";
import type { PreflightCheck, PreflightResult } from "./types";

const WORKER_HEARTBEAT_KEY = "ulp:worker:heartbeat";
const WORKER_HEARTBEAT_TTL_SECONDS = 30;

export { WORKER_HEARTBEAT_KEY, WORKER_HEARTBEAT_TTL_SECONDS };

function ok(
  key: string,
  label: string,
  message: string,
  detail?: string,
): PreflightCheck {
  return { key, label, status: "ok", message, detail };
}

function fail(
  key: string,
  label: string,
  message: string,
  detail?: string,
): PreflightCheck {
  return { key, label, status: "fail", message, detail };
}

async function checkDatabase(): Promise<PreflightCheck> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok("database", "Database", "Connected");
  } catch (error) {
    return fail(
      "database",
      "Database",
      "Connection failed",
      error instanceof Error ? error.message : undefined,
    );
  }
}

async function checkRedis(): Promise<PreflightCheck> {
  const connection = new IORedis(
    process.env.REDIS_URL ?? "redis://localhost:6379",
    {
      maxRetriesPerRequest: null,
      connectTimeout: 5000,
    },
  );
  try {
    await connection.ping();
    return ok("redis", "Redis", "Connected");
  } catch (error) {
    return fail(
      "redis",
      "Redis",
      "Connection failed",
      error instanceof Error ? error.message : undefined,
    );
  } finally {
    await connection.quit();
  }
}

async function checkWorker(): Promise<PreflightCheck> {
  const connection = new IORedis(
    process.env.REDIS_URL ?? "redis://localhost:6379",
    {
      maxRetriesPerRequest: null,
      connectTimeout: 5000,
    },
  );
  try {
    const heartbeat = await connection.get(WORKER_HEARTBEAT_KEY);
    if (!heartbeat) {
      return fail(
        "worker",
        "Background Worker",
        "Not running",
        "No heartbeat detected. Start with: npm run worker",
      );
    }
    const ageSeconds = (Date.now() - Number(heartbeat)) / 1000;
    if (ageSeconds > WORKER_HEARTBEAT_TTL_SECONDS * 2) {
      return fail(
        "worker",
        "Background Worker",
        "Stale heartbeat",
        `Last heartbeat ${Math.round(ageSeconds)}s ago`,
      );
    }
    return ok(
      "worker",
      "Background Worker",
      "Running",
      `Heartbeat ${Math.round(ageSeconds)}s ago`,
    );
  } catch (error) {
    return fail(
      "worker",
      "Background Worker",
      "Cannot reach Redis",
      error instanceof Error ? error.message : undefined,
    );
  } finally {
    await connection.quit();
  }
}

async function checkApollo(): Promise<PreflightCheck> {
  if (config.demoMode) {
    return ok(
      "apollo",
      "Apollo",
      "Demo mode (simulated)",
      "No API key required",
    );
  }
  if (!config.apolloApiKey) {
    return fail("apollo", "Apollo", "APOLLO_API_KEY not set");
  }
  const auth = await apolloClient.testConnection();
  if (!auth.authenticated) {
    return fail("apollo", "Apollo", "Authentication failed", auth.message);
  }
  const credits = await apolloClient.getCreditsRemaining();
  return ok(
    "apollo",
    "Apollo",
    "Authenticated",
    credits.credits !== null
      ? `${credits.credits} credits remaining`
      : undefined,
  );
}

async function checkDeepSeek(): Promise<PreflightCheck> {
  if (config.demoMode) {
    return ok(
      "deepseek",
      "DeepSeek",
      "Demo mode (simulated)",
      "No API key required",
    );
  }
  if (!config.deepseekApiKey) {
    return fail("deepseek", "DeepSeek", "DEEPSEEK_API_KEY not set");
  }
  const auth = await deepseekClient.testConnection();
  if (!auth.authenticated) {
    return fail("deepseek", "DeepSeek", "Authentication failed", auth.message);
  }
  const balance = await deepseekClient.getBalance();
  return ok(
    "deepseek",
    "DeepSeek",
    "Authenticated",
    balance.balance !== null
      ? `Balance: $${balance.balance.toFixed(2)}`
      : undefined,
  );
}

async function checkFirecrawl(): Promise<PreflightCheck> {
  if (config.demoMode) {
    return ok(
      "firecrawl",
      "Firecrawl",
      "Demo mode (simulated)",
      "No API key required",
    );
  }
  if (!config.firecrawlApiKey) {
    return fail("firecrawl", "Firecrawl", "FIRECRAWL_API_KEY not set");
  }
  const auth = await firecrawlClient.testConnection();
  if (!auth.authenticated) {
    return fail(
      "firecrawl",
      "Firecrawl",
      "Authentication failed",
      auth.message,
    );
  }
  const credits = await firecrawlClient.getCreditsRemaining();
  return ok(
    "firecrawl",
    "Firecrawl",
    "Authenticated",
    credits.credits !== null
      ? `${credits.credits} credits remaining`
      : undefined,
  );
}

async function checkMillionVerifier(): Promise<PreflightCheck> {
  if (config.demoMode) {
    return ok(
      "million-verifier",
      "Million Verifier",
      "Demo mode (simulated)",
      "No API key required",
    );
  }
  if (!config.millionVerifierApiKey) {
    return fail(
      "million-verifier",
      "Million Verifier",
      "MILLION_VERIFIER_API_KEY not set",
    );
  }
  const auth = await mvClient.testConnection();
  if (!auth.authenticated) {
    return fail(
      "million-verifier",
      "Million Verifier",
      "Authentication failed",
      auth.message,
    );
  }
  const credits = await mvClient.getCreditsRemaining();
  return ok(
    "million-verifier",
    "Million Verifier",
    "Authenticated",
    credits.credits !== null
      ? `${credits.credits} credits remaining`
      : undefined,
  );
}

/**
 * Runs all Stage 1 pre-flight checks (QUALITY-GATES.md Gate 1).
 * Any failing check means the search must not start.
 */
export async function runPreflight(): Promise<PreflightResult> {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkWorker(),
    checkApollo(),
    checkDeepSeek(),
    checkFirecrawl(),
    checkMillionVerifier(),
  ]);

  return {
    demo: config.demoMode,
    checks,
    allPassed: checks.every((check) => check.status === "ok"),
  };
}
