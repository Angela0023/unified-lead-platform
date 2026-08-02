import { Queue } from "bullmq";
import IORedis from "ioredis";

/**
 * BullMQ queue definitions for the lead generation pipeline.
 * API routes enqueue jobs here; background workers consume them.
 *
 * See ARCHITECTURE.md "Background Job Processing" for the job flow.
 */

export const QUEUE_NAME = "lead-generation";

export type JobName =
  | "test-connection"
  | "company-discovery"
  | "company-validation"
  | "contact-discovery"
  | "email-enrichment"
  | "email-validation";

export interface LeadJobData {
  searchId: string;
}

/**
 * Creates a dedicated Redis connection for BullMQ.
 * BullMQ requires workers and queues to use their own connections,
 * and callers are responsible for closing connections they create.
 */
export function createRedisConnection(): IORedis {
  return new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
}

/** Enqueues a search pipeline job (called by API routes). */
export async function enqueueSearchJob(
  jobName: JobName,
  searchId: string,
): Promise<void> {
  const queue = new Queue<LeadJobData>(QUEUE_NAME, {
    connection: createRedisConnection(),
  });
  try {
    await queue.add(jobName, { searchId });
  } finally {
    await queue.close();
  }
}
