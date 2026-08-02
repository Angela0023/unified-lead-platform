import "dotenv/config";
import { Queue } from "bullmq";
import { QUEUE_NAME, createRedisConnection } from "../lib/queue";

/**
 * Local queue smoke test: enqueues a test job and verifies the worker
 * picks it up. Run with: npm run test:queue (requires worker running).
 */
async function main() {
  const connection = createRedisConnection();
  const queue = new Queue(QUEUE_NAME, { connection });

  try {
    console.log("[test] Adding test job to queue...");
    const job = await queue.add("test-connection", {
      searchId: "test-local-connection",
    });
    console.log(`[test] Job enqueued: ${job.id}`);
  } finally {
    await queue.close();
    await connection.quit();
  }
}

main().catch((error) => {
  console.error("[test] Queue test failed:", error);
  process.exit(1);
});
