import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { prisma } from "../lib/db";
import { enqueueSearchJob } from "../lib/queue";

/**
 * End-to-end pipeline test without the UI:
 * creates a search record and queues the company-discovery job.
 * Run with: npm run test:search (requires worker running)
 */
async function main() {
  const search = await prisma.search.create({
    data: {
      industry: ["Software", "Financial Services"],
      companySize: "51-200",
      location: ["United States", "United Kingdom"],
      targetRole: "CTO",
      icpPrompt:
        "B2B SaaS companies selling to enterprises, 50-200 employees, API-first products, fintech or healthcare verticals",
      status: "PENDING",
    },
  });
  console.log(`[test] Search created: ${search.id}`);
  await enqueueSearchJob("company-discovery", search.id);
  console.log("[test] company-discovery job queued");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("[test] Failed:", error);
  process.exit(1);
});
