import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { SearchStatusResponse } from "@/lib/types";

/**
 * GET /api/searches/:id/status - real-time search status (ARCHITECTURE.md).
 * The progress page polls this endpoint.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const search = await prisma.search.findUnique({
    where: { id: params.id },
  });

  if (!search) {
    return NextResponse.json({ error: "Search not found" }, { status: 404 });
  }

  let estimatedCompletion: string | null = null;
  if (search.status === "RUNNING" && search.progressPercent > 0) {
    // Extrapolate from observed progress rate
    const elapsedMs = Date.now() - search.createdAt.getTime();
    const totalMs = elapsedMs / (search.progressPercent / 100);
    estimatedCompletion = new Date(
      search.createdAt.getTime() + totalMs,
    ).toISOString();
  }

  const response: SearchStatusResponse = {
    id: search.id,
    status: search.status,
    currentPhase: search.currentPhase,
    progressPercent: search.progressPercent,
    errorMessage: search.errorMessage,
    stats: {
      companiesFound: search.companiesFound,
      companiesValidated: search.companiesValidated,
      contactsFound: search.contactsFound,
      emailsFound: search.emailsFound,
      emailsValid: search.emailsValid,
    },
    createdAt: search.createdAt.toISOString(),
    completedAt: search.completedAt?.toISOString() ?? null,
    estimatedCompletion,
    input: {
      industry: search.industry,
      companySize: search.companySize,
      location: search.location,
      targetRole: search.targetRole,
      icpPrompt: search.icpPrompt,
    },
  };

  return NextResponse.json(response);
}
