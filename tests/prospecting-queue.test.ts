import assert from "node:assert/strict";
import test from "node:test";
import {
  enqueueProspects,
  isLostClaim,
  type EnqueueDependencies,
} from "../src/lib/prospecting/queue.ts";

/**
 * The two strings below are the ones `transitionAudit` actually throws, kept
 * here verbatim so this test fails if that wording ever drifts away from what
 * `claimAudit` matches on.
 */
test("a lost compare-and-swap and an illegal transition both read as a lost claim", () => {
  assert.equal(isLostClaim(new Error("Audit 12 was changed by another worker.")), true);
  assert.equal(isLostClaim(new Error("Audit 12 cannot transition to running.")), true);
});

test("a real failure is not mistaken for a lost claim", () => {
  assert.equal(isLostClaim(new Error("fetch failed")), false);
  assert.equal(isLostClaim(new Error("Error connecting to database: TypeError: fetch failed")), false);
  assert.equal(isLostClaim(new Error("DATABASE_URL is not set.")), false);
  assert.equal(isLostClaim("was changed by another worker"), false);
  assert.equal(isLostClaim(undefined), false);
});

type AuditRow = { requestedUrl: string; requestedBy: number; prospectId: number };

/**
 * Two queueable prospects, and an injected seam per statement so the ordering
 * between them can be asserted without a database.
 */
function enqueueDeps(overrides: Partial<EnqueueDependencies> = {}): EnqueueDependencies {
  return {
    selectQueueable: async () => [
      { id: 1, websiteUrl: "https://one.example/" },
      { id: 2, websiteUrl: "https://two.example/" },
    ],
    markQueued: async (ids) => ids,
    insertAudits: async () => undefined,
    ...overrides,
  };
}

test("the status update is written before any audit row", async () => {
  const calls: string[] = [];
  const queued = await enqueueProspects(
    [1, 2],
    7,
    enqueueDeps({
      markQueued: async (ids) => {
        calls.push("update");
        return ids;
      },
      insertAudits: async () => {
        calls.push("insert");
      },
    }),
  );

  assert.deepEqual(calls, ["update", "insert"]);
  assert.equal(queued, 2);
});

test("a prospect the update did not return gets no audit row", async () => {
  // Prospect 2 was suppressed between the read and the write, so the UPDATE's
  // `suppressed_at IS NULL` guard refused it and it is not in the returned ids.
  // An audit row here is the opt-out breach: the next drain would fetch it.
  const inserted: AuditRow[] = [];
  const queued = await enqueueProspects(
    [1, 2],
    7,
    enqueueDeps({
      markQueued: async () => [1],
      insertAudits: async (rows) => {
        inserted.push(...rows);
      },
    }),
  );

  assert.deepEqual(inserted, [
    { requestedUrl: "https://one.example/", requestedBy: 7, prospectId: 1 },
  ]);
  assert.equal(queued, 1);
});

test("an update that changed nothing writes no audit rows at all", async () => {
  let insertCalls = 0;
  const queued = await enqueueProspects(
    [1, 2],
    7,
    enqueueDeps({
      markQueued: async () => [],
      insertAudits: async () => {
        insertCalls += 1;
      },
    }),
  );

  assert.equal(insertCalls, 0);
  assert.equal(queued, 0);
});

test("nothing is written when no prospect is queueable", async () => {
  const calls: string[] = [];
  const queued = await enqueueProspects(
    [1, 2],
    7,
    enqueueDeps({
      selectQueueable: async () => [],
      markQueued: async (ids) => {
        calls.push("update");
        return ids;
      },
      insertAudits: async () => {
        calls.push("insert");
      },
    }),
  );

  assert.deepEqual(calls, []);
  assert.equal(queued, 0);
});
