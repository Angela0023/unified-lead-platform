import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSearchInput } from "@/lib/validation";
import { buildEstimate } from "@/lib/estimate";
import { enqueueSearchJob } from "@/lib/queue";

/**
 * POST /api/searches - create a new search (Stage 3).
 * Creates the database record, stores the estimate, queues the
 * company-discovery job, and returns immediately.
 *
 * GET /api/searches - recent searches (landing page history).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = validateSearchInput(body);
    if (!input) {
      return NextResponse.json(
        { error: "Invalid search input. All fields are required." },
        { status: 400 },
      );
    }

    const estimate = await buildEstimate(input);

    const search = await prisma.search.create({
      data: {
        industry: input.industry,
        companySize: input.companySize,
        location: input.location,
        targetRole: input.targetRole,
        icpPrompt: input.icpPrompt,
        status: "PENDING",
        estimatedCost: estimate.costMin,
        estimatedTimeMinutes: estimate.timeMinutes,
      },
    });

    await enqueueSearchJob("company-discovery", search.id);

    return NextResponse.json({
      searchId: search.id,
      status: "pending",
      message: "Search queued successfully",
      estimate: {
        costMin: estimate.costMin,
        costMax: estimate.costMax,
        timeMinutes: estimate.timeMinutes,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create search" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const searches = await prisma.search.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      createdAt: true,
      status: true,
      progressPercent: true,
      industry: true,
      location: true,
      targetRole: true,
      companiesValidated: true,
      emailsValid: true,
      currentPhase: true,
    },
  });
  return NextResponse.json({ searches });
}
