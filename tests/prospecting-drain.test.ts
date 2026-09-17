import assert from "node:assert/strict";
import test from "node:test";
import { drainAuditQueue } from "../src/lib/prospecting/drain.ts";
import type { AuditJobResult } from "../src/lib/prospecting/runner.ts";
import { withRetry } from "../src/lib/retry.ts";

// Cast through `unknown`: this fixture only needs to carry `status` for
// drain.ts's own branching (drain.ts never reads `analysis` or `score`), but
// it must still satisfy `AuditJobResult`'s type under `tsc --noEmit`, and a
// literal this small cannot structurally satisfy `PageAnalysis`/`AuditScore`.
const ok = {
  status: "completed" as const,
  analysis: { findings: [] },
  score: { total: 27 },
} as unknown as AuditJobResult;

function deps(overrides = {}) {
  return {
    listQueuedAuditIds: async () => [1, 2, 3],
    claimAudit: async (id: number) => ({ requestedUrl: `https://e${id}.com/`, prospectId: id }),
    runAudit: async () => ok,
    applyResult: async () => undefined,
    now: () => 0,
    delay: async () => undefined,
    ...overrides,
  };
}

test("a drain claims each queued audit once and reports what it did", async () => {
  const ran: number[] = [];
  const summary = await drainAuditQueue(
    { limit: 10, budgetMs: 1_000_000 },
    deps({ runAudit: async (input: { auditId: number }) => { ran.push(input.auditId); return ok; } }),
  );
  assert.deepEqual(ran, [1, 2, 3]);
  assert.equal(summary.claimed, 3);
  assert.equal(summary.completed, 3);
  assert.equal(summary.stoppedBecause, "empty");
});

test("an audit lost to another worker is skipped, not run twice", async () => {
  const ran: number[] = [];
  const summary = await drainAuditQueue(
    { limit: 10, budgetMs: 1_000_000 },
    deps({
      claimAudit: async (id: number) => (id === 2 ? null : { requestedUrl: "https://e.com/", prospectId: id }),
      runAudit: async (input: { auditId: number }) => { ran.push(input.auditId); return ok; },
    }),
  );
  assert.deepEqual(ran, [1, 3]);
  assert.equal(summary.skipped, 1);
  assert.equal(summary.claimed, 2);
});

test("one failing audit does not stop the batch", async () => {
  const summary = await drainAuditQueue(
    { limit: 10, budgetMs: 1_000_000 },
    deps({
      runAudit: async (input: { auditId: number }) =>
        input.auditId === 2 ? { status: "failed" as const, error: "network unavailable" } : ok,
    }),
  );
  assert.equal(summary.completed, 2);
  assert.equal(summary.failed, 1);
});

test("an audit finished by the worker that re-claimed it is skipped, not fatal", async () => {
  // Stale-claim recovery can leave two workers holding one audit. The revived
  // original finds the row already completed, so `saveResult` refuses the
  // transition and `saveFailure` refuses it again from inside runAuditJob's
  // catch — the second throw escapes. It must cost this one audit, not the
  // batch: every later candidate used to be abandoned with it.
  const ran: number[] = [];
  const applied: number[] = [];
  const summary = await drainAuditQueue(
    { limit: 10, budgetMs: 1_000_000 },
    deps({
      runAudit: async (input: { auditId: number }) => {
        ran.push(input.auditId);
        if (input.auditId === 2) throw new Error("Audit 2 cannot transition to failed.");
        return ok;
      },
      applyResult: async (input: { auditId: number }) => {
        applied.push(input.auditId);
      },
    }),
  );

  assert.deepEqual(ran, [1, 2, 3]);
  assert.deepEqual(applied, [1, 3]);
  assert.equal(summary.skipped, 1);
  assert.equal(summary.completed, 2);
  assert.equal(summary.failed, 0);
});

test("a real failure still stops the drain rather than counting as a skip", async () => {
  // The guard above must stay a lost-claim guard. A blanket catch would turn a
  // database outage into a summary of quiet skips and hide it from the
  // operator, which is the regression this locks out.
  const ran: number[] = [];
  await assert.rejects(
    drainAuditQueue(
      { limit: 10, budgetMs: 1_000_000 },
      deps({
        runAudit: async (input: { auditId: number }) => {
          ran.push(input.auditId);
          if (input.auditId === 2) throw new Error("fetch failed");
          return ok;
        },
      }),
    ),
    /fetch failed/,
  );

  assert.deepEqual(ran, [1, 2]);
});

test("a drain whose applyResult recovers from one transient blip does not lose the remaining candidates", async () => {
  // Models the fix to queue.ts's applyResult: the post-audit snapshot
  // refresh is retried (with the real `withRetry`, exactly as the fix uses
  // it) rather than left to escape and abort the batch after the audit was
  // already saved and counted. A real, non-transient failure still correctly
  // aborts the batch — see "a real failure still stops the drain..." above.
  const applied: number[] = [];
  let refreshAttempts = 0;
  const summary = await drainAuditQueue(
    { limit: 10, budgetMs: 1_000_000 },
    deps({
      applyResult: async (input: { auditId: number }) => {
        if (input.auditId === 2) {
          await withRetry(
            async () => {
              refreshAttempts += 1;
              if (refreshAttempts === 1) throw new Error("fetch failed");
            },
            3,
            async () => undefined,
          );
        }
        applied.push(input.auditId);
      },
    }),
  );

  assert.equal(refreshAttempts, 2);
  assert.deepEqual(applied, [1, 2, 3]);
  assert.equal(summary.claimed, 3);
  assert.equal(summary.completed, 3);
  assert.equal(summary.skipped, 0);
});

test("the drain stops cleanly when the time budget is spent", async () => {
  let clock = 0;
  const ran: number[] = [];
  const summary = await drainAuditQueue(
    { limit: 10, budgetMs: 60_000, perAuditMs: 35_000 },
    deps({
      now: () => clock,
      runAudit: async (input: { auditId: number }) => { ran.push(input.auditId); clock += 30_000; return ok; },
    }),
  );
  assert.deepEqual(ran, [1]);
  assert.equal(summary.stoppedBecause, "budget");
});

test("a skipped audit still reports the limit, not an empty queue", async () => {
  // The queue filled the request (three candidates for a limit of three) but
  // one was claimed elsewhere, so only two ran. Reporting "empty" here would
  // tell the operator the queue was drained while work was still waiting.
  const summary = await drainAuditQueue(
    { limit: 3, budgetMs: 1_000_000 },
    deps({
      claimAudit: async (id: number) =>
        id === 2 ? null : { requestedUrl: "https://e.com/", prospectId: id },
    }),
  );
  assert.equal(summary.claimed, 2);
  assert.equal(summary.skipped, 1);
  assert.equal(summary.stoppedBecause, "limit");
});

test("a queue that runs dry reports an empty queue", async () => {
  const summary = await drainAuditQueue({ limit: 10, budgetMs: 1_000_000 }, deps());
  assert.equal(summary.completed, 3);
  assert.equal(summary.stoppedBecause, "empty");
});

test("the limit caps how many audits one drain runs", async () => {
  const ran: number[] = [];
  const summary = await drainAuditQueue(
    { limit: 2, budgetMs: 1_000_000 },
    deps({ runAudit: async (input: { auditId: number }) => { ran.push(input.auditId); return ok; } }),
  );
  assert.deepEqual(ran, [1, 2]);
  assert.equal(summary.stoppedBecause, "limit");
});
