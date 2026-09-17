import assert from "node:assert/strict";
import test from "node:test";
import { buildUpsertValues, qualificationInputsChanged } from "../src/lib/prospecting/prospects.ts";

const source = {
  name: "csv",
  url: "prospects-au.csv",
  importedAt: "2026-09-16T00:00:00.000Z",
  importedBy: 4,
};

const row = {
  companyName: "Acme",
  domain: "acme.com",
  websiteUrl: "https://acme.com/",
  industry: "Accounting",
  country: "AU",
  location: "Brisbane",
  contactChannel: "info@acme.com",
  contactProvenance: "website footer",
};

test("buildUpsertValues carries every parsed field and stamps provenance", () => {
  const [value] = buildUpsertValues([row], source, 4);
  assert.equal(value!.domain, "acme.com");
  assert.equal(value!.companyName, "Acme");
  assert.equal(value!.contactProvenance, "website footer");
  assert.equal(value!.createdBy, 4);
  assert.deepEqual(value!.sources, [source]);
});

test("buildUpsertValues never sets lifecycle or suppression fields", () => {
  const [value] = buildUpsertValues([row], source, 4);
  assert.equal(value!.status, undefined);
  assert.equal(value!.suppressedAt, undefined);
  assert.equal(value!.lastAuditId, undefined);
  assert.equal(value!.decision, undefined);
  assert.equal(value!.scoreAdjustments, undefined);
});

test("a new prospect's list snapshot is its business fit and contact score", () => {
  // AU (5) + Accounting (5) + a role email with provenance (5). No audit yet,
  // so no opportunity.
  const [value] = buildUpsertValues([row], source, 4);
  assert.equal(value!.totalScore, 15);
  assert.equal(value!.primaryOpportunity, "");
});

test("only a change to what fit or contact is scored from counts as a qualification change", () => {
  const before = {
    country: "AU",
    industry: "Accounting",
    contactChannel: "info@acme.com",
    contactProvenance: "website footer",
  };
  const renamed = { ...row, companyName: "Acme Pty Ltd", location: "Sydney" };
  assert.equal(qualificationInputsChanged(before, row), false);
  assert.equal(qualificationInputsChanged(before, renamed), false);
  assert.equal(qualificationInputsChanged(before, { ...row, country: "NZ" }), true);
  assert.equal(qualificationInputsChanged(before, { ...row, industry: "Consulting" }), true);
  assert.equal(qualificationInputsChanged(before, { ...row, contactChannel: "hello@acme.com" }), true);
  assert.equal(qualificationInputsChanged(before, { ...row, contactProvenance: "contact page" }), true);
});
