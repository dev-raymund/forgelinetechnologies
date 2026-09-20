/**
 * What a finished audit does to its prospect.
 *
 * Both paths that run an audit end here: the drain's `applyResult`, and the
 * inline `runAuditInBackground` behind the "Request audit" and "Re-run"
 * buttons. They used to differ — the inline path wrote nothing to the
 * prospect, so a re-run left it at `queued` with `last_audit_id` pointing at
 * the superseded run, where "Queue all new" (which accepts only `new`) could
 * never pick it up again.
 */
import { eq } from "drizzle-orm";
import { getDb, prospects } from "../../db/index.ts";
import { withRetry } from "../retry.ts";
import { refreshQualificationSnapshot } from "./qualification.ts";
import type { AuditJobResult } from "./runner.ts";

export type OutcomeDependencies = {
  /** `undefined` when the prospect no longer exists. */
  readSuppression: (prospectId: number) => Promise<{ suppressedAt: Date | null } | undefined>;
  writeLifecycle: (prospectId: number, set: Record<string, unknown>) => Promise<void>;
  refreshSnapshot: (prospectId: number) => Promise<void>;
};

/**
 * Pure: the columns a finished audit writes to its prospect. It names the
 * lifecycle and the audit links, and never a column the reviewer owns —
 * `tests/prospecting-reviewer-state.test.ts` renders this through drizzle's
 * own compiler to keep it that way.
 */
export function applyResultSet(
  lifecycle: Record<string, unknown>,
  auditId: number,
  now: Date = new Date(),
) {
  return {
    ...lifecycle,
    lastAuditId: auditId,
    lastAuditedAt: now,
    updatedAt: now,
  };
}

/**
 * Pure: the status a finished audit leaves behind.
 *
 * A failed audit returns the prospect to `new` so it can be queued again,
 * while still pointing at the failed run so the error stays readable.
 *
 * A suppressed prospect keeps its status, so this returns no status at all.
 * Writing `audited` would hide the opt-out from the list, and writing `new`
 * after a failure would hand the prospect straight back to "Queue all new"
 * and have it audited again, forever.
 */
export function lifecycleFor(
  status: AuditJobResult["status"],
  suppressedAt: Date | null,
): Record<string, unknown> {
  if (suppressedAt !== null) return {};
  return { status: status === "failed" ? "new" : "audited" };
}

export function productionOutcomeDependencies(): OutcomeDependencies {
  return {
    readSuppression: async (prospectId) => {
      const [row] = await withRetry(() =>
        getDb()
          .select({ suppressedAt: prospects.suppressedAt })
          .from(prospects)
          .where(eq(prospects.id, prospectId))
          .limit(1),
      );
      return row;
    },

    writeLifecycle: async (prospectId, set) => {
      await getDb().update(prospects).set(set).where(eq(prospects.id, prospectId));
    },

    refreshSnapshot: (prospectId) => withRetry(() => refreshQualificationSnapshot(prospectId)),
  };
}

/**
 * Records a finished audit against its prospect: the lifecycle, the audit
 * links, and the list's score snapshot.
 *
 * The snapshot is recomputed rather than copied from the result. After a
 * failed run an earlier completed audit is still the evidence, and business
 * fit, contact and any reviewer adjustment belong in the total too.
 *
 * A snapshot failure is logged, not thrown. The audit is already saved and
 * the lifecycle is already written, so raising here would abort a drain's
 * remaining candidates over derived data that `prospecting:requalify`
 * rebuilds.
 */
export async function recordAuditOutcome(
  input: { prospectId: number | null; auditId: number; status: AuditJobResult["status"] },
  dependencies: OutcomeDependencies = productionOutcomeDependencies(),
): Promise<void> {
  const { prospectId, auditId, status } = input;
  if (prospectId === null) return;

  const prospect = await dependencies.readSuppression(prospectId);
  if (!prospect) return;

  await dependencies.writeLifecycle(
    prospectId,
    applyResultSet(lifecycleFor(status, prospect.suppressedAt), auditId),
  );

  try {
    await dependencies.refreshSnapshot(prospectId);
  } catch (error) {
    console.error("[prospecting] snapshot refresh after audit failed", prospectId, error);
  }
}
