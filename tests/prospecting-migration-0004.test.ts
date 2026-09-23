/**
 * Migration 0004 — the simplified prospect model.
 *
 * Checked against the schema the application declares, the way 0003's test is,
 * because the suite has no database. The live schema is verified separately
 * when the migration is applied.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getTableColumns } from "drizzle-orm";
import { prospects } from "../src/db/schema.ts";
import { PROSPECT_STATUSES } from "../src/lib/prospecting/types.ts";

function migration() {
  return readFile(new URL("../drizzle/0004_simplify_prospects.sql", import.meta.url), "utf8");
}

test("0004 adds every simplified column the schema declares, idempotently", async () => {
  const sql = await migration();
  const columns = getTableColumns(prospects);

  for (const key of [
    "opportunity",
    "service",
    "opportunityReason",
    "opportunitySetBy",
    "contactEmail",
    "contactPhone",
  ] as const) {
    assert.match(sql, new RegExp(`ADD COLUMN IF NOT EXISTS "${columns[key].name}"`), key);
  }
  assert.match(sql, /"prospects_opportunity_set_by_fk"[\s\S]*REFERENCES "users"\("id"\) ON DELETE SET NULL/);
});

test("0004 destroys nothing", async () => {
  const sql = await migration();
  assert.doesNotMatch(sql, /\bDROP\b/i);
  assert.doesNotMatch(sql, /\bTRUNCATE\b/i);
  assert.doesNotMatch(sql, /\bDELETE\s+FROM\b/i);
  assert.doesNotMatch(sql, /\bRENAME\b/i);
});

test("the only column altered is status, and only to widen it", async () => {
  const sql = await migration();
  const alters = sql.split("\n").filter((line) => /ALTER COLUMN/i.test(line));
  assert.equal(alters.length, 1, alters.join(" | "));
  assert.match(alters[0]!, /ALTER COLUMN "status" TYPE varchar\(24\)/);
});

test("every added NOT NULL column carries a default, so existing rows stay valid", async () => {
  const sql = await migration();
  for (const line of sql.split("\n").filter((l) => /ADD COLUMN/.test(l) && /NOT NULL/.test(l))) {
    assert.match(line, /DEFAULT/, line);
  }
});

test("the widened status column fits every value in the vocabulary", async () => {
  for (const status of PROSPECT_STATUSES) {
    assert.ok(status.length <= 24, `${status} is ${status.length} characters`);
  }
});

/**
 * The correction made before this migration was applied. An earlier draft
 * translated the retired classifications across — 'Website Improvement' became
 * 'Website Development' and so on — which would have presented a score from
 * the deleted 100-point model as a current conclusion.
 */
test("0004 never backfills opportunity from the retired classification", async () => {
  const sql = await migration();
  assert.doesNotMatch(sql, /SET\s+"opportunity"\s*=/i);
  for (const retired of ["Website Improvement", "Website Rebuild", "Build Audit", "Custom Software"]) {
    assert.ok(!new RegExp(`THEN\\s*'${retired}'`).test(sql), retired);
  }
});

test("the retired status values appear only as things being migrated away from", async () => {
  const sql = await migration();
  const statusUpdate = sql.match(/UPDATE "prospects"\s*\n\s*SET "status"[\s\S]*?;/);
  assert.ok(statusUpdate, "the status backfill exists");
  // They are matched in the WHERE, and the value written is a current one.
  assert.match(statusUpdate[0], /SET "status" = 'To Contact'/);
  assert.match(statusUpdate[0], /WHERE "status" IN \('new', 'queued', 'audited', 'suppressed'\)/);
});

test("the migration carries a role email across but never a contact page URL", async () => {
  const sql = await migration();
  const emailUpdate = sql.match(/UPDATE "prospects"\s*\n\s*SET "contact_email"[\s\S]*?;/);
  assert.ok(emailUpdate, "the contact backfill exists");
  assert.match(emailUpdate[0], /LIKE '%@%'/);
  assert.match(emailUpdate[0], /NOT LIKE 'http%'/);
});

test("no comment in the file carries a semicolon, which splits naive appliers", async () => {
  const sql = await migration();
  const offenders = sql.split("\n").filter((line) => /^\s*--/.test(line) && line.includes(";"));
  assert.deepEqual(offenders, []);
});
