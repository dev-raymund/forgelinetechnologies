import { and, asc, eq, inArray, isNull } from "drizzle-orm";
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

export function productionDrainDependencies(): DrainDependencies {
  return {
    listQueuedAuditIds: async (limit) => {
      const rows = await getDb()
        .select({ id: prospectAudits.id })
        .from(prospectAudits)
        .where(eq(prospectAudits.status, "queued"))
        .orderBy(asc(prospectAudits.id))
        .limit(limit);
      return rows.map((row) => row.id);
    },

    claimAudit: async (id) => {
      const [row] = await getDb()
        .select({ requestedUrl: prospectAudits.requestedUrl, prospectId: prospectAudits.prospectId })
        .from(prospectAudits)
        .where(eq(prospectAudits.id, id))
        .limit(1);
      if (!row) return null;
      try {
        // Compare-and-swap. A throw means another worker claimed it first.
        await saveAuditRunning(id);
      } catch {
        return null;
      }
      return { requestedUrl: row.requestedUrl, prospectId: row.prospectId };
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
