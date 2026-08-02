import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with test data...");

  // Delete existing data (idempotent seed)
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.job.deleteMany();
  await prisma.search.deleteMany();

  const search = await prisma.search.create({
    data: {
      industry: ["Software", "Financial Services"],
      companySize: "50-200",
      location: ["United States", "United Kingdom"],
      targetRole: "CTO",
      icpPrompt:
        "B2B SaaS companies selling to enterprises, must have 50-200 employees, must offer API-first products or developer tools, preferably in fintech or healthcare verticals",
      status: "COMPLETED",
      currentPhase: "Email Validation Complete",
      progressPercent: 100,
      companiesFound: 5,
      companiesValidated: 4,
      contactsFound: 5,
      emailsFound: 4,
      emailsValid: 3,
      completedAt: new Date(),
    },
  });

  const companies = [
    {
      name: "Acme Analytics",
      website: "acmeanalytics.com",
      industry: "Software",
      size: 120,
      location: "United States",
      score: 5,
      scoreReasoning:
        "B2B SaaS with API-first developer tools, 120 employees, enterprise customers. Perfect ICP fit.",
      status: "VALIDATED" as const,
    },
    {
      name: "Fintech Innovations",
      website: "fintechinnovations.io",
      industry: "Financial Services",
      size: 80,
      location: "United States",
      score: 4,
      scoreReasoning:
        "Fintech SaaS serving enterprises, 80 employees. Strong fit, slightly smaller than ideal.",
      status: "VALIDATED" as const,
    },
    {
      name: "HealthTech Solutions",
      website: "healthtechsolutions.com",
      industry: "Healthcare",
      size: 150,
      location: "United Kingdom",
      score: 3,
      scoreReasoning:
        "Healthcare software company with API products, 150 employees. Meets basic criteria.",
      status: "VALIDATED" as const,
    },
    {
      name: "DataStream Corp",
      website: "datastreamcorp.com",
      industry: "Software",
      size: 90,
      location: "United Kingdom",
      score: 2,
      scoreReasoning:
        "Developer tools company but primarily consumer-facing products. Partial fit only.",
      status: "VALIDATED" as const,
    },
    {
      name: "Global Widgets Ltd",
      website: "globalwidgets.co.uk",
      industry: "Manufacturing",
      size: 500,
      location: "United Kingdom",
      score: 1,
      scoreReasoning:
        "Manufacturing company, no software products, 500 employees. Not a fit for this ICP.",
      status: "REJECTED" as const,
    },
  ];

  const createdCompanies = [];
  for (const company of companies) {
    const created = await prisma.company.create({
      data: { ...company, searchId: search.id },
    });
    createdCompanies.push(created);
  }

  const contacts = [
    {
      companyId: createdCompanies[0].id,
      name: "John Smith",
      title: "CTO",
      linkedinUrl: "linkedin.com/in/johnsmith",
      email: "john@acmeanalytics.com",
      emailStatus: "VALID" as const,
      emailSource: "apollo",
      status: "EMAIL_VALIDATED" as const,
    },
    {
      companyId: createdCompanies[0].id,
      name: "Jane Doe",
      title: "VP Engineering",
      linkedinUrl: "linkedin.com/in/janedoe",
      email: "jane@acmeanalytics.com",
      emailStatus: "VALID" as const,
      emailSource: "apollo",
      status: "EMAIL_VALIDATED" as const,
    },
    {
      companyId: createdCompanies[1].id,
      name: "Alice Johnson",
      title: "CTO",
      linkedinUrl: "linkedin.com/in/alicejohnson",
      email: "alice@fintechinnovations.io",
      emailStatus: "VALID" as const,
      emailSource: "apollo",
      status: "EMAIL_VALIDATED" as const,
    },
    {
      companyId: createdCompanies[2].id,
      name: "Bob Williams",
      title: "Chief Technology Officer",
      linkedinUrl: "linkedin.com/in/bobwilliams",
      email: "bob@healthtechsolutions.com",
      emailStatus: "RISKY" as const,
      emailSource: "apollo",
      status: "EMAIL_VALIDATED" as const,
    },
    {
      companyId: createdCompanies[3].id,
      name: "Carol Brown",
      title: "Head of Engineering",
      linkedinUrl: "linkedin.com/in/carolbrown",
      email: null,
      emailStatus: null,
      emailSource: null,
      status: "DISCOVERED" as const,
    },
  ];

  for (const contact of contacts) {
    await prisma.contact.create({ data: contact });
  }

  await prisma.job.create({
    data: {
      searchId: search.id,
      jobType: "company-discovery",
      status: "COMPLETED",
      progressPercent: 100,
      startedAt: new Date(Date.now() - 60 * 60 * 1000),
      completedAt: new Date(),
    },
  });

  await prisma.job.create({
    data: {
      searchId: search.id,
      jobType: "email-validation",
      status: "COMPLETED",
      progressPercent: 100,
      startedAt: new Date(Date.now() - 30 * 60 * 1000),
      completedAt: new Date(),
    },
  });

  const stats = {
    searches: await prisma.search.count(),
    companies: await prisma.company.count(),
    contacts: await prisma.contact.count(),
    jobs: await prisma.job.count(),
  };
  console.log("Seed complete:", stats);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
