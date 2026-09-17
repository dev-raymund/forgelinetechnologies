/**
 * Recomputes every prospect's list snapshot from its latest usable audit,
 * its own fields and its reviewer inputs.
 *
 *   npm run prospecting:requalify
 *
 * Run it once after applying migration 0003, and again after any change to
 * the qualification rules. The list sorts on the stored snapshot, and nothing
 * else rewrites a row that no audit, adjustment or import has touched since.
 */
import { asc } from "drizzle-orm";
import { getDb, prospects } from "../src/db/index.ts";
import { refreshQualificationSnapshot } from "../src/lib/prospecting/qualification.ts";
import { describeError, withRetry } from "../src/lib/retry.ts";

try {
  const rows = await withRetry(() =>
    getDb().select({ id: prospects.id }).from(prospects).orderBy(asc(prospects.id)),
  );
  for (const row of rows) await refreshQualificationSnapshot(row.id);
  console.log(`Requalified ${rows.length} ${rows.length === 1 ? "prospect" : "prospects"}.`);
} catch (error) {
  console.error(`Requalify stopped: ${describeError(error)}`);
  process.exitCode = 1;
}
