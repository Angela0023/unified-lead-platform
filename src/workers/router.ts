import type { Job } from "bullmq";
import type { LeadJobData } from "../lib/queue";

/**
 * Dispatches queue jobs to their phase handlers.
 * Phase handlers are added as their sprints complete (TODO.md sprints 6-10).
 */
export async function handleJob(job: Job<LeadJobData>): Promise<unknown> {
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
}
