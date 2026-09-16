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
