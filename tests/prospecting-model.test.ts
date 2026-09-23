/**
 * The simplified prospect model introduced in Phase 1.
 *
 * These assertions are the contract the later phases build on: the eight
 * opportunities, which of them a deterministic rule may ever recommend, the
 * nine outreach statuses, and the opportunity -> service map. They are written
 * against the exported values rather than restating them, except where a
 * literal list is the point — the partition test below must fail if someone
 * quietly moves Automation into the automatic set.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTOMATIC_OPPORTUNITIES,
  MANUAL_ONLY_OPPORTUNITIES,
  OPPORTUNITY_VALUES,
  PROSPECT_STATUSES,
  SERVICE_FOR_OPPORTUNITY,
  TERMINAL_OPPORTUNITIES,
} from "../src/lib/prospecting/types.ts";
import {
  TARGET_MARKETS,
  normalizeIndustry,
  targetIndustry,
} from "../src/lib/prospecting/targets.ts";

test("the eight opportunities are exactly the agreed set", () => {
  assert.deepEqual([...OPPORTUNITY_VALUES], [
    "SEO",
    "Website Development",
    "E-commerce",
    "Automation",
    "Web Application",
    "Integration",
    "No Clear Opportunity",
    "Needs Manual Review",
  ]);
});

test("only SEO, Website Development and E-commerce may be recommended automatically", () => {
  assert.deepEqual([...AUTOMATIC_OPPORTUNITIES], ["SEO", "Website Development", "E-commerce"]);
});

test("Automation, Web Application and Integration are human-selected only", () => {
  assert.deepEqual([...MANUAL_ONLY_OPPORTUNITIES], ["Automation", "Web Application", "Integration"]);
});

test("the three groups partition the eight opportunities with no overlap", () => {
  const grouped = [...AUTOMATIC_OPPORTUNITIES, ...MANUAL_ONLY_OPPORTUNITIES, ...TERMINAL_OPPORTUNITIES];
  assert.equal(new Set(grouped).size, grouped.length, "an opportunity appears in two groups");
  assert.deepEqual([...grouped].sort(), [...OPPORTUNITY_VALUES].sort());
});

test("no manual-only opportunity is reachable from the automatic set", () => {
  for (const manual of MANUAL_ONLY_OPPORTUNITIES) {
    assert.ok(
      !(AUTOMATIC_OPPORTUNITIES as readonly string[]).includes(manual),
      `${manual} must never be produced by a deterministic rule`,
    );
  }
});

test("the nine outreach statuses are exactly the agreed lifecycle", () => {
  assert.deepEqual([...PROSPECT_STATUSES], [
    "To Contact",
    "Email Sent",
    "Interested",
    "Audit Requested",
    "Call",
    "Proposal",
    "Won",
    "Lost",
    "Not a Fit",
  ]);
});

test("every status fits the widened varchar(24) column", () => {
  for (const status of PROSPECT_STATUSES) {
    assert.ok(status.length <= 24, `${status} is ${status.length} characters`);
  }
});

test("every opportunity maps to a service, and the two terminal ones map to none", () => {
  for (const opportunity of OPPORTUNITY_VALUES) {
    assert.ok(opportunity in SERVICE_FOR_OPPORTUNITY, `${opportunity} has no service mapping`);
  }
  for (const terminal of TERMINAL_OPPORTUNITIES) {
    assert.equal(SERVICE_FOR_OPPORTUNITY[terminal], "", `${terminal} must recommend no service`);
  }
});

test("each recommendable opportunity maps to a non-empty service", () => {
  for (const opportunity of [...AUTOMATIC_OPPORTUNITIES, ...MANUAL_ONLY_OPPORTUNITIES]) {
    assert.notEqual(SERVICE_FOR_OPPORTUNITY[opportunity], "", opportunity);
  }
});

test("every service fits the varchar(40) column", () => {
  for (const service of Object.values(SERVICE_FOR_OPPORTUNITY)) {
    assert.ok(service.length <= 40, `${service} is ${service.length} characters`);
  }
});

test("every opportunity fits the varchar(32) column", () => {
  for (const opportunity of OPPORTUNITY_VALUES) {
    assert.ok(opportunity.length <= 32, `${opportunity} is ${opportunity.length} characters`);
  }
});

/* --------------------------------------------------------------- targets.ts */

test("the target markets are the four from CLAUDE.md, with UK beside GB", () => {
  assert.deepEqual([...TARGET_MARKETS.keys()].sort(), ["AU", "CA", "GB", "UK", "US"]);
  assert.equal(TARGET_MARKETS.get("UK"), "United Kingdom");
  assert.equal(TARGET_MARKETS.get("GB"), "United Kingdom");
});

test("industry matching survives the extraction unchanged", () => {
  assert.equal(normalizeIndustry("  ACCOUNTANTS. "), "accountants");
  assert.equal(targetIndustry("  ACCOUNTANTS. "), "Accounting");
  assert.equal(targetIndustry("Real   Estate"), "Real estate");
  assert.equal(targetIndustry("Health-care"), "Healthcare");
  assert.equal(targetIndustry("Property Management!"), "Real estate");
});

test("whole-string matching still refuses a partial industry match", () => {
  assert.equal(targetIndustry("Rebuild Church Ministries"), null);
  assert.equal(targetIndustry("Boats"), null);
  assert.equal(targetIndustry("Information Technology"), null);
});
