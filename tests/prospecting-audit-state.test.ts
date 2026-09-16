import { test } from "node:test";
import assert from "node:assert/strict";
import { canTransitionAudit } from "../src/lib/prospecting/audit.ts";

test("audit state transitions allow only forward terminal outcomes", () => {
  assert.equal(canTransitionAudit("queued", "running"), true);
  assert.equal(canTransitionAudit("running", "completed"), true);
  assert.equal(canTransitionAudit("running", "partial"), true);
  assert.equal(canTransitionAudit("running", "failed"), true);
  assert.equal(canTransitionAudit("queued", "completed"), false);
  assert.equal(canTransitionAudit("completed", "running"), false);
  assert.equal(canTransitionAudit("failed", "queued"), false);
});
