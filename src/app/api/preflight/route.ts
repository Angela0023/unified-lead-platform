import { NextResponse } from "next/server";
import { runPreflight } from "@/lib/preflight";

/** GET /api/preflight - Stage 1 environment health checks. */
export async function GET() {
  const result = await runPreflight();
  return NextResponse.json(result);
}
