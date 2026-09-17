import assert from "node:assert/strict";
import test from "node:test";
import {
  BANDS,
  bandFor,
  qualificationSnapshot,
  qualifyProspect,
  type QualifyInput,
} from "../src/lib/prospecting/qualify.ts";
import { scoreReport } from "../src/lib/prospecting/score.ts";
import type {
  AuditFinding,
  ComponentKey,
  FindingCategory,
  FindingComponentKey,
  FindingSeverity,
  ScoreAdjustment,
  ScoreAdjustments,
} from "../src/lib/prospecting/types.ts";

const blank = { country: "", industry: "", contactChannel: "", contactProvenance: "" };
const wellMatched = {
  country: "AU",
  industry: "Accountants",
  contactChannel: "info@acme.com.au",
  contactProvenance: "website footer",
};

function finding(rule: string, category: FindingCategory, severity: FindingSeverity): AuditFinding {
  return {
    id: rule,
    category,
    rule,
    severity,
    pageUrl: "https://acme.com.au/",
    evidence: {},
    recommendation: "Review this observed signal.",
    confidence: "high",
    observedAt: "2026-09-17T00:00:00.000Z",
  };
}

function audit(id: number, extra: Partial<NonNullable<QualifyInput["audit"]>> = {}) {
  return { id, findings: [], technologyIndicators: [], ...extra };
}

function adjustment(points: number, auditId: number | null): ScoreAdjustment {
  return {
    points,
    reason: "Reviewed against the evidence.",
    byUserId: 1,
    byEmail: "reviewer@example.com",
    at: "2026-09-17T00:00:00.000Z",
    auditId,
  };
}

function qualify(overrides: Partial<QualifyInput> = {}) {
  return qualifyProspect({ audit: null, prospect: blank, adjustments: {}, opportunityOverride: null, ...overrides });
}

function component(q: ReturnType<typeof qualify>, key: ComponentKey) {
  return q.components.find((c) => c.key === key)!;
}

/** Effective finding-based points set exactly, via adjustments pinned to audit 1. */
function withPoints(
  points: Partial<Record<FindingComponentKey, number>>,
  technologyIndicators: NonNullable<QualifyInput["audit"]>["technologyIndicators"] = [],
) {
  const adjustments: ScoreAdjustments = {};
  for (const key of Object.keys(points) as FindingComponentKey[]) {
    adjustments[key] = adjustment(points[key] ?? 0, 1);
  }
  return qualify({ audit: audit(1, { technologyIndicators }), adjustments });
}

test("with no usable audit, the website components are 0 and fit and contact still score", () => {
  const q = qualify({ prospect: wellMatched });

  for (const key of ["websiteUx", "seo", "technical", "conversion"] as const) {
    assert.equal(component(q, key).automatic, 0);
    assert.deepEqual(component(q, key).evidence, ["no completed audit yet"]);
  }
  assert.equal(component(q, "businessFit").effective, 10);
  assert.equal(component(q, "decisionMakerAvailability").effective, 5);
  assert.equal(q.effectiveTotal, 15);
  assert.equal(q.auditId, null);
  assert.equal(q.automaticOpportunities.primary, null);
  assert.deepEqual(q.automaticOpportunities.secondary, []);
  assert.deepEqual(qualificationSnapshot(q), { totalScore: 15, primaryOpportunity: "" });
});

test("finding components match scoreReport and show the rules behind them", () => {
  const findings = [
    finding("missing-meta-description", "seo", "medium"),
    finding("missing-title", "metadata", "high"),
    finding("missing-canonical", "seo", "low"),
    finding("missing-viewport", "mobile", "high"),
    finding("broken-link", "links", "medium"),
    finding("broken-link", "links", "medium"),
    finding("missing-primary-cta", "conversion", "low"),
    finding("noindex-hint", "technical", "informational"),
  ];
  const q = qualify({ audit: audit(7, { findings }) });
  const expected = scoreReport({
    findings,
    businessFit: { status: "not_assessed", points: 0 },
    decisionMakerAvailability: { status: "not_assessed", points: 0 },
  });

  for (const key of ["websiteUx", "seo", "technical", "conversion"] as const) {
    assert.equal(component(q, key).automatic, expected[key], key);
  }
  assert.deepEqual(component(q, "seo").evidence, [
    "missing-meta-description (+10)",
    "missing-title (+10)",
    "missing-canonical (+5)",
    "capped at 20 from 25",
  ]);
  assert.deepEqual(component(q, "technical").evidence, ["broken-link ×2 (+10)"]);
  assert.deepEqual(component(q, "conversion").evidence, ["missing-primary-cta (+5)"]);
  assert.equal(q.auditId, 7);
  assert.equal(q.automaticOpportunities.primary, "SEO");
  assert.deepEqual(q.automaticOpportunities.secondary, [
    { opportunity: "Website Improvement", evidence: "Website / UX 8/25" },
  ]);
});

test("an audit with no findings in a category says so", () => {
  assert.deepEqual(component(qualify({ audit: audit(3) }), "seo").evidence, ["no findings in this category"]);
});

test("a finding-based adjustment applies to its own audit and goes stale after a newer one", () => {
  const adjustments = { seo: adjustment(12, 14) };

  const current = component(qualify({ audit: audit(14), adjustments }), "seo");
  assert.equal(current.effective, 12);
  assert.equal(current.adjustmentApplies, true);

  const stale = component(qualify({ audit: audit(19), adjustments }), "seo");
  assert.equal(stale.automatic, 0);
  assert.equal(stale.effective, 0);
  assert.equal(stale.adjustmentApplies, false);
  assert.deepEqual(stale.adjustment, adjustments.seo);

  assert.equal(component(qualify({ audit: null, adjustments }), "seo").adjustmentApplies, false);
});

test("fit and contact adjustments persist across audits", () => {
  const adjustments = {
    businessFit: adjustment(10, null),
    decisionMakerAvailability: adjustment(10, null),
  };
  for (const current of [null, audit(14), audit(19)]) {
    const q = qualify({ audit: current, prospect: wellMatched, adjustments });
    assert.equal(component(q, "businessFit").automatic, 10);
    assert.equal(component(q, "decisionMakerAvailability").automatic, 5);
    assert.equal(component(q, "decisionMakerAvailability").effective, 10);
    assert.equal(q.automaticTotal, 15);
    assert.equal(q.effectiveTotal, 20);
  }
});

test("a stored adjustment outside its cap is clamped", () => {
  const q = qualify({ adjustments: { businessFit: adjustment(15, null) } });
  assert.equal(component(q, "businessFit").effective, 10);
});

test("a well-matched business with a sound website stays at Build Audit", () => {
  const q = qualify({ audit: audit(1), prospect: wellMatched });
  assert.equal(q.effectiveTotal, 15);
  assert.equal(q.automaticOpportunities.primary, "Build Audit");
  assert.deepEqual(q.automaticOpportunities.secondary, []);
  assert.equal(q.band.key, "insufficient");
});

function secondaries(q: ReturnType<typeof qualify>) {
  return q.automaticOpportunities.secondary.map((s) => s.opportunity);
}

test("SEO becomes secondary at 8 and not at 7", () => {
  const at = withPoints({ seo: 8, technical: 14, websiteUx: 8 });
  assert.equal(at.automaticOpportunities.primary, "Website Rebuild");
  assert.deepEqual(secondaries(at), ["SEO", "Website Improvement"]);

  const below = withPoints({ seo: 7, technical: 14, websiteUx: 8 });
  assert.equal(below.automaticOpportunities.primary, "Website Rebuild");
  assert.deepEqual(secondaries(below), ["Website Improvement"]);
});

test("Website Rebuild becomes secondary at technical 14 and not at 13", () => {
  const at = withPoints({ seo: 20, technical: 14, websiteUx: 8 });
  assert.equal(at.automaticOpportunities.primary, "SEO");
  assert.deepEqual(secondaries(at), ["Website Rebuild", "Website Improvement"]);
  assert.equal(at.automaticOpportunities.secondary[0]!.evidence, "Technical 14/20, Website / UX 8/25");

  assert.deepEqual(secondaries(withPoints({ seo: 20, technical: 13, websiteUx: 8 })), ["Website Improvement"]);
});

test("Website Improvement becomes secondary at UX 8 or conversion 8, and not at 7", () => {
  assert.deepEqual(secondaries(withPoints({ seo: 20, websiteUx: 8 })), ["Website Improvement"]);
  assert.deepEqual(secondaries(withPoints({ seo: 20, websiteUx: 7 })), []);

  const conversion = withPoints({ seo: 20, conversion: 8 });
  assert.deepEqual(conversion.automaticOpportunities.secondary, [
    { opportunity: "Website Improvement", evidence: "Conversion 8/15" },
  ]);
  assert.deepEqual(secondaries(withPoints({ seo: 20, conversion: 7 })), []);
});

test("below 10 finding points there is no prescription, but an observed platform still shows", () => {
  const thin = withPoints({ seo: 8, technical: 1 });
  assert.equal(thin.automaticOpportunities.primary, "Build Audit");
  assert.deepEqual(secondaries(thin), []);

  const shop = withPoints({ seo: 8, technical: 1 }, [
    { name: "WooCommerce", signal: "asset-path:/wp-content/plugins/woocommerce/", confidence: "high" },
  ]);
  assert.deepEqual(shop.automaticOpportunities.secondary, [
    { opportunity: "E-commerce", evidence: "WooCommerce detected (asset-path:/wp-content/plugins/woocommerce/)" },
  ]);

  assert.equal(withPoints({ seo: 8, technical: 2 }).automaticOpportunities.primary, "SEO");
});

test("E-commerce comes from Shopify as well as WooCommerce", () => {
  const q = withPoints({}, [{ name: "Shopify", signal: "generator:Shopify", confidence: "high" }]);
  assert.deepEqual(q.automaticOpportunities.secondary, [
    { opportunity: "E-commerce", evidence: "Shopify detected (generator:Shopify)" },
  ]);
});

test("the primary is never repeated as a secondary", () => {
  const q = withPoints({ seo: 20 });
  assert.equal(q.automaticOpportunities.primary, "SEO");
  assert.deepEqual(secondaries(q), []);
});

test("an override replaces the effective opportunities and leaves the automatic ones visible", () => {
  const q = qualify({
    audit: audit(1),
    adjustments: { seo: adjustment(20, 1) },
    opportunityOverride: {
      primary: "Automation",
      secondary: ["API / Integration"],
      reason: "Owner described a manual quoting process on the About page.",
      byUserId: 1,
      byEmail: "reviewer@example.com",
      at: "2026-09-17T00:00:00.000Z",
    },
  });

  assert.deepEqual(q.effectiveOpportunities, {
    primary: "Automation",
    secondary: ["API / Integration"],
    overridden: true,
  });
  assert.equal(q.automaticOpportunities.primary, "SEO");
  assert.deepEqual(qualificationSnapshot(q), { totalScore: 20, primaryOpportunity: "Automation" });
});

test("bands follow the effective total at every boundary", () => {
  const cases: [number, string][] = [
    [0, "insufficient"],
    [24, "insufficient"],
    [25, "limited"],
    [49, "limited"],
    [50, "judgment"],
    [74, "judgment"],
    [75, "strong"],
    [100, "strong"],
  ];
  for (const [total, key] of cases) assert.equal(bandFor(total).key, key, String(total));

  assert.deepEqual(
    BANDS.map((band) => band.action),
    [
      "Human review before any draft is created.",
      "Review the evidence and improve or dismiss the audit.",
      "Keep only if useful for future research; do not prioritize outreach.",
      "Do not create outreach.",
    ],
  );
  assert.equal(withPoints({ seo: 20, technical: 5 }).band.key, "limited");
});

test("a snapshot carries only the two list columns", () => {
  assert.deepEqual(Object.keys(qualificationSnapshot(qualify())).sort(), ["primaryOpportunity", "totalScore"]);
});
