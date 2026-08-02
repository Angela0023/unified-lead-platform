import { prisma } from "../../lib/db";
import { mvClient } from "../../integrations/million-verifier/client";
import type { EmailVerdict } from "../../integrations/million-verifier/types";
import {
  completePhaseJob,
  failPhaseJob,
  failSearch,
  startPhaseJob,
  updateSearchProgress,
} from "../../lib/pipeline";

/**
 * Phase 5: Email Validation (WORKFLOW.md Stage 7).
 * Uploads all enriched emails to Million Verifier as a single batch,
 * polls for results, and categorizes each email (VALID / RISKY / INVALID /
 * UNKNOWN). Marks the search COMPLETED when done.
 */
export async function handleEmailValidation(searchId: string) {
  const job = await startPhaseJob(searchId, "email-validation");

  try {
    const contacts = await prisma.contact.findMany({
      where: { company: { searchId }, status: "EMAIL_FOUND", email: { not: null } },
      orderBy: { createdAt: "asc" },
    });

    const emails = contacts
      .map((contact) => contact.email)
      .filter((email): email is string => Boolean(email));

    console.log(
      `[pipeline] Validating ${emails.length} emails for search ${searchId}`,
    );

    if (emails.length === 0) {
      // Nothing to validate - finish the search cleanly
      await updateSearchProgress(searchId, "email-validation", 100, {
        emailsValid: 0,
      });
      await prisma.search.update({
        where: { id: searchId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          currentPhase: "Email Validation Complete",
        },
      });
      await completePhaseJob(job.id);
      console.log(`[pipeline] Search ${searchId} completed (0 emails to validate)`);
      return;
    }

    const { batchId } = await mvClient.uploadBatch(emails);
    console.log(`[pipeline] Batch ${batchId} uploaded, polling for results...`);

    const batch = await mvClient.pollBatch(batchId);

    const verdictByEmail = new Map<string, EmailVerdict>(
      batch.results.map((result) => [result.email.toLowerCase(), result.verdict]),
    );

    let valid = 0;
    let risky = 0;
    let invalid = 0;

    for (const contact of contacts) {
      if (!contact.email) continue;
      const verdict = verdictByEmail.get(contact.email.toLowerCase());
      if (!verdict) continue;

      if (verdict === "VALID") valid++;
      else if (verdict === "RISKY") risky++;
      else invalid++;

      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          emailStatus: verdict,
          status: "EMAIL_VALIDATED",
        },
      });
    }

    await updateSearchProgress(searchId, "email-validation", 100, {
      emailsValid: valid,
    });
    await prisma.search.update({
      where: { id: searchId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        currentPhase: "Email Validation Complete",
      },
    });
    await completePhaseJob(job.id);

    console.log(
      `[pipeline] Email validation complete for ${searchId}: ${valid} valid, ${risky} risky, ${invalid} invalid/unknown`,
    );
    console.log(`[pipeline] Search ${searchId} COMPLETED`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Email validation failed";
    console.error(`[pipeline] Email validation failed for ${searchId}:`, error);
    await failPhaseJob(job.id, message);
    await failSearch(searchId, message);
    throw error;
  }
}
