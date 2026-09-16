import assert from "node:assert/strict";
import test from "node:test";
import { isLostClaim } from "../src/lib/prospecting/queue.ts";

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
