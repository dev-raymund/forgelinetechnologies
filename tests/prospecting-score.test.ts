import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scoreReport,
  type AuditFinding,
  type FindingCategory,
  type FindingSeverity,
} from "../src/lib/prospecting/score.ts";

function finding(
  rule: string,
  category: FindingCategory,
  severity: FindingSeverity,
  points: number,
): AuditFinding {
  return {
    id: rule,
    category,
    rule,
    severity,
    pageUrl: "https://example.com/",
    evidence: { points },
    recommendation: "Review this observed signal.",
    confidence: "high",
    observedAt: "2026-09-14T00:00:00.000Z",
  };
}

test("scoreReport gives points only to observed findings and leaves unknown fit at zero", () => {
  const result = scoreReport({
    findings: [
      finding("missing-meta-description", "seo", "medium", 10),
      finding("missing-primary-cta", "conversion", "low", 5),
    ],
    businessFit: { status: "not_assessed", points: 0 },
    decisionMakerAvailability: { status: "not_assessed", points: 0 },
  });

  assert.equal(result.seo, 10);
  assert.equal(result.conversion, 5);
  assert.equal(result.businessFit, 0);
  assert.equal(result.decisionMakerAvailability, 0);
  assert.equal(result.total, 15);
});

test("scoreReport caps components and never turns unassessed context into points", () => {
  const result = scoreReport({
    findings: [
      ...Array.from({ length: 4 }, (_, index) => finding(`seo-${index}`, "seo", "high", 10)),
      finding("missing-primary-cta", "conversion", "low", 5),
      finding("missing-viewport", "mobile", "medium", 8),
    ],
    businessFit: { status: "not_assessed", points: 10 },
    decisionMakerAvailability: { status: "not_assessed", points: 10 },
  });

  assert.equal(result.seo, 20);
  assert.equal(result.businessFit, 0);
  assert.equal(result.decisionMakerAvailability, 0);
  assert.equal(result.primaryOpportunity, "SEO");
});

test("scoreReport classifies visible UX and conversion evidence as website improvement", () => {
  const result = scoreReport({
    findings: [
      finding("missing-viewport", "mobile", "medium", 8),
      finding("missing-primary-cta", "conversion", "low", 5),
      finding("form-without-submit-control", "conversion", "low", 5),
    ],
    businessFit: { status: "not_assessed", points: 0 },
    decisionMakerAvailability: { status: "not_assessed", points: 0 },
  });

  assert.equal(result.primaryOpportunity, "Website Improvement");
});

test("scoreReport defaults insufficient evidence to Build Audit", () => {
  const result = scoreReport({
    findings: [finding("robots-present", "metadata", "informational", 0)],
    businessFit: { status: "not_assessed", points: 0 },
    decisionMakerAvailability: { status: "not_assessed", points: 0 },
  });

  assert.equal(result.primaryOpportunity, "Build Audit");
});
