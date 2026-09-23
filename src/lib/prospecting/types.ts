/* ===========================================================================
 * The prospect model
 *
 * One opportunity, one service, one reason, one status. That is the whole
 * model: a website is scanned, one opportunity is detected or chosen, and a
 * person moves the prospect through the pipeline.
 * ======================================================================== */

/**
 * The one opportunity a prospect is carried forward on.
 *
 * `No Clear Opportunity` and `Needs Manual Review` are outcomes rather than
 * recommendations: the first means the scan ran and found nothing worth
 * raising, the second that the scan could not be completed and a person should
 * look themselves.
 */
export type Opportunity =
  | "SEO"
  | "Website Development"
  | "E-commerce"
  | "Automation"
  | "Web Application"
  | "Integration"
  | "No Clear Opportunity"
  | "Needs Manual Review";

/** Every opportunity, in the order the admin lists them. */
export const OPPORTUNITY_VALUES: readonly Opportunity[] = [
  "SEO",
  "Website Development",
  "E-commerce",
  "Automation",
  "Web Application",
  "Integration",
  "No Clear Opportunity",
  "Needs Manual Review",
];

/**
 * The only opportunities a deterministic rule may ever recommend.
 *
 * Each one has defensible evidence available from a single bounded homepage
 * fetch: SEO from missing metadata, Website Development from a missing
 * viewport or absent HTTPS, E-commerce from an observed platform. Phase 3's
 * rules must not return anything outside this list.
 */
export const AUTOMATIC_OPPORTUNITIES: readonly Opportunity[] = [
  "SEO",
  "Website Development",
  "E-commerce",
];

/**
 * Human-selected only, and deliberately unreachable by any rule.
 *
 * A homepage fetch cannot evidence that a business has a manual process worth
 * automating, a system worth integrating, or a need for custom software.
 * Inventing a signal to reach these would be exactly the claim inflation
 * CLAUDE.md forbids, so a person chooses them or nothing does.
 */
export const MANUAL_ONLY_OPPORTUNITIES: readonly Opportunity[] = [
  "Automation",
  "Web Application",
  "Integration",
];

/** Scan outcomes rather than recommendations. Neither implies a service. */
export const TERMINAL_OPPORTUNITIES: readonly Opportunity[] = [
  "No Clear Opportunity",
  "Needs Manual Review",
];

/** The nine states a prospect moves through, from first contact to closed. */
export type ProspectStatus =
  | "To Contact"
  | "Email Sent"
  | "Interested"
  | "Audit Requested"
  | "Call"
  | "Proposal"
  | "Won"
  | "Lost"
  | "Not a Fit";

/** In lifecycle order. The longest is "Audit Requested" at 15 characters. */
export const PROSPECT_STATUSES: readonly ProspectStatus[] = [
  "To Contact",
  "Email Sent",
  "Interested",
  "Audit Requested",
  "Call",
  "Proposal",
  "Won",
  "Lost",
  "Not a Fit",
];

/**
 * The single ForgeLine service recommended for an opportunity.
 *
 * These names are CLAUDE.md's own service list, with one exception: `SEO` is
 * not among ForgeLine's declared primary services, but it is the service the
 * simplified tool is specified to recommend for an SEO opportunity. See the
 * Phase 1 report — this is a naming question for the studio to settle, not
 * something to resolve by inventing a service.
 */
export type ForgelineService =
  | "SEO"
  | "Business websites"
  | "Custom web applications"
  | "E-commerce"
  | "Business automation"
  | "API integrations"
  | "Website maintenance";

/** `""` where the opportunity is an outcome and recommends nothing. */
export const SERVICE_FOR_OPPORTUNITY: Readonly<Record<Opportunity, ForgelineService | "">> = {
  SEO: "SEO",
  "Website Development": "Business websites",
  "E-commerce": "E-commerce",
  Automation: "Business automation",
  "Web Application": "Custom web applications",
  Integration: "API integrations",
  "No Clear Opportunity": "",
  "Needs Manual Review": "",
};

/* ===========================================================================
 * Scanner types — kept, and unchanged
 * ======================================================================== */

export type AuditStatus = "queued" | "running" | "completed" | "partial" | "failed";

/**
 * How much of the site an audit is allowed to touch.
 *
 * `quick` is one primary page fetch and the deterministic analysis of it, and
 * nothing else — the 2-to-5-minute qualification pass behind "paste a website".
 * `full` adds the existing robots.txt, sitemap.xml and bounded link probes,
 * and is the deeper audit run once a prospect has shown interest.
 *
 * Both modes run the same fetch and the same analysis. The mode decides only
 * which additional requests are made.
 */
export type AuditMode = "quick" | "full";

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
