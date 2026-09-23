/**
 * What a finished audit writes to its prospect.
 *
 * The central claim: it records which audit ran and nothing else. `status`
 * belongs to the person working the pipeline, and a background job must never
 * move it — the old implementation wrote `audited` there, which would now
 * overwrite a status someone had deliberately set.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { applyResultSet, recordAuditOutcome } from "../src/lib/prospecting/outcome.ts";

function deps(overrides: Record<string, unknown> = {}) {
  const writes: Record<string, unknown>[] = [];
  return {
    writes,
    dependencies: {
      readProspect: async (id: number) => ({ id }),
      writeAuditLink: async (_id: number, set: Record<string, unknown>) => {
        writes.push(set);
      },
      ...overrides,
    },
  };
}

test("a finished audit records the audit link and the time", async () => {
  const { writes, dependencies } = deps();
  await recordAuditOutcome({ prospectId: 5, auditId: 42, status: "completed" }, dependencies);

  assert.equal(writes.length, 1);
  assert.equal(writes[0]!.lastAuditId, 42);
  assert.ok(writes[0]!.lastAuditedAt instanceof Date);
});

test("it never writes status, in any outcome", async () => {
  for (const status of ["completed", "partial", "failed"] as const) {
    const { writes, dependencies } = deps();
    await recordAuditOutcome({ prospectId: 5, auditId: 1, status }, dependencies);
    assert.equal("status" in writes[0]!, false, `${status} wrote a status`);
  }
});

test("the written set contains only the audit links and updatedAt", () => {
  assert.deepEqual(Object.keys(applyResultSet(7)).sort(), ["lastAuditId", "lastAuditedAt", "updatedAt"]);
});

test("no retired vocabulary can appear in what is written", async () => {
  const { writes, dependencies } = deps();
  await recordAuditOutcome({ prospectId: 5, auditId: 1, status: "failed" }, dependencies);
  const rendered = JSON.stringify(writes[0]);
  for (const retired of ["new", "queued", "audited", "qualified", "dismissed"]) {
    assert.doesNotMatch(rendered, new RegExp(`"${retired}"`), retired);
  }
});

test("an audit with no prospect writes nothing at all", async () => {
  const { writes, dependencies } = deps();
  await recordAuditOutcome({ prospectId: null, auditId: 1, status: "completed" }, dependencies);
  assert.deepEqual(writes, []);
});

test("a prospect that no longer exists writes nothing", async () => {
  const { writes, dependencies } = deps({ readProspect: async () => undefined });
  await recordAuditOutcome({ prospectId: 99, auditId: 1, status: "completed" }, dependencies);
  assert.deepEqual(writes, []);
});
