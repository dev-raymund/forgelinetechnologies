import assert from "node:assert/strict";
import test from "node:test";
import {
  REASON_MAX,
  validateAdjustment,
  validateComponentKey,
  validateDecision,
  validateOverride,
  validateProspectId,
} from "../src/lib/prospecting/review-input.ts";

const reason = "Checked on the live site.";

test("a prospect id must be a positive safe integer", () => {
  assert.deepEqual(validateProspectId(12), { ok: true, value: 12 });
  for (const bad of [0, -1, 1.5, "12", Number.NaN, null]) {
    assert.equal(validateProspectId(bad).ok, false, String(bad));
  }
});

test("a component key must be one of the six", () => {
  assert.deepEqual(validateComponentKey("businessFit"), { ok: true, value: "businessFit" });
  assert.equal(validateComponentKey("total").ok, false);
  assert.equal(validateComponentKey(undefined).ok, false);
});

test("an adjustment within its cap is accepted with a trimmed reason", () => {
  assert.deepEqual(validateAdjustment({ component: "seo", points: 20, reason: `  ${reason}  ` }), {
    ok: true,
    value: { component: "seo", points: 20, reason },
  });
  assert.equal(validateAdjustment({ component: "seo", points: 0, reason }).ok, true);
});

test("an adjustment over its cap, negative, fractional or not a number is rejected", () => {
  for (const points of [21, -1, 7.5, "7", Number.NaN, null]) {
    const result = validateAdjustment({ component: "seo", points, reason });
    assert.equal(result.ok, false, String(points));
  }
  assert.deepEqual(validateAdjustment({ component: "seo", points: 21, reason }), {
    ok: false,
    error: "SEO must be a whole number from 0 to 20.",
  });
  assert.equal(validateAdjustment({ component: "conversion", points: 16, reason }).ok, false);
  assert.equal(validateAdjustment({ component: "unknown", points: 1, reason }).ok, false);
});

test("an adjustment needs a reason of at most 300 characters", () => {
  assert.equal(validateAdjustment({ component: "seo", points: 5, reason: "   " }).ok, false);
  assert.equal(validateAdjustment({ component: "seo", points: 5, reason: undefined }).ok, false);
  assert.equal(validateAdjustment({ component: "seo", points: 5, reason: "x".repeat(REASON_MAX) }).ok, true);
  assert.equal(validateAdjustment({ component: "seo", points: 5, reason: "x".repeat(REASON_MAX + 1) }).ok, false);
});

test("an override accepts any known opportunities that are distinct from the primary", () => {
  assert.deepEqual(
    validateOverride({ primary: "Automation", secondary: ["API / Integration", "Custom Software"], reason }),
    { ok: true, value: { primary: "Automation", secondary: ["API / Integration", "Custom Software"], reason } },
  );
  assert.equal(validateOverride({ primary: "Automation", secondary: [], reason }).ok, true);
});

test("an override is rejected for unknown, repeated or missing values", () => {
  const cases = [
    { primary: "Marketing", secondary: [], reason },
    { primary: "SEO", secondary: "Automation", reason },
    { primary: "SEO", secondary: ["Branding"], reason },
    { primary: "SEO", secondary: ["Automation", "Automation"], reason },
    { primary: "SEO", secondary: ["SEO"], reason },
    { primary: "SEO", secondary: [], reason: " " },
    { primary: "SEO", secondary: [], reason: "x".repeat(REASON_MAX + 1) },
  ];
  for (const input of cases) assert.equal(validateOverride(input).ok, false, JSON.stringify(input));
});

test("dismissing needs a reason and qualifying does not", () => {
  assert.equal(validateDecision({ decision: "dismissed", reason: "" }).ok, false);
  assert.deepEqual(validateDecision({ decision: "dismissed", reason: " Not a fit. " }), {
    ok: true,
    value: { decision: "dismissed", reason: "Not a fit." },
  });
  assert.deepEqual(validateDecision({ decision: "qualified", reason: "" }), {
    ok: true,
    value: { decision: "qualified", reason: "" },
  });
});

test("a decision reason over 300 characters or an unknown decision is rejected", () => {
  const long = "x".repeat(REASON_MAX + 1);
  assert.equal(validateDecision({ decision: "qualified", reason: long }).ok, false);
  assert.equal(validateDecision({ decision: "dismissed", reason: long }).ok, false);
  assert.equal(validateDecision({ decision: "", reason }).ok, false);
  assert.equal(validateDecision({ decision: "suppressed", reason }).ok, false);
});
