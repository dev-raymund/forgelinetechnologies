export type AuditStatus = "queued" | "running" | "completed" | "partial" | "failed";

export type FindingCategory =
  | "technical"
  | "seo"
  | "accessibility"
  | "mobile"
  | "conversion"
  | "links"
  | "metadata"
  | "image";

export type FindingSeverity = "informational" | "low" | "medium" | "high";

export type Confidence = "low" | "medium" | "high";

export type Opportunity =
  | "Website Improvement"
  | "Website Rebuild"
  | "SEO"
  | "Automation"
  | "E-commerce"
  | "API / Integration"
  | "Custom Software"
  | "Build Audit";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type AuditFinding = {
  id: string;
  category: FindingCategory;
  rule: string;
  severity: FindingSeverity;
  pageUrl: string;
  evidence: Record<string, JsonValue>;
  recommendation: string;
  confidence: Confidence;
  observedAt: string;
};

export type AssessedScore = {
  status: "assessed" | "not_assessed";
  points: number;
};

export type ScoreInput = {
  findings: AuditFinding[];
  businessFit: AssessedScore;
  decisionMakerAvailability: AssessedScore;
};

export type AuditScore = {
  websiteUx: number;
  seo: number;
  technical: number;
  conversion: number;
  businessFit: number;
  decisionMakerAvailability: number;
  total: number;
  primaryOpportunity: Opportunity;
};

/** Every opportunity, in the order the admin lists them. */
export const OPPORTUNITIES: readonly Opportunity[] = [
  "Website Improvement",
  "Website Rebuild",
  "SEO",
  "Automation",
  "E-commerce",
  "API / Integration",
  "Custom Software",
  "Build Audit",
];

export type ComponentKey =
  | "websiteUx"
  | "seo"
  | "technical"
  | "conversion"
  | "businessFit"
  | "decisionMakerAvailability";

/** The four components scored from audit findings. */
export type FindingComponentKey = Exclude<ComponentKey, "businessFit" | "decisionMakerAvailability">;

/** A reviewer's value for one score component, with the reason it was set. */
export type ScoreAdjustment = {
  points: number;
  reason: string;
  byUserId: number;
  byEmail: string;
  /** ISO timestamp. */
  at: string;
  /** The audit a finding-based adjustment judged; null for business fit and contact. */
  auditId: number | null;
};

export type ScoreAdjustments = Partial<Record<ComponentKey, ScoreAdjustment>>;

export type OpportunityOverride = {
  primary: Opportunity;
  /** Distinct, and never the primary. */
  secondary: Opportunity[];
  reason: string;
  byUserId: number;
  byEmail: string;
  at: string;
};

/** `""` is undecided. */
export type ProspectDecision = "" | "qualified" | "dismissed";
