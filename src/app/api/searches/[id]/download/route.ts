import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * GET /api/searches/:id/download - download results as CSV (Stage 9).
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
      { error: "Search is not completed yet" },
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
        },
      },
    },
    orderBy: [{ company: { score: "desc" } }, { company: { name: "asc" } }],
  });

  const header = [
    "Company",
    "Company Score",
    "Website",
    "Industry",
    "Contact Name",
    "Title",
    "Email",
    "Email Status",
    "LinkedIn URL",
  ];

  const rows = contacts.map((contact) => [
    contact.company.name,
    contact.company.score?.toString() ?? "",
    contact.company.website,
    contact.company.industry ?? "",
    contact.name,
    contact.title,
    contact.email ?? "",
    contact.emailStatus ?? "",
    contact.linkedinUrl ?? "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => csvEscape(cell ?? "")).join(","))
    .join("\n");

  const filename = `leads-${params.id.slice(0, 8)}.csv`;

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
