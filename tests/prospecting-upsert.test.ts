import assert from "node:assert/strict";
import test from "node:test";
import { buildUpsertValues } from "../src/lib/prospecting/prospects.ts";

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

test("buildUpsertValues never sets lifecycle or score fields", () => {
  const [value] = buildUpsertValues([row], source, 4);
  assert.equal(value!.status, undefined);
  assert.equal(value!.totalScore, undefined);
  assert.equal(value!.suppressedAt, undefined);
  assert.equal(value!.lastAuditId, undefined);
});
