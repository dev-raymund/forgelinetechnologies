/**
 * Drains the prospecting audit queue.
 *
 *   npm run prospecting:drain
 *   npm run prospecting:drain -- --limit 50
 *
 * This is the primary way to work through a large import. It runs on your
 * machine rather than on Vercel, so no serverless time limit applies and a
 * few hundred prospects can be audited in one unattended run. A pause between
 * audits keeps the request rate polite.
 */
import { drainAuditQueue } from "../src/lib/prospecting/drain.ts";
import { productionDrainDependencies } from "../src/lib/prospecting/queue.ts";
import { describeError } from "../src/lib/retry.ts";

const flag = process.argv.indexOf("--limit");
const limit = flag === -1 ? 500 : Number(process.argv[flag + 1]);

if (!Number.isSafeInteger(limit) || limit < 1) {
  console.error("--limit must be a positive whole number");
  process.exit(1);
}

console.log(`Draining up to ${limit} queued audits. Ctrl-C to stop.`);

try {
  const summary = await drainAuditQueue(
    { limit, budgetMs: Number.MAX_SAFE_INTEGER, perAuditMs: 0, pauseMs: 2_000 },
    productionDrainDependencies(),
  );

  console.log(
    `Done: ${summary.completed} completed, ${summary.failed} failed, ` +
      `${summary.skipped} already claimed (stopped: ${summary.stoppedBecause}).`,
  );
} catch (error) {
  // The reads have already been retried. What reaches here is a real failure,
  // and the operator needs its cause, not a stack trace.
  console.error(`Drain stopped: ${describeError(error)}`);
  process.exitCode = 1;
}
