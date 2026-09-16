import type { AuditJobResult } from "./runner.ts";

export type ClaimedAudit = { requestedUrl: string; prospectId: number | null };

export type DrainDependencies = {
  /**
   * Oldest-first ids of audits waiting to run: those still at `queued`, plus
   * any stranded at `running` for long enough that the worker holding them
   * must have died.
   */
  listQueuedAuditIds: (limit: number) => Promise<number[]>;
  /**
   * Attempts the compare-and-swap claim. `null` means another worker won it;
   * a throw means the claim itself failed and the drain must not continue as
   * though the audit were merely skipped.
   */
  claimAudit: (id: number) => Promise<ClaimedAudit | null>;
  runAudit: (input: { auditId: number; requestedUrl: string }) => Promise<AuditJobResult>;
  applyResult: (input: {
    prospectId: number | null;
    auditId: number;
    result: AuditJobResult;
  }) => Promise<void>;
  now: () => number;
  delay: (ms: number) => Promise<void>;
};

export type DrainOptions = {
  limit: number;
  budgetMs: number;
  /** Reserved for one more audit before the budget is called spent. */
  perAuditMs?: number;
  /** Politeness pause between audits. */
  pauseMs?: number;
};

export type DrainSummary = {
  claimed: number;
  completed: number;
  failed: number;
  skipped: number;
  stoppedBecause: "empty" | "limit" | "budget";
};

const DEFAULT_PER_AUDIT_MS = 35_000;

/**
 * Claims queued audits and runs them one at a time.
 *
 * The claim is the compare-and-swap already in `transitionAudit`: it updates
 * only where the status is still the one it read, so two drains racing for the
 * same audit produce exactly one winner. That is why this function needs no
 * lock of its own.
 */
export async function drainAuditQueue(
  options: DrainOptions,
  dependencies: DrainDependencies,
): Promise<DrainSummary> {
  const perAuditMs = options.perAuditMs ?? DEFAULT_PER_AUDIT_MS;
  const started = dependencies.now();
  const summary: DrainSummary = {
    claimed: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
    stoppedBecause: "empty",
  };

  const candidates = await dependencies.listQueuedAuditIds(options.limit);
  let run = 0;

  for (const auditId of candidates) {
    if (run >= options.limit) {
      summary.stoppedBecause = "limit";
      return summary;
    }
    if (dependencies.now() - started + perAuditMs > options.budgetMs) {
      summary.stoppedBecause = "budget";
      return summary;
    }

    const claimed = await dependencies.claimAudit(auditId);
    if (!claimed) {
      summary.skipped += 1;
      continue;
    }
    summary.claimed += 1;

    const result = await dependencies.runAudit({
      auditId,
      requestedUrl: claimed.requestedUrl,
    });
    if (result.status === "failed") summary.failed += 1;
    else summary.completed += 1;

    await dependencies.applyResult({ prospectId: claimed.prospectId, auditId, result });
    run += 1;

    if (options.pauseMs) await dependencies.delay(options.pauseMs);
  }

  summary.stoppedBecause = run >= options.limit && candidates.length >= options.limit ? "limit" : "empty";
  return summary;
}
