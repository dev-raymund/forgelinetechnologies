import { and, asc, eq, inArray, isNull, lt, or } from "drizzle-orm";
import { getDb, prospectAudits, prospects } from "../../db/index.ts";
import { saveAuditRunning } from "./audit.ts";
import { runAuditJob } from "./runner.ts";
import { auditJobDependencies } from "./run.ts";
import type { DrainDependencies } from "./drain.ts";

/**
 * Creates a queued audit row per prospect and moves the prospect to `queued`.
 *
 * `suppressed_at IS NULL` is checked alongside the status rather than trusting
 * the status alone: `status` is a display value, `suppressed_at` is the column
 * that carries the opt-out guarantee. A suppressed prospect whose status was
 * left at `new` by some other path must still never be fetched again.
 */
export async function enqueueProspects(ids: number[], actorId: number): Promise<number> {
  if (ids.length === 0) return 0;

  const targets = await getDb()
    .select({ id: prospects.id, websiteUrl: prospects.websiteUrl })
    .from(prospects)
    .where(
      and(
        inArray(prospects.id, ids),
        eq(prospects.status, "new"),
        isNull(prospects.suppressedAt),
      ),
    );
  if (targets.length === 0) return 0;

  await getDb()
    .insert(prospectAudits)
    .values(
      targets.map((target) => ({
        requestedUrl: target.websiteUrl,
        requestedBy: actorId,
        prospectId: target.id,
      })),
    );

  await getDb()
    .update(prospects)
    .set({ status: "queued", updatedAt: new Date() })
    .where(inArray(prospects.id, targets.map((t) => t.id)));

  return targets.length;
}

/**
 * True only for the two ways `transitionAudit` reports that this worker did not
 * get the audit: the compare-and-swap matched no row because another worker
 * moved it first, or the row is no longer at a status this claim can leave.
 *
 * Everything else — a dropped connection, a Neon outage, a query error — is a
 * real failure. Treating those as a lost claim is what made a drain that could
 * not reach the database print "0 completed, 0 failed, 500 already claimed" and
 * read like success.
 */
export function isLostClaim(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("was changed by another worker") ||
    error.message.includes("cannot transition to")
  );
}

/**
 * How long an audit may sit at `running` before it is treated as abandoned.
 *
 * A real audit is bounded to roughly 30 seconds — one homepage, robots.txt,
 * sitemap.xml and at most twelve link probes, each with a ten second timeout —
 * so a row still running fifteen minutes later cannot be making progress. It
 * can only mean the worker died between claiming the audit and recording a
 * result: Ctrl-C on the CLI, or a killed serverless invocation. Without this,
 * the audit stays at `running` and its prospect at `queued` with nothing in
 * the system able to recover either — `listQueuedAuditIds` used to select only
 * `queued`, TRANSITIONS has no running -> queued edge, and `enqueueProspects`
 * accepts only `new`.
 */
const STALE_CLAIM_MS = 15 * 60 * 1000;

export function productionDrainDependencies(): DrainDependencies {
  return {
    listQueuedAuditIds: async (limit) => {
      const rows = await getDb()
        .select({ id: prospectAudits.id })
        .from(prospectAudits)
        .where(
          or(
            eq(prospectAudits.status, "queued"),
            and(
              eq(prospectAudits.status, "running"),
              lt(prospectAudits.startedAt, new Date(Date.now() - STALE_CLAIM_MS)),
            ),
          ),
        )
        .orderBy(asc(prospectAudits.id))
        .limit(limit);
      return rows.map((row) => row.id);
    },

    claimAudit: async (id) => {
      const [row] = await getDb()
        .select({
          requestedUrl: prospectAudits.requestedUrl,
          prospectId: prospectAudits.prospectId,
          status: prospectAudits.status,
          startedAt: prospectAudits.startedAt,
        })
        .from(prospectAudits)
        .where(eq(prospectAudits.id, id))
        .limit(1);
      if (!row) return null;
      const claimed = { requestedUrl: row.requestedUrl, prospectId: row.prospectId };

      if (row.status === "running") {
        // Re-claiming an abandoned run. `saveAuditRunning` refuses
        // running -> running, so this claim is written directly — but it keeps
        // the shape of `transitionAudit`: the UPDATE matches on the startedAt
        // this worker read, so of two drains re-claiming the same stale row
        // exactly one gets a row back and the loser gets none. `started_at` is
        // only ever written from a JS Date, so the stored value keeps
        // millisecond precision and compares equal on the way back in.
        const startedAt = row.startedAt;
        if (!startedAt || Date.now() - startedAt.getTime() < STALE_CLAIM_MS) return null;

        const retaken = await getDb()
          .update(prospectAudits)
          .set({ startedAt: new Date(), updatedAt: new Date() })
          .where(
            and(
              eq(prospectAudits.id, id),
              eq(prospectAudits.status, "running"),
              eq(prospectAudits.startedAt, startedAt),
            ),
          )
          .returning({ id: prospectAudits.id });
        return retaken[0] ? claimed : null;
      }

      try {
        // Compare-and-swap. A lost race means another worker claimed it first.
        await saveAuditRunning(id);
      } catch (error) {
        if (isLostClaim(error)) return null;
        // Anything else is a real failure and must reach the operator rather
        // than be counted as a skip.
        throw error;
      }
      return claimed;
    },

    runAudit: (input) =>
      runAuditJob(input, { ...auditJobDependencies(), markRunning: async () => undefined }),

    applyResult: async ({ prospectId, auditId, result }) => {
      if (prospectId === null) return;

      const [prospect] = await getDb()
        .select({ suppressedAt: prospects.suppressedAt })
        .from(prospects)
        .where(eq(prospects.id, prospectId))
        .limit(1);
      if (!prospect) return;

      // A failed audit returns the prospect to `new` so it can be queued again,
      // while still pointing at the failed run so the error is readable.
      // Narrow on `result.status` directly: a separate boolean would not narrow
      // the union and `result.score` would not typecheck.
      const snapshot =
        result.status === "failed"
          ? { totalScore: 0, primaryOpportunity: "" }
          : {
              totalScore: result.score.total,
              primaryOpportunity: result.score.primaryOpportunity,
            };

      // A suppressed prospect keeps its status. Writing `audited` here would
      // hide the opt-out from the list, and writing `new` after a failure would
      // hand the prospect straight back to "Queue all new" and have it audited
      // again, forever. The audit links are still written so the run that was
      // already in flight stays traceable.
      const lifecycle =
        prospect.suppressedAt === null
          ? { status: result.status === "failed" ? "new" : "audited" }
          : {};

      await getDb()
        .update(prospects)
        .set({
          ...snapshot,
          ...lifecycle,
          lastAuditId: auditId,
          lastAuditedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(prospects.id, prospectId));
    },

    now: () => Date.now(),
    delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  };
}
