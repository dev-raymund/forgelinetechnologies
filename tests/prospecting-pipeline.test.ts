/**
 * The simplified prospect pipeline (Phase 6).
 *
 * Pure units: the validators that guard every write, the service mapping the
 * store exposes, and the query shape the list depends on. The action layer is
 * covered where it is pure; its database calls are exercised against the real
 * schema by the migration test alongside this one.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateCompanyName,
  validateContactEmail,
  validateContactPhone,
  validateCountry,
  validateDomain,
  validateOpportunity,
  validateProspectId,
  validateService,
  validateStatus,
  validateText,
} from "../src/lib/prospecting/prospect-input.ts";
import { serviceForOpportunity } from "../src/lib/prospecting/prospect-store.ts";
import {
  OPPORTUNITY_VALUES,
  PROSPECT_STATUSES,
  type Opportunity,
  type ProspectStatus,
} from "../src/lib/prospecting/types.ts";
import { generateOutreach } from "../src/lib/prospecting/outreach.ts";

const RETIRED = ["new", "queued", "audited", "qualified", "dismissed", "suppressed"];

/* ------------------------------------------------------------- status */

test("every status in the vocabulary is accepted", () => {
  for (const status of PROSPECT_STATUSES) {
    const result = validateStatus(status);
    assert.equal(result.ok, true, status);
  }
});

test("the retired status vocabulary is rejected", () => {
  for (const status of RETIRED) {
    assert.equal(validateStatus(status).ok, false, `${status} must not be writable`);
  }
});

test("a status must be a string from the list, not an object or a number", () => {
  for (const bad of [null, undefined, 42, {}, [], "", "Won "]) {
    assert.equal(validateStatus(bad).ok, false, JSON.stringify(bad));
  }
});

test("no retired value hides inside the active vocabulary", () => {
  for (const retired of RETIRED) {
    assert.equal((PROSPECT_STATUSES as readonly string[]).includes(retired), false, retired);
  }
});

/* -------------------------------------------------------- opportunity */

test("every opportunity is accepted, including the human-only three", () => {
  for (const opportunity of OPPORTUNITY_VALUES) {
    assert.equal(validateOpportunity(opportunity).ok, true, opportunity);
  }
});

test("Automation, Web Application and Integration can be chosen by a person", () => {
  for (const manual of ["Automation", "Web Application", "Integration"] as const) {
    const result = validateOpportunity(manual);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.value, manual);
  }
});

test("a retired opportunity from the old model is rejected", () => {
  for (const legacy of ["Build Audit", "Website Improvement", "Website Rebuild", "Custom Software"]) {
    assert.equal(validateOpportunity(legacy).ok, false, legacy);
  }
});

/* ------------------------------------------------------------ service */

test("the service mapping is unchanged from Phase 3", () => {
  assert.equal(serviceForOpportunity("SEO"), "SEO");
  assert.equal(serviceForOpportunity("Website Development"), "Business websites");
  assert.equal(serviceForOpportunity("E-commerce"), "E-commerce");
  assert.equal(serviceForOpportunity("No Clear Opportunity"), "");
  assert.equal(serviceForOpportunity("Needs Manual Review"), "");
});

test("no service is accepted, because some opportunities imply none", () => {
  assert.deepEqual(validateService(""), { ok: true, value: "" });
  assert.deepEqual(validateService(null), { ok: true, value: "" });
});

test("a service outside the studio's vocabulary is refused", () => {
  for (const invented of ["Web Development", "Digital marketing", "Consulting", "SEO services"]) {
    assert.equal(validateService(invented).ok, false, invented);
  }
});

test("every real service name is accepted", () => {
  for (const service of ["SEO", "Business websites", "E-commerce", "Business automation", "API integrations"]) {
    assert.equal(validateService(service).ok, true, service);
  }
});

/* ------------------------------------------------------------- domain */

test("the same business typed three ways resolves to one domain", () => {
  const forms = ["example.com", "www.example.com", "https://example.com/", "https://www.example.com/about?x=1"];
  const domains = forms.map((f) => {
    const result = validateDomain(f);
    return result.ok ? result.value : `INVALID:${f}`;
  });
  assert.deepEqual(new Set(domains), new Set(["example.com"]), JSON.stringify(domains));
});

test("something that is not a website address is refused", () => {
  for (const bad of ["", "   ", "not a url", "javascript:alert(1)", "localhost", 42, null]) {
    assert.equal(validateDomain(bad).ok, false, JSON.stringify(bad));
  }
});

/* ------------------------------------------------------------ contact */

test("a role address is accepted and normalised", () => {
  const result = validateContactEmail("  INFO@Acme.com.au ");
  assert.deepEqual(result, { ok: true, value: "info@acme.com.au" });
});

test("a named individual's address is refused, as Phase 1 decided", () => {
  const result = validateContactEmail("jane.smith@acme.com.au");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /named-individual/i);
});

test("no contact email is a valid prospect", () => {
  assert.deepEqual(validateContactEmail(""), { ok: true, value: "" });
  assert.deepEqual(validateContactPhone(""), { ok: true, value: "" });
});

test("a phone number is accepted and a non-number is not", () => {
  assert.equal(validateContactPhone("+61 7 3000 0000").ok, true);
  assert.equal(validateContactPhone("call us maybe").ok, false);
});

/* --------------------------------------------------------- other input */

test("a company name is required and bounded", () => {
  assert.equal(validateCompanyName("").ok, false);
  assert.equal(validateCompanyName("   ").ok, false);
  assert.equal(validateCompanyName("x".repeat(201)).ok, false);
  assert.deepEqual(validateCompanyName("  Acme  "), { ok: true, value: "Acme" });
});

test("a country is two upper-case letters, or nothing", () => {
  assert.deepEqual(validateCountry("au"), { ok: true, value: "AU" });
  assert.deepEqual(validateCountry(""), { ok: true, value: "" });
  assert.equal(validateCountry("Australia").ok, false);
});

test("free text is bounded", () => {
  assert.equal(validateText("x".repeat(601), 600, "the reason").ok, false);
  assert.equal(validateText("fine", 600, "the reason").ok, true);
});

test("a prospect id must be a positive safe integer", () => {
  for (const bad of [0, -1, 1.5, "3", null, undefined, Number.MAX_SAFE_INTEGER + 2]) {
    assert.equal(validateProspectId(bad).ok, false, JSON.stringify(bad));
  }
  assert.deepEqual(validateProspectId(7), { ok: true, value: 7 });
});

/* ----------------------------------------------- outreach from a prospect */

test("a stored prospect's fields feed the Phase 5 generator unchanged", () => {
  const result = generateOutreach({
    companyName: "Acme Plumbing",
    websiteUrl: "https://acme.example/",
    contactEmail: "info@acme.example",
    contactPhone: "",
    opportunity: {
      opportunity: "SEO" satisfies Opportunity,
      service: "SEO",
      evidence: ["No meta description detected.", "No H1 detected."],
    },
  });

  assert.equal(result.kind, "draft");
  if (result.kind !== "draft") throw new Error("unreachable");
  assert.match(result.draft.subject, /Acme Plumbing/);
  assert.match(result.draft.body, /no meta description/i);
});

test("generating from a prospect neither sends nor stores anything", () => {
  // The generator is pure: its only outputs are a subject and a body.
  const result = generateOutreach({
    companyName: "Acme",
    websiteUrl: "https://acme.example/",
    opportunity: { opportunity: "SEO", service: "SEO", evidence: ["No H1 detected."] },
  });
  if (result.kind !== "draft") throw new Error("unreachable");
  assert.deepEqual(Object.keys(result.draft).sort(), ["body", "subject"]);
});

/* ------------------------------------------------------- the list shape */

test("the pipeline's starting status is the first of the vocabulary", () => {
  const first: ProspectStatus = "To Contact";
  assert.equal(PROSPECT_STATUSES[0], first);
});
