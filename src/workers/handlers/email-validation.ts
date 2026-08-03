import { prisma } from "../../lib/db";
import { mvClient } from "../../integrations/million-verifier/client";
import { guardMvCredits } from "../../lib/credit-guards";
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
      where: {
        company: { searchId },
        status: "EMAIL_FOUND",
        email: { not: null },
      },
      orderBy: { createdAt: "asc" },
    });

    const emails = contacts
      .map((contact) => contact.email)
      .filter((email): email is string => Boolean(email));

    // Cost guard: never start validation if Million Verifier credits are too low
    await guardMvCredits(emails.length + 10);

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
      console.log(
        `[pipeline] Search ${searchId} completed (0 emails to validate)`,
      );
      return;
    }

    console.log(
      `[pipeline] Validating ${emails.length} emails with Million Verifier (concurrency 5)...`,
    );

    // Per-email verification with immediate saves (crash-resistant)
    const verdicts = await mvClient.verifyEmails(emails, { concurrency: 5 });

    const verdictByEmail = new Map(
      verdicts.map((result) => [result.email.toLowerCase(), result]),
    );

    let valid = 0;
    let risky = 0;
    let invalid = 0;

    for (const contact of contacts) {
      if (!contact.email) continue;
      const result = verdictByEmail.get(contact.email.toLowerCase());
      if (!result) continue;

      if (result.verdict === "VALID") valid++;
      else if (result.verdict === "RISKY") risky++;
      else invalid++;

      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          emailStatus: result.verdict,
          status: "EMAIL_VALIDATED",
          errorMessage: result.reason,
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
