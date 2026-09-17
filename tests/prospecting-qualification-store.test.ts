import assert from "node:assert/strict";
import test from "node:test";
import {
  decisionValues,
  storedTechnologyIndicators,
  toObservedFinding,
} from "../src/lib/prospecting/qualification.ts";

test("a stored finding row reads back in the shape the scorer uses", () => {
  const observed = toObservedFinding({
    id: 41,
    auditId: 7,
    category: "seo",
    rule: "missing-title",
    severity: "high",
    pageUrl: "https://acme.com.au/",
    evidence: { selector: "title" },
    recommendation: "Add a descriptive title.",
    confidence: "high",
    observedAt: new Date("2026-09-17T01:02:03.000Z"),
    createdAt: new Date("2026-09-17T01:02:04.000Z"),
  });

  assert.deepEqual(observed, {
    id: "41",
    category: "seo",
    rule: "missing-title",
    severity: "high",
    pageUrl: "https://acme.com.au/",
    evidence: { selector: "title" },
    recommendation: "Add a descriptive title.",
    confidence: "high",
    observedAt: "2026-09-17T01:02:03.000Z",
  });
});

test("only well-formed technology indicators are read from a stored report", () => {
  assert.deepEqual(
    storedTechnologyIndicators({
      technologyIndicators: [
        { name: "Shopify", signal: "generator:Shopify", confidence: "high" },
        { name: "Broken" },
        "WordPress",
        null,
        { name: "WooCommerce", signal: "asset-path:/wp-content/plugins/woocommerce/", confidence: "certain" },
      ],
    }),
    [{ name: "Shopify", signal: "generator:Shopify", confidence: "high" }],
  );
  assert.deepEqual(storedTechnologyIndicators({}), []);
  assert.deepEqual(storedTechnologyIndicators({ technologyIndicators: "Shopify" }), []);
});

test("setting a decision records attribution and clearing resets reason and attribution", () => {
  const at = new Date("2026-09-17T00:00:00.000Z");
  assert.deepEqual(decisionValues({ decision: "dismissed", reason: "Not a fit.", userId: 3 }, at), {
    decision: "dismissed",
    decisionReason: "Not a fit.",
    decidedBy: 3,
    decidedAt: at,
  });
  assert.deepEqual(decisionValues(null, at), {
    decision: "",
    decisionReason: "",
    decidedBy: null,
    decidedAt: null,
  });
});
