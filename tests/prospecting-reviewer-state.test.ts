import assert from "node:assert/strict";
import test from "node:test";
import { getTableColumns, is, SQL, sql, type AnyColumn } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import type { UpdateSet } from "drizzle-orm/utils";
import { prospects } from "../src/db/index.ts";
import { upsertConflictSet } from "../src/lib/prospecting/prospects.ts";
import { applyResultSet } from "../src/lib/prospecting/outcome.ts";

/**
 * The branch's central safety claim: a pipeline write cannot touch reviewer
 * state. Phase 2's worst defect was exactly a pipeline write clobbering a
 * human decision (suppression, then held in `status`). This renders the two
 * real SET clauses through drizzle's own compiler — never a restatement of
 * the SQL by hand — so it fails the moment either statement's `set` object
 * gains one of the reviewer's columns.
 */
const REVIEWER_COLUMNS = [
  "decision",
  "decision_reason",
  "decided_by",
  "decided_at",
  "score_adjustments",
  "opportunity_override",
  "suppressed_at",
  "total_score",
  "primary_opportunity",
];

const columns = getTableColumns(prospects) as Record<string, AnyColumn>;

/**
 * Mirrors drizzle's own (internal, unexported) `mapUpdateSet`: an already-SQL
 * value (e.g. `sql\`excluded.company_name\``) passes through, anything else
 * becomes a bound parameter encoded by its column — exactly what `.set(...)`
 * does before `buildUpdateSet` ever sees the object.
 */
function toUpdateSet(set: Record<string, unknown>): UpdateSet {
  return Object.fromEntries(
    Object.entries(set)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, is(value, SQL) ? value : sql.param(value, columns[key])]),
  );
}

function renderSet(set: Record<string, unknown>) {
  const dialect = new PgDialect();
  return dialect.sqlToQuery(dialect.buildUpdateSet(prospects, toUpdateSet(set)));
}

test("the re-import onConflictDoUpdate SET names none of the reviewer or snapshot columns", () => {
  const { sql } = renderSet(upsertConflictSet(new Date()));
  for (const column of REVIEWER_COLUMNS) {
    assert.doesNotMatch(sql, new RegExp(`"${column}"\\s*=`), `${column} must not be in the SET: ${sql}`);
  }
  // Sanity: the helper actually renders something, and it does update the
  // columns a re-import legitimately owns.
  assert.match(sql, /"company_name"\s*=/);
  assert.match(sql, /"updated_at"\s*=/);
});

test("the drain's post-audit prospect UPDATE SET names only lifecycle and audit links", () => {
  for (const lifecycle of [{ status: "audited" }, { status: "new" }, {}]) {
    const { sql } = renderSet(applyResultSet(lifecycle, 42, new Date()));
    for (const column of REVIEWER_COLUMNS) {
      assert.doesNotMatch(sql, new RegExp(`"${column}"\\s*=`), `${column} must not be in the SET: ${sql}`);
    }
    assert.match(sql, /"last_audit_id"\s*=/);
    assert.match(sql, /"last_audited_at"\s*=/);
    assert.match(sql, /"updated_at"\s*=/);
  }
});
