/**
 * What a finished audit does to its prospect.
 *
 * Exactly two things: it records which audit ran, and when. It does not touch
 * `status`, and it does not compute anything.
 *
 * It deliberately does not touch `status`. That column is the person's own
 * pipeline judgement, so a background job finishing must never move it —
 * an audit completing should not drag a prospect back out of `Proposal`.
 */
import { eq } from "drizzle-orm";
import { getDb, prospects } from "../../db/index.ts";
import { withRetry } from "../retry.ts";
import type { AuditJobResult } from "./runner.ts";

export type OutcomeDependencies = {
  /** `undefined` when the prospect no longer exists. */
  readProspect: (prospectId: number) => Promise<{ id: number } | undefined>;
  writeAuditLink: (prospectId: number, set: Record<string, unknown>) => Promise<void>;
};

/**
 * Pure: the columns a finished audit writes to its prospect.
 *
 * The audit links and nothing else. `tests/prospecting-reviewer-state.test.ts`
 * renders this through drizzle's own compiler to keep it that way.
 */
export function applyResultSet(auditId: number, now: Date = new Date()) {
  return { lastAuditId: auditId, lastAuditedAt: now, updatedAt: now };
}

export function productionOutcomeDependencies(): OutcomeDependencies {
  return {
    readProspect: async (prospectId) => {
      const [row] = await withRetry(() =>
        getDb().select({ id: prospects.id }).from(prospects).where(eq(prospects.id, prospectId)).limit(1),
      );
      return row;
    },

    writeAuditLink: async (prospectId, set) => {
      await getDb().update(prospects).set(set).where(eq(prospects.id, prospectId));
    },
  };
}

/**
 * Records a finished audit against its prospect.
 *
 * `status` is deliberately absent from everything below. Where the prospect
 * sits in the pipeline is a person's decision, and no background job gets to
 * change it.
 */
export async function recordAuditOutcome(
  input: { prospectId: number | null; auditId: number; status: AuditJobResult["status"] },
  dependencies: OutcomeDependencies = productionOutcomeDependencies(),
): Promise<void> {
  const { prospectId, auditId } = input;
  if (prospectId === null) return;

  const prospect = await dependencies.readProspect(prospectId);
  if (!prospect) return;

  await dependencies.writeAuditLink(prospectId, applyResultSet(auditId));
}
