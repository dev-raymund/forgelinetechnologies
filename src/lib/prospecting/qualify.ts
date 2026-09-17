/**
 * Prospect qualification.
 *
 * Pure: no database and no network. Everything on a prospect's Qualification
 * panel is computed here from three stored inputs: the latest usable audit,
 * the prospect's own fields, and the reviewer's adjustments and override. A
 * change to a rule re-scores every prospect the next time it is read, and
 * every number can be read back against the evidence that produced it.
 */
import type { TechnologyIndicator } from "./analyze.ts";
import { scoreBusinessFit, scoreContact, type RuleScore } from "./fit.ts";
import { CAPS, MIN_FINDING_TOTAL, classify, componentFor, pointsForFinding } from "./score.ts";
import type {
  AuditFinding,
  ComponentKey,
  FindingComponentKey,
  Opportunity,
  OpportunityOverride,
  ScoreAdjustment,
  ScoreAdjustments,
} from "./types.ts";

export type QualifyInput = {
  audit: { id: number; findings: AuditFinding[]; technologyIndicators: TechnologyIndicator[] } | null;
  prospect: { country: string; industry: string; contactChannel: string; contactProvenance: string };
  adjustments: ScoreAdjustments;
  opportunityOverride: OpportunityOverride | null;
};

export type ComponentDefinition = {
  key: ComponentKey;
  label: string;
  cap: number;
  /** Scored from audit findings, so an adjustment to it is pinned to one audit. */
  findingBased: boolean;
};

export const COMPONENTS: readonly ComponentDefinition[] = [
  { key: "websiteUx", label: "Website / UX", cap: CAPS.websiteUx, findingBased: true },
  { key: "seo", label: "SEO", cap: CAPS.seo, findingBased: true },
  { key: "technical", label: "Technical", cap: CAPS.technical, findingBased: true },
  { key: "conversion", label: "Conversion", cap: CAPS.conversion, findingBased: true },
  { key: "businessFit", label: "Business fit", cap: CAPS.businessFit, findingBased: false },
  {
    key: "decisionMakerAvailability",
    label: "Decision-maker availability",
    cap: CAPS.decisionMakerAvailability,
    findingBased: false,
  },
];

export type ComponentQualification = ComponentDefinition & {
  automatic: number;
  effective: number;
  /** Why the automatic value is what it is. Never hidden by an adjustment. */
  evidence: string[];
  adjustment: ScoreAdjustment | null;
  /** False with no adjustment, or when a finding-based one judged an older audit. */
  adjustmentApplies: boolean;
};

export type BandKey = "strong" | "judgment" | "limited" | "insufficient";

export type Band = {
  key: BandKey;
  label: string;
  min: number;
  max: number;
  meaning: string;
  action: string;
};

/** Highest first, so the first band whose minimum a total reaches is its band. */
export const BANDS: readonly Band[] = [
  {
    key: "strong",
    label: "Strong",
    min: 75,
    max: 100,
    meaning: "Strong observed opportunity and fit",
    action: "Human review before any draft is created.",
  },
  {
    key: "judgment",
    label: "Needs judgment",
    min: 50,
    max: 74,
    meaning: "Potentially relevant but needs judgment",
    action: "Review the evidence and improve or dismiss the audit.",
  },
  {
    key: "limited",
    label: "Limited",
    min: 25,
    max: 49,
    meaning: "Limited or incomplete evidence",
    action: "Keep only if useful for future research; do not prioritize outreach.",
  },
  {
    key: "insufficient",
    label: "Insufficient",
    min: 0,
    max: 24,
    meaning: "Insufficient evidence or poor fit",
    action: "Do not create outreach.",
  },
];

export type SuggestedOpportunity = { opportunity: Opportunity; evidence: string };

export type Qualification = {
  /** The audit the finding-based components were scored from. */
  auditId: number | null;
  components: ComponentQualification[];
  automaticTotal: number;
  effectiveTotal: number;
  band: Band;
  /**
   * What the rules derive. "Automatic" means rule-made, not unadjusted: the
   * rules read the effective finding-based points, so a reviewer's correction
   * to a component flows into the opportunity it implies.
   */
  automaticOpportunities: { primary: Opportunity | null; secondary: SuggestedOpportunity[] };
  /** The reviewer's override when one is set, otherwise the automatic set. */
  effectiveOpportunities: { primary: Opportunity | null; secondary: Opportunity[]; overridden: boolean };
};

const NO_AUDIT = "no completed audit yet";
const ECOMMERCE_PLATFORMS = new Set(["Shopify", "WooCommerce"]);

export function bandFor(total: number): Band {
  return BANDS.find((band) => total >= band.min) ?? BANDS[BANDS.length - 1]!;
}

function findingScore(audit: NonNullable<QualifyInput["audit"]>, key: FindingComponentKey): RuleScore {
  const rules = new Map<string, { count: number; points: number }>();
  for (const finding of audit.findings) {
    if (componentFor(finding.category) !== key) continue;
    const points = pointsForFinding(finding);
    if (!points) continue;
    const entry = rules.get(finding.rule) ?? { count: 0, points: 0 };
    rules.set(finding.rule, { count: entry.count + 1, points: entry.points + points });
  }

  const evidence = [...rules].map(([rule, { count, points }]) =>
    count === 1 ? `${rule} (+${points})` : `${rule} ×${count} (+${points})`,
  );
  const raw = [...rules.values()].reduce((sum, entry) => sum + entry.points, 0);
  const cap = CAPS[key];
  if (raw > cap) evidence.push(`capped at ${cap} from ${raw}`);

  return {
    points: Math.min(cap, raw),
    evidence: evidence.length ? evidence : ["no findings in this category"],
  };
}

function automaticScore(input: QualifyInput, key: ComponentKey): RuleScore {
  switch (key) {
    case "businessFit":
      return scoreBusinessFit(input.prospect);
    case "decisionMakerAvailability":
      return scoreContact(input.prospect);
    default:
      return input.audit ? findingScore(input.audit, key) : { points: 0, evidence: [NO_AUDIT] };
  }
}

/**
 * Business fit and contact are facts about the business, so their
 * adjustments outlive a re-audit. A finding-based adjustment judged one
 * audit's findings and stops applying once a newer audit replaces them.
 */
function adjustmentApplies(
  definition: ComponentDefinition,
  adjustment: ScoreAdjustment,
  auditId: number | null,
): boolean {
  if (typeof adjustment.points !== "number" || !Number.isFinite(adjustment.points)) return false;
  return !definition.findingBased || (auditId !== null && adjustment.auditId === auditId);
}

function suggestOpportunities(
  audit: QualifyInput["audit"],
  points: Record<ComponentKey, number>,
): Qualification["automaticOpportunities"] {
  // Opportunities describe what the website needs, which business fit and
  // contact say nothing about. With no usable audit there is nothing to
  // describe at all.
  if (!audit) return { primary: null, secondary: [] };

  const { websiteUx, seo, technical, conversion } = points;
  const total = websiteUx + seo + technical + conversion;
  const primary = classify({ websiteUx, seo, technical, conversion, total });
  const suggestions: SuggestedOpportunity[] = [];

  // Explicit thresholds rather than "the primary's rule also holds": the SEO
  // rule in `classify` requires SEO to outscore technical and UX, which would
  // make it the primary, so reusing it would mean SEO could never be secondary.
  if (total >= MIN_FINDING_TOTAL) {
    if (seo >= 8) suggestions.push({ opportunity: "SEO", evidence: `SEO ${seo}/${CAPS.seo}` });
    if (technical >= 14 && websiteUx >= 8) {
      suggestions.push({
        opportunity: "Website Rebuild",
        evidence: `Technical ${technical}/${CAPS.technical}, Website / UX ${websiteUx}/${CAPS.websiteUx}`,
      });
    }
    const improvement = [
      websiteUx >= 8 ? `Website / UX ${websiteUx}/${CAPS.websiteUx}` : null,
      conversion >= 8 ? `Conversion ${conversion}/${CAPS.conversion}` : null,
    ].filter((line): line is string => line !== null);
    if (improvement.length) {
      suggestions.push({ opportunity: "Website Improvement", evidence: improvement.join(", ") });
    }
  }

  // An observed platform rather than a scoring inference, so it needs no gate.
  const platform = audit.technologyIndicators.find((indicator) => ECOMMERCE_PLATFORMS.has(indicator.name));
  if (platform) {
    suggestions.push({ opportunity: "E-commerce", evidence: `${platform.name} detected (${platform.signal})` });
  }

  return { primary, secondary: suggestions.filter((s) => s.opportunity !== primary) };
}

export function qualifyProspect(input: QualifyInput): Qualification {
  const auditId = input.audit?.id ?? null;

  const components = COMPONENTS.map((definition): ComponentQualification => {
    const automatic = automaticScore(input, definition.key);
    const adjustment = input.adjustments[definition.key] ?? null;
    const applies = adjustment !== null && adjustmentApplies(definition, adjustment, auditId);
    return {
      ...definition,
      automatic: automatic.points,
      effective:
        adjustment && applies
          ? Math.min(definition.cap, Math.max(0, Math.round(adjustment.points)))
          : automatic.points,
      evidence: automatic.evidence,
      adjustment,
      adjustmentApplies: applies,
    };
  });

  const points = Object.fromEntries(components.map((c) => [c.key, c.effective])) as Record<ComponentKey, number>;
  const automaticTotal = components.reduce((sum, c) => sum + c.automatic, 0);
  const effectiveTotal = components.reduce((sum, c) => sum + c.effective, 0);
  const automaticOpportunities = suggestOpportunities(input.audit, points);
  const override = input.opportunityOverride;

  return {
    auditId,
    components,
    automaticTotal,
    effectiveTotal,
    band: bandFor(effectiveTotal),
    automaticOpportunities,
    effectiveOpportunities: override
      ? {
          primary: override.primary,
          secondary: override.secondary.filter((o) => o !== override.primary),
          overridden: true,
        }
      : {
          primary: automaticOpportunities.primary,
          secondary: automaticOpportunities.secondary.map((s) => s.opportunity),
          overridden: false,
        },
  };
}

/**
 * The list's two sort and filter columns, and only those. A snapshot write
 * must never touch status, suppression or the decision.
 */
export function qualificationSnapshot(q: Qualification): { totalScore: number; primaryOpportunity: string } {
  return { totalScore: q.effectiveTotal, primaryOpportunity: q.effectiveOpportunities.primary ?? "" };
}
