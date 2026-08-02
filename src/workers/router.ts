import type { Job } from "bullmq";
import type { LeadJobData } from "../lib/queue";
import { handleCompanyDiscovery } from "./handlers/company-discovery";
import { handleCompanyValidation } from "./handlers/company-validation";
import { handleContactDiscovery } from "./handlers/contact-discovery";
import { enrichEmails } from "./handlers/email-enrichment";
import { handleEmailValidation } from "./handlers/email-validation";

/**
 * Dispatches queue jobs to their phase handlers
 * (WORKFLOW.md stages 3-7; ARCHITECTURE.md job flow).
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

    case "company-discovery":
      await handleCompanyDiscovery(job.data.searchId);
      return { ok: true };

    case "company-validation":
      await handleCompanyValidation(job.data.searchId);
      return { ok: true };

    case "contact-discovery":
      await handleContactDiscovery(job.data.searchId);
      return { ok: true };

    case "email-enrichment":
      await enrichEmails(job.data.searchId);
      return { ok: true };

    case "email-validation":
      await handleEmailValidation(job.data.searchId);
      return { ok: true };

    default:
      throw new Error(`No handler registered for job type: ${job.name}`);
  }
}
