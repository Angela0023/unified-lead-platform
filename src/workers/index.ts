import "dotenv/config";
import { Worker } from "bullmq";
import {
  QUEUE_NAME,
  createRedisConnection,
  type LeadJobData,
} from "../lib/queue";

/**
 * Background worker process for the lead generation pipeline.
 * Run with: npm run worker
 *
 * Phase handlers (company-discovery, validation, etc.) are implemented
 * in their respective sprints (see TODO.md). Only the connection test
 * handler is registered in this sprint.
 */

const connection = createRedisConnection();

const worker = new Worker<LeadJobData>(
  QUEUE_NAME,
  async (job) => {
    console.log(
      `[worker] Received job: ${job.name} (id: ${job.id}, searchId: ${job.data.searchId})`,
    );

    switch (job.name) {
      case "test-connection":
        console.log(`[worker] Test connection job ${job.id} processed.`);
        await job.updateProgress(100);
        return { ok: true, processedAt: new Date().toISOString() };

      default:
        throw new Error(`No handler registered for job type: ${job.name}`);
    }
  },
  {
    connection,
  },
);

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
  await worker.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
