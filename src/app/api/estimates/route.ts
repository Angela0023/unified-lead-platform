import { NextResponse } from "next/server";
import { buildEstimate } from "@/lib/estimate";
import { validateSearchInput } from "@/lib/validation";

/** POST /api/estimates - Stage 2 cost & time estimation before approval. */
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
    return NextResponse.json(estimate);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Estimation failed" },
      { status: 500 },
    );
  }
}
