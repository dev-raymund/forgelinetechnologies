import assert from "node:assert/strict";
import test from "node:test";
import { drainAuditQueue } from "../src/lib/prospecting/drain.ts";
import type { AuditJobResult } from "../src/lib/prospecting/runner.ts";

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

test("the limit caps how many audits one drain runs", async () => {
  const ran: number[] = [];
  const summary = await drainAuditQueue(
    { limit: 2, budgetMs: 1_000_000 },
    deps({ runAudit: async (input: { auditId: number }) => { ran.push(input.auditId); return ok; } }),
  );
  assert.deepEqual(ran, [1, 2]);
  assert.equal(summary.stoppedBecause, "limit");
});
