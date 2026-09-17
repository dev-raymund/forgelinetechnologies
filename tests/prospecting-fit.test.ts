import assert from "node:assert/strict";
import test from "node:test";
import {
  REVIEWER_ONLY_ROLE,
  normalizeIndustry,
  scoreBusinessFit,
  scoreContact,
  targetIndustry,
} from "../src/lib/prospecting/fit.ts";

// Copied from the spec rather than imported, so a silent edit to the table in
// code fails here.
const SYNONYMS: [string, string[]][] = [
  ["Accounting", ["accounting", "accountant", "accountants", "accountancy", "bookkeeping", "tax accounting"]],
  ["Real estate", ["real estate", "property", "property management", "realty", "estate agents", "real estate agency"]],
  ["Recruitment", ["recruitment", "recruiting", "recruitment agency", "staffing", "employment agency"]],
  ["Consulting", ["consulting", "consultancy", "management consulting"]],
  ["Professional services", ["professional services"]],
  ["Construction", ["construction", "builders", "building contractors", "civil construction"]],
  ["Healthcare", ["healthcare", "health care", "medical", "medical practice", "dental", "allied health"]],
  ["Education", ["education", "training", "tutoring", "schools", "higher education"]],
];

test("every target market scores 5 and names the market", () => {
  const markets: [string, string][] = [
    ["AU", "Australia"],
    ["GB", "United Kingdom"],
    ["UK", "United Kingdom"],
    ["US", "United States"],
    ["CA", "Canada"],
  ];
  for (const [code, name] of markets) {
    const result = scoreBusinessFit({ country: code, industry: "" });
    assert.equal(result.points, 5, code);
    assert.equal(result.evidence[0], `${code} — target market (${name})`);
  }
});

test("a non-target or missing country scores 0 and says why", () => {
  assert.deepEqual(scoreBusinessFit({ country: "FR", industry: "" }).evidence[0], "FR — not a target market");
  assert.equal(scoreBusinessFit({ country: "FR", industry: "" }).points, 0);
  assert.deepEqual(scoreBusinessFit({ country: "", industry: "" }).evidence[0], "no country recorded");
  assert.equal(scoreBusinessFit({ country: "", industry: "" }).points, 0);
});

test("every canonical industry and every synonym matches", () => {
  for (const [canonical, synonyms] of SYNONYMS) {
    assert.equal(targetIndustry(canonical), canonical, canonical);
    for (const synonym of synonyms) assert.equal(targetIndustry(synonym), canonical, synonym);
  }
});

test("case, whitespace and punctuation do not stop a match", () => {
  assert.equal(normalizeIndustry("  ACCOUNTANTS. "), "accountants");
  assert.equal(targetIndustry("  ACCOUNTANTS. "), "Accounting");
  assert.equal(targetIndustry("Real   Estate"), "Real estate");
  assert.equal(targetIndustry("Health-care"), "Healthcare");
  assert.equal(targetIndustry("Property Management!"), "Real estate");
  assert.equal(targetIndustry("Building   Contractors,"), "Construction");
});

test("near-misses never match: there is no substring or keyword matching", () => {
  for (const industry of [
    "Rebuild Church Ministries",
    "Accounting software",
    "Construction supplies",
    "Bookkeeping & tax",
    "",
  ]) {
    assert.equal(targetIndustry(industry), null, industry);
  }
});

test("industry evidence quotes what was recorded", () => {
  assert.deepEqual(scoreBusinessFit({ country: "AU", industry: "Accountants" }), {
    points: 10,
    evidence: ["AU — target market (Australia)", "'Accountants' → Accounting"],
  });
  assert.equal(
    scoreBusinessFit({ country: "AU", industry: "Bookkeeping & tax" }).evidence[1],
    "'Bookkeeping & tax' — industry not recognised",
  );
  assert.equal(scoreBusinessFit({ country: "AU", industry: "" }).evidence[1], "no industry recorded");
});

test("a classified channel with provenance earns 5", () => {
  assert.deepEqual(
    scoreContact({ contactChannel: "info@acme.com.au", contactProvenance: "website footer" }),
    { points: 5, evidence: ["role email info@acme.com.au — website footer", REVIEWER_ONLY_ROLE] },
  );
  assert.equal(
    scoreContact({ contactChannel: "https://acme.com.au/contact", contactProvenance: "site navigation" }).evidence[0],
    "contact page https://acme.com.au/contact — site navigation",
  );
  assert.equal(
    scoreContact({ contactChannel: "+61 7 3000 0000", contactProvenance: "contact page" }).evidence[0],
    "phone +61 7 3000 0000 — contact page",
  );
});

test("a channel without provenance, empty, or no longer classifying earns nothing", () => {
  assert.deepEqual(scoreContact({ contactChannel: "info@acme.com.au", contactProvenance: " " }), {
    points: 0,
    evidence: ["contact channel has no recorded provenance", REVIEWER_ONLY_ROLE],
  });
  assert.deepEqual(scoreContact({ contactChannel: "", contactProvenance: "footer" }), {
    points: 0,
    evidence: ["no public contact channel recorded", REVIEWER_ONLY_ROLE],
  });

  const named = scoreContact({ contactChannel: "jane.smith@acme.com.au", contactProvenance: "footer" });
  assert.equal(named.points, 0);
  assert.match(named.evidence[0]!, /^stored contact no longer qualifies: /);
  // The evidence explains the rule without repeating a named person's address.
  assert.doesNotMatch(named.evidence.join(" "), /jane/i);
});
