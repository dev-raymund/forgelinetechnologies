/**
 * The final prospect schema.
 *
 * Checked against the model the application declares and the migration that
 * produced it, because the suite has no database. The live schema is verified
 * separately when a migration is applied.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getTableColumns } from "drizzle-orm";
import { prospects, prospectAudits, auditFindings } from "../src/db/schema.ts";
import { PROSPECT_STATUSES } from "../src/lib/prospecting/types.ts";

const RETIRED = [
  "totalScore",
  "primaryOpportunity",
  "scoreAdjustments",
  "opportunityOverride",
  "decision",
  "decisionReason",
  "decidedBy",
  "decidedAt",
];

function migration() {
  return readFile(new URL("../drizzle/0005_remove_legacy_prospect_qualification.sql", import.meta.url), "utf8");
}

test("the prospect model carries no retired qualification field", () => {
  const columns = Object.keys(getTableColumns(prospects));
  for (const retired of RETIRED) {
    assert.equal(columns.includes(retired), false, `${retired} is still in the model`);
  }
});

test("the prospect model carries every active field", () => {
  const columns = Object.keys(getTableColumns(prospects));
  for (const active of [
    "id", "companyName", "domain", "websiteUrl", "industry", "country", "location",
    "contactEmail", "contactPhone", "opportunity", "service", "opportunityReason",
    "opportunitySetBy", "status", "suppressedAt", "suppressionReason",
    "lastAuditId", "lastAuditedAt", "createdAt", "updatedAt",
  ]) {
    assert.ok(columns.includes(active), `${active} is missing`);
  }
});

test("status defaults to the first pipeline value, not a retired one", () => {
  assert.equal(getTableColumns(prospects).status.default, "To Contact");
  assert.equal(PROSPECT_STATUSES[0], "To Contact");
});

test("suppression stays its own pair of columns, never folded into status", () => {
  const columns = Object.keys(getTableColumns(prospects));
  assert.ok(columns.includes("suppressedAt"));
  assert.ok(columns.includes("suppressionReason"));
  assert.equal((PROSPECT_STATUSES as readonly string[]).includes("Suppressed"), false);
});

test("the audit tables keep every column the history needs", () => {
  const audit = Object.keys(getTableColumns(prospectAudits));
  for (const column of ["id", "requestedUrl", "finalUrl", "status", "report", "prospectId", "requestedAt"]) {
    assert.ok(audit.includes(column), `prospectAudits.${column} is missing`);
  }
  const findings = Object.keys(getTableColumns(auditFindings));
  for (const column of ["id", "auditId", "category", "rule", "severity", "evidence", "observedAt"]) {
    assert.ok(findings.includes(column), `auditFindings.${column} is missing`);
  }
});

test("0005 drops every retired column and nothing else", async () => {
  const sql = await migration();
  const dropped = [...sql.matchAll(/DROP COLUMN IF EXISTS "(\w+)"/g)].map((m) => m[1]!);
  assert.deepEqual(dropped.sort(), [
    "decided_at", "decided_by", "decision", "decision_reason",
    "opportunity_override", "primary_opportunity", "score_adjustments", "total_score",
  ]);
});

test("0005 sets the status default and drops no table", async () => {
  const sql = await migration();
  assert.match(sql, /ALTER COLUMN "status" SET DEFAULT 'To Contact'/);
  assert.doesNotMatch(sql, /DROP TABLE/i);
  assert.doesNotMatch(sql, /TRUNCATE/i);
  assert.doesNotMatch(sql, /DELETE\s+FROM/i);
});

test("0005 leaves the contact columns that still hold data", async () => {
  const sql = await migration();
  assert.doesNotMatch(sql, /DROP COLUMN IF EXISTS "contact_channel"/);
  assert.doesNotMatch(sql, /DROP COLUMN IF EXISTS "contact_provenance"/);
});

test("no comment in 0005 carries a semicolon, which splits naive appliers", async () => {
  const sql = await migration();
  assert.deepEqual(sql.split("\n").filter((l) => /^\s*--/.test(l) && l.includes(";")), []);
});
