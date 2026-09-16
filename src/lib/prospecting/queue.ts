import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb, prospectAudits, prospects } from "../../db/index.ts";
import { saveAuditRunning } from "./audit.ts";
import { runAuditJob } from "./runner.ts";
import { auditJobDependencies } from "./run.ts";
import type { DrainDependencies } from "./drain.ts";

/** Creates a queued audit row per prospect and moves the prospect to `queued`. */
export async function enqueueProspects(ids: number[], actorId: number): Promise<number> {
  if (ids.length === 0) return 0;

  const targets = await getDb()
    .select({ id: prospects.id, websiteUrl: prospects.websiteUrl })
    .from(prospects)
    .where(and(inArray(prospects.id, ids), eq(prospects.status, "new")));
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
      // A failed audit returns the prospect to `new` so it can be queued again,
      // while still pointing at the failed run so the error is readable.
      // Narrow on `result.status` directly: a separate boolean would not narrow
      // the union and `result.score` would not typecheck.
      const scored =
        result.status === "failed"
          ? { status: "new", totalScore: 0, primaryOpportunity: "" }
          : {
              status: "audited",
              totalScore: result.score.total,
              primaryOpportunity: result.score.primaryOpportunity,
            };

      await getDb()
        .update(prospects)
        .set({
          ...scored,
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
