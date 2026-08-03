import { Worker } from "bullmq";

// Env vars are loaded by the start script via `node --env-file-if-exists=.env.local`.
console.log(
  `[worker] cwd: ${process.cwd()} | demo: ${process.env.DEMO_MODE ?? "unset"} | apollo key: ${process.env.APOLLO_API_KEY ? "set" : "MISSING"} | companies/search: ${process.env.COMPANIES_PER_SEARCH ?? "unset"}`,
);
import {
  QUEUE_NAME,
  createRedisConnection,
  type LeadJobData,
} from "../lib/queue";
import {
  WORKER_HEARTBEAT_KEY,
  WORKER_HEARTBEAT_TTL_SECONDS,
} from "../lib/preflight";
import { handleJob } from "./router";

/**
 * Background worker process for the lead generation pipeline.
 * Run with: npm run worker
 *
 * Job handlers are registered in ./router.ts. The worker also emits a
 * Redis heartbeat so the Stage 1 pre-flight checks can verify it is alive.
 */

const connection = createRedisConnection();
// Heartbeat uses its own connection so it never interferes with BullMQ's
// internal lock/queue commands.
const heartbeatConnection = createRedisConnection();

const worker = new Worker<LeadJobData>(QUEUE_NAME, (job) => handleJob(job), {
  connection,
  // Phases can run 20-60+ minutes (scraping + AI validation). The default
  // 30s lock would expire mid-phase and re-queue the job.
  lockDuration: 60 * 60 * 1000,
});

const heartbeatTimer = setInterval(async () => {
  try {
    await heartbeatConnection.set(
      WORKER_HEARTBEAT_KEY,
      Date.now().toString(),
      "EX",
      WORKER_HEARTBEAT_TTL_SECONDS,
    );
  } catch (error) {
    console.error("[worker] Failed to write heartbeat:", error);
  }
}, 10_000);

worker.on("ready", () => {
  console.log("[worker] Connected to Redis and waiting for jobs...");
});

worker.on("completed", (job) => {
  console.log(`[worker] Job completed: ${job.name} (id: ${job.id})`);
});

worker.on("failed", (job, error) => {
  console.error(
    `[worker] Job failed: ${job?.name} (id: ${job?.id}): ${error.message}`,
  );
});

async function shutdown(signal: string) {
  console.log(`[worker] ${signal} received, shutting down...`);
  clearInterval(heartbeatTimer);
  await worker.close();
  await connection.quit();
  await heartbeatConnection.quit();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
