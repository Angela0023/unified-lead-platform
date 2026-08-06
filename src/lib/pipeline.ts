import { prisma } from "./db";
import { enqueueSearchJob, type JobName } from "./queue";
import { getPhaseMeta } from "./constants";
import { triggerBackfillIfNeeded } from "./backfill";

/** Next phase in the pipeline (ARCHITECTURE.md job flow). */
const NEXT_PHASE: Partial<Record<JobName, JobName>> = {
  "company-discovery": "company-validation",
  "company-validation": "contact-discovery",
  "contact-discovery": "email-enrichment",
  "email-enrichment": "email-validation",
};

export async function enqueueNextPhase(jobType: JobName, searchId: string) {
  // Special handling after company-validation: check if backfill is needed
  if (jobType === "company-validation") {
    const backfillTriggered = await triggerBackfillIfNeeded(searchId);

    if (backfillTriggered) {
      console.log(
        `[pipeline] Backfill triggered, staying in validation phase`,
      );
      return; // Don't proceed to next phase yet
    }
  }

  const next = NEXT_PHASE[jobType];
  if (next) {
    await enqueueSearchJob(next, searchId);
  } else {
    // No next phase - mark search as complete
    await prisma.search.update({
      where: { id: searchId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }
}

/** Marks the phase job as running (or creates it), returning the Job row. */
export async function startPhaseJob(searchId: string, jobType: JobName) {
  const existing = await prisma.job.findFirst({
    where: { searchId, jobType, status: "RUNNING" },
  });
  if (existing) return existing;

  const job = await prisma.job.create({
    data: {
      searchId,
      jobType,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });
  return job;
}

export async function completePhaseJob(jobId: string) {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: "COMPLETED",
      progressPercent: 100,
      completedAt: new Date(),
    },
  });
}

export async function failPhaseJob(jobId: string, message: string) {
  await prisma.job.update({
    where: { id: jobId },
    data: { status: "FAILED", errorMessage: message, completedAt: new Date() },
  });
}

export async function updateJobProgress(jobId: string, percent: number) {
  await prisma.job.update({
    where: { id: jobId },
    data: { progressPercent: percent },
  });
}

/**
 * Updates the search record with current phase + cumulative progress.
 * overallPercent is the cumulative pipeline percentage (0-100).
 */
export async function updateSearchProgress(
  searchId: string,
  jobType: JobName,
  overallPercent: number,
  stats?: Partial<{
    companiesFound: number;
    companiesValidated: number;
    contactsFound: number;
    emailsFound: number;
    emailsValid: number;
  }>,
) {
  const phase = getPhaseMeta(jobType);
  await prisma.search.update({
    where: { id: searchId },
    data: {
      currentPhase: phase?.label,
      progressPercent: Math.max(0, Math.min(100, overallPercent)),
      status: "RUNNING",
      ...stats,
    },
  });
}

/** Converts a per-phase fraction (0-1) into a cumulative percentage. */
export function phaseProgress(jobType: JobName, fraction: number): number {
  const phase = getPhaseMeta(jobType);
  if (!phase) return 0;
  const clamped = Math.max(0, Math.min(1, fraction));
  return Math.round(
    phase.startPercent + (phase.endPercent - phase.startPercent) * clamped,
  );
}

/** Marks the search failed with a message (fatal phase errors only). */
export async function failSearch(searchId: string, message: string) {
  await prisma.search.update({
    where: { id: searchId },
    data: { status: "FAILED", errorMessage: message },
  });
}
