import { prisma } from "../../lib/db";
import { apolloClient } from "../../integrations/apollo/client";
import {
  completePhaseJob,
  enqueueNextPhase,
  failPhaseJob,
  failSearch,
  phaseProgress,
  startPhaseJob,
  updateJobProgress,
  updateSearchProgress,
} from "../../lib/pipeline";

/**
 * Phase 4: Email Enrichment (WORKFLOW.md Stage 6).
 * Finds email addresses for discovered contacts via Apollo, saving each
 * result immediately (crash-resistant). Checkpoint saved after every 50
 * contacts.
 *
 * Crash recovery: only contacts with status DISCOVERED are processed, so
 * re-running this handler (resumeEmailEnrichment) continues from the last
 * checkpoint with zero duplicate API calls.
 */
export async function enrichEmails(searchId: string) {
  const job = await startPhaseJob(searchId, "email-enrichment");

  try {
    const contacts = await prisma.contact.findMany({
      where: { company: { searchId }, status: "DISCOVERED" },
      orderBy: { createdAt: "asc" },
    });

    console.log(
      `[pipeline] Enriching ${contacts.length} contacts for search ${searchId}`,
    );

    let emailsFound = 0;
    let failed = 0;

    for (let i = 0; i < contacts.length; i += 50) {
      const batch = contacts.slice(i, i + 50);

      for (const contact of batch) {
        try {
          const email = contact.apolloId
            ? await apolloClient.getEmail(contact.apolloId)
            : null;

          if (email) {
            // IMMEDIATE SAVE (crash-resistant)
            await prisma.contact.update({
              where: { id: contact.id },
              data: {
                email,
                emailSource: "apollo",
                status: "EMAIL_FOUND",
              },
            });
            emailsFound++;
          } else {
            await prisma.contact.update({
              where: { id: contact.id },
              data: {
                status: "FAILED",
                errorMessage: "No email found for this contact",
              },
            });
            failed++;
          }
        } catch (error) {
          failed++;
          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              status: "FAILED",
              errorMessage:
                error instanceof Error ? error.message : "Enrichment failed",
            },
          });
        }
      }

      // CHECKPOINT after every 50 contacts
      const processed = Math.min(i + 50, contacts.length);
      await updateJobProgress(
        job.id,
        Math.round((processed / contacts.length) * 100),
      );
      await updateSearchProgress(
        searchId,
        "email-enrichment",
        phaseProgress("email-enrichment", processed / contacts.length),
        { emailsFound },
      );
      console.log(
        `[pipeline] Enrichment checkpoint: ${processed}/${contacts.length} contacts (${emailsFound} emails)`,
      );
    }

    const totalEmails = await prisma.contact.count({
      where: { company: { searchId }, email: { not: null } },
    });
    await updateSearchProgress(searchId, "email-enrichment", 85, {
      emailsFound: totalEmails,
    });
    await completePhaseJob(job.id);
    await enqueueNextPhase("email-enrichment", searchId);
    console.log(
      `[pipeline] Enrichment complete for ${searchId}: ${totalEmails} emails (from DB), ${failed} failed this run`,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Email enrichment failed";
    console.error(`[pipeline] Enrichment failed for ${searchId}:`, error);
    await failPhaseJob(job.id, message);
    await failSearch(searchId, message);
    throw error;
  }
}

/** Crash recovery entry point: resumes enrichment from the last checkpoint. */
export async function resumeEmailEnrichment(searchId: string) {
  console.log(`[pipeline] Resuming email enrichment for search ${searchId}`);
  await enrichEmails(searchId);
}
