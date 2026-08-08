import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { LeadResult, SearchResultsResponse } from "@/lib/types";

/**
 * GET /api/searches/:id/results - final results for display (Stage 9).
 * Returns only deliverable leads (VALID + RISKY emails), plus summary stats.
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

  if (search.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Search is not completed yet", status: search.status },
      { status: 409 },
    );
  }

  const contacts = await prisma.contact.findMany({
    where: {
      company: { searchId: params.id },
      emailStatus: { in: ["VALID", "RISKY"] },
      email: { not: null },
    },
    include: {
      company: {
        select: {
          name: true,
          website: true,
          industry: true,
          score: true,
          location: true,
        },
      },
    },
    orderBy: [{ company: { score: "desc" } }, { company: { name: "asc" } }],
  });

  const leads: LeadResult[] = contacts.map((contact) => ({
    company: contact.company.name,
    companyScore: contact.company.score,
    website: contact.company.website,
    industry: contact.company.industry,
    name: contact.name,
    title: contact.title,
    email: contact.email,
    emailStatus: contact.emailStatus,
    linkedinUrl: contact.linkedinUrl,
  }));

  const validCount = leads.filter(
    (lead) => lead.emailStatus === "VALID",
  ).length;
  const riskyCount = leads.length - validCount;
  const companiesProcessed = await prisma.company.count({
    where: { searchId: params.id },
  });

  const response: SearchResultsResponse = {
    searchId: params.id,
    summary: {
      totalLeads: leads.length,
      companiesProcessed,
      validEmails: validCount,
      riskyEmails: riskyCount,
      successRate:
        companiesProcessed > 0 ? leads.length / companiesProcessed : 0,
    },
    leads,
  };

  return NextResponse.json(response);
}
