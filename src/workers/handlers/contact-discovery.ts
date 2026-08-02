import { prisma } from "../../lib/db";
import { apolloClient } from "../../integrations/apollo/client";
import { MAX_CONTACTS_PER_COMPANY } from "../../lib/constants";
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
 * Phase 3: Contact Discovery (WORKFLOW.md Stage 5).
 * Finds decision makers (matching the target role) at each validated
 * company, de-duplicates them, and keeps the top MAX_CONTACTS_PER_COMPANY.
 * Checkpoint saved after every 50 companies.
 */
export async function handleContactDiscovery(searchId: string) {
  const search = await prisma.search.findUniqueOrThrow({
    where: { id: searchId },
  });
  const job = await startPhaseJob(searchId, "contact-discovery");

  try {
    const companies = await prisma.company.findMany({
      where: { searchId, status: "VALIDATED" },
      orderBy: { createdAt: "asc" },
    });

    console.log(
      `[pipeline] Finding contacts at ${companies.length} companies for search ${searchId}`,
    );

    let contactsFound = 0;
    let failedCompanies = 0;

    for (let i = 0; i < companies.length; i += 50) {
      const batch = companies.slice(i, i + 50);

      for (const company of batch) {
        try {
          const people = await apolloClient.findContacts({
            organizationId: company.apolloId ?? company.name,
            title: search.targetRole,
            limit: MAX_CONTACTS_PER_COMPANY,
          });

          // De-duplication: keep distinct names, max 2 per company
          const seen = new Set<string>();
          const unique = people.filter((person) => {
            const key = person.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          if (unique.length === 0) {
            continue;
          }

          await prisma.contact.createMany({
            data: unique.slice(0, MAX_CONTACTS_PER_COMPANY).map((person) => ({
              companyId: company.id,
              name: person.name,
              title: person.title ?? search.targetRole,
              linkedinUrl: person.linkedinUrl,
              apolloId: person.id,
              status: "DISCOVERED",
            })),
          });
          contactsFound += Math.min(unique.length, MAX_CONTACTS_PER_COMPANY);
        } catch (error) {
          failedCompanies++;
          console.error(
            `[pipeline] Contact lookup failed for company ${company.id} (${company.name}):`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      // CHECKPOINT after every 50 companies
      const processed = Math.min(i + 50, companies.length);
      await updateJobProgress(
        job.id,
        Math.round((processed / companies.length) * 100),
      );
      await updateSearchProgress(
        searchId,
        "contact-discovery",
        phaseProgress("contact-discovery", processed / companies.length),
        { contactsFound },
      );
      console.log(
        `[pipeline] Contact checkpoint: ${processed}/${companies.length} companies, ${contactsFound} contacts`,
      );
    }

    await updateSearchProgress(searchId, "contact-discovery", 65, {
      contactsFound,
    });
    await completePhaseJob(job.id);
    await enqueueNextPhase("contact-discovery", searchId);
    console.log(
      `[pipeline] Contact discovery complete for ${searchId}: ${contactsFound} contacts (${failedCompanies} companies failed)`,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Contact discovery failed";
    console.error(
      `[pipeline] Contact discovery failed for ${searchId}:`,
      error,
    );
    await failPhaseJob(job.id, message);
    await failSearch(searchId, message);
    throw error;
  }
}
