import assert from "node:assert/strict";
import test from "node:test";
import {
  applyResultSet,
  lifecycleFor,
  recordAuditOutcome,
  type OutcomeDependencies,
} from "../src/lib/prospecting/outcome.ts";

type Write = { prospectId: number; set: Record<string, unknown> };

function deps(overrides: Partial<OutcomeDependencies> = {}) {
  const writes: Write[] = [];
  const refreshed: number[] = [];
  const dependencies: OutcomeDependencies = {
    readSuppression: async () => ({ suppressedAt: null }),
    writeLifecycle: async (prospectId, set) => {
      writes.push({ prospectId, set });
    },
    refreshSnapshot: async (prospectId) => {
      refreshed.push(prospectId);
    },
    ...overrides,
  };
  return { dependencies, writes, refreshed };
}

test("a completed audit marks the prospect audited and links the run", async () => {
  const { dependencies, writes, refreshed } = deps();
  await recordAuditOutcome({ prospectId: 5, auditId: 21, status: "completed" }, dependencies);

  assert.equal(writes.length, 1);
  assert.equal(writes[0]!.prospectId, 5);
  assert.equal(writes[0]!.set.status, "audited");
  assert.equal(writes[0]!.set.lastAuditId, 21);
  assert.deepEqual(refreshed, [5]);
});

test("a failed audit returns the prospect to new so it can be queued again", async () => {
  const { dependencies, writes } = deps();
  await recordAuditOutcome({ prospectId: 5, auditId: 22, status: "failed" }, dependencies);

  assert.equal(writes[0]!.set.status, "new");
  // The failed run is still linked, so its error stays readable.
  assert.equal(writes[0]!.set.lastAuditId, 22);
});

test("a suppressed prospect keeps its status", async () => {
  // Writing `audited` would hide the opt-out from the list, and `new` would
  // hand it straight back to "Queue all new".
  const { dependencies, writes } = deps({
    readSuppression: async () => ({ suppressedAt: new Date("2026-09-18T00:00:00.000Z") }),
  });
  await recordAuditOutcome({ prospectId: 5, auditId: 23, status: "failed" }, dependencies);

  assert.equal("status" in writes[0]!.set, false);
  assert.equal(writes[0]!.set.lastAuditId, 23);
});

test("an audit with no prospect, or a prospect that is gone, writes nothing", async () => {
  const unlinked = deps();
  await recordAuditOutcome({ prospectId: null, auditId: 24, status: "completed" }, unlinked.dependencies);
  assert.deepEqual(unlinked.writes, []);
  assert.deepEqual(unlinked.refreshed, []);

  const missing = deps({ readSuppression: async () => undefined });
  await recordAuditOutcome({ prospectId: 99, auditId: 25, status: "completed" }, missing.dependencies);
  assert.deepEqual(missing.writes, []);
  assert.deepEqual(missing.refreshed, []);
});

test("a failing snapshot refresh does not throw, because the audit is already saved", async () => {
  // The drain re-throws anything `applyResult` raises, which would abandon
  // every remaining candidate in the batch over derived data.
  const { dependencies, writes } = deps({
    refreshSnapshot: async () => {
      throw new Error("fetch failed");
    },
  });

  await assert.doesNotReject(
    recordAuditOutcome({ prospectId: 5, auditId: 26, status: "completed" }, dependencies),
  );
  assert.equal(writes.length, 1, "the lifecycle write still happened");
});

test("a failing lifecycle write does propagate", async () => {
  // That one is not derived data: losing it silently is how a prospect gets
  // stranded mid-pipeline.
  const { dependencies } = deps({
    writeLifecycle: async () => {
      throw new Error("fetch failed");
    },
  });

  await assert.rejects(
    recordAuditOutcome({ prospectId: 5, auditId: 27, status: "completed" }, dependencies),
    /fetch failed/,
  );
});

test("lifecycleFor and applyResultSet stay in step with those rules", () => {
  assert.deepEqual(lifecycleFor("completed", null), { status: "audited" });
  assert.deepEqual(lifecycleFor("partial", null), { status: "audited" });
  assert.deepEqual(lifecycleFor("failed", null), { status: "new" });
  assert.deepEqual(lifecycleFor("completed", new Date()), {});

  const now = new Date("2026-09-20T00:00:00.000Z");
  assert.deepEqual(applyResultSet({ status: "audited" }, 7, now), {
    status: "audited",
    lastAuditId: 7,
    lastAuditedAt: now,
    updatedAt: now,
  });
});
