/**
 * The branch's central safety claim, in its final form.
 *
 * A pipeline write must not touch state a person owns. Phase 2's worst defect
 * was a background write clobbering a human decision; the column that carries
 * that judgement is now `status`, so this renders the real UPDATE through
 * drizzle's own compiler and asserts the column is absent from it.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { eq } from "drizzle-orm";
import { getDb, prospects } from "../src/db/index.ts";
import { applyResultSet } from "../src/lib/prospecting/outcome.ts";

/** The SQL drizzle would actually send for the audit-outcome write. */
function renderedUpdate() {
  process.env.DATABASE_URL ??= "postgres://user:pass@localhost/db";
  return getDb()
    .update(prospects)
    .set(applyResultSet(42, new Date("2026-01-01T00:00:00Z")))
    .where(eq(prospects.id, 5))
    .toSQL().sql;
}

test("the audit-outcome write never sets status", () => {
  assert.doesNotMatch(renderedUpdate(), /"status"\s*=/);
});

test("the audit-outcome write never sets a suppression column", () => {
  const sql = renderedUpdate();
  assert.doesNotMatch(sql, /"suppressed_at"\s*=/);
  assert.doesNotMatch(sql, /"suppression_reason"\s*=/);
});

test("the audit-outcome write never sets the opportunity a person may have chosen", () => {
  const sql = renderedUpdate();
  for (const column of ["opportunity", "service", "opportunity_reason", "opportunity_set_by"]) {
    assert.doesNotMatch(sql, new RegExp(`"${column}"\\s*=`), column);
  }
});

test("it sets exactly the audit links and the timestamp", () => {
  const sql = renderedUpdate();
  assert.match(sql, /"last_audit_id"\s*=/);
  assert.match(sql, /"last_audited_at"\s*=/);
  assert.match(sql, /"updated_at"\s*=/);
});
