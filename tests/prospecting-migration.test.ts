import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getTableColumns } from "drizzle-orm";
import { prospects } from "../src/db/schema.ts";

function migration() {
  return readFile(new URL("../drizzle/0003_prospect_qualification.sql", import.meta.url), "utf8");
}

test("migration 0003 adds every qualification column the schema declares, idempotently", async () => {
  const sql = await migration();
  const columns = getTableColumns(prospects);

  for (const key of [
    "scoreAdjustments",
    "opportunityOverride",
    "decision",
    "decisionReason",
    "decidedBy",
    "decidedAt",
  ] as const) {
    assert.match(sql, new RegExp(`ADD COLUMN IF NOT EXISTS "${columns[key].name}"`), key);
  }
  assert.match(sql, /CREATE INDEX IF NOT EXISTS "prospects_decision_idx" ON "prospects" \("decision"\)/);
  assert.match(sql, /"prospects_decided_by_fk"[\s\S]*REFERENCES "users"\("id"\) ON DELETE SET NULL/);
});

test("migration 0003 is additive and leaves existing rows valid", async () => {
  const sql = await migration();
  assert.doesNotMatch(sql, /\bDROP\b/i);
  assert.doesNotMatch(sql, /\bALTER COLUMN\b/i);
  assert.doesNotMatch(sql, /\bRENAME\b/i);
  assert.doesNotMatch(sql, /\bTRUNCATE\b/i);
  assert.doesNotMatch(sql, /\bDELETE\s+FROM\b/i);
  assert.doesNotMatch(sql, /^\s*UPDATE\b/im);
  // Every added NOT NULL column carries a default, so existing rows stay valid.
  for (const line of sql.split("\n").filter((l) => /ADD COLUMN/.test(l) && /NOT NULL/.test(l))) {
    assert.match(line, /DEFAULT/, line);
  }
});
