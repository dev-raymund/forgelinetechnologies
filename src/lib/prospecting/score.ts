import type {
  AuditFinding,
  AuditScore,
  FindingCategory,
  Opportunity,
  ScoreInput,
} from "./types";

export type {
  AuditFinding,
  FindingCategory,
  FindingSeverity,
  Opportunity,
  ScoreInput,
} from "./types";

const CAPS = {
  websiteUx: 25,
  seo: 20,
  technical: 20,
  conversion: 15,
  businessFit: 10,
  decisionMakerAvailability: 10,
} as const;

const RULE_POINTS: Record<string, number> = {
  "missing-meta-description": 10,
  "duplicate-meta-description": 6,
  "missing-title": 10,
  "duplicate-title": 6,
  "missing-canonical": 5,
  "invalid-canonical": 6,
  "missing-robots": 2,
  "invalid-robots": 4,
  "missing-sitemap": 3,
  "missing-robots-txt": 2,
  "invalid-sitemap": 3,
  "invalid-structured-data": 5,
  "missing-primary-cta": 5,
  "missing-viewport": 8,
  "fixed-width-layout": 8,
  "missing-image-alt": 3,
  "broken-link": 5,
  "http-response-error": 12,
  "redirect-chain-too-long": 6,
  "slow-response": 5,
  "oversized-html": 4,
};

function pointsForFinding(finding: AuditFinding): number {
  const explicit = RULE_POINTS[finding.rule];
  if (explicit !== undefined) return explicit;

  switch (finding.severity) {
    case "high":
      return 8;
    case "medium":
      return 5;
    case "low":
      return 3;
    case "informational":
      return 0;
  }
}

function componentFor(category: FindingCategory): keyof typeof CAPS | null {
  switch (category) {
    case "seo":
    case "metadata":
      return "seo";
    case "accessibility":
    case "mobile":
      return "websiteUx";
    case "conversion":
      return "conversion";
    case "technical":
    case "links":
    case "image":
      return "technical";
  }
}

function classify(score: Omit<AuditScore, "primaryOpportunity">): Opportunity {
  if (score.total < 10) return "Build Audit";
  if (score.seo >= 8 && score.seo >= score.technical && score.seo >= score.websiteUx) {
    return "SEO";
  }
  if (score.technical >= 14 && score.websiteUx >= 8) return "Website Rebuild";
  if (score.websiteUx >= 8 || score.conversion >= 8) return "Website Improvement";
  return "Build Audit";
}

export function scoreReport(input: ScoreInput): AuditScore {
  const scores = {
    websiteUx: 0,
    seo: 0,
    technical: 0,
    conversion: 0,
    businessFit:
      input.businessFit.status === "assessed"
        ? Math.min(CAPS.businessFit, Math.max(0, input.businessFit.points))
        : 0,
    decisionMakerAvailability:
      input.decisionMakerAvailability.status === "assessed"
        ? Math.min(
            CAPS.decisionMakerAvailability,
            Math.max(0, input.decisionMakerAvailability.points),
          )
        : 0,
  };

  for (const finding of input.findings) {
    const component = componentFor(finding.category);
    if (!component) continue;
    scores[component] = Math.min(CAPS[component], scores[component] + pointsForFinding(finding));
  }

  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  const base = { ...scores, total };
  return { ...base, primaryOpportunity: classify(base) };
}
