/**
 * Deterministic opportunity detection.
 *
 * Answers one question: based only on what the quick scan actually observed,
 * is there one obvious reason to contact this business?
 *
 * An ordered list of rules, first match wins, at most one opportunity and at
 * most one service. There is no score, no band, no component, no weighting and
 * no confidence value. A rule either has the evidence it needs or it does not.
 *
 * Pure: no database, no network, no authentication, no React, no environment
 * variable, no AI. `detectOpportunity(scan)` on a plain object is the whole
 * interface.
 *
 * Three opportunities — Automation, Web Application and Integration — are
 * deliberately unreachable here. A single homepage fetch cannot evidence a
 * manual back-office process or a system worth integrating, so a person
 * chooses those or nobody does.
 */
import { countOf, has, observationFor } from "./findings-summary.ts";
import type { QuickScanResult } from "./quick-scan.ts";
import {
  SERVICE_FOR_OPPORTUNITY,
  type ForgelineService,
  type Opportunity,
} from "./types.ts";

export type OpportunityRuleId =
  | "needs-manual-review"
  | "ecommerce"
  | "seo"
  | "website-development"
  | "no-clear-opportunity";

export type OpportunityResult = {
  opportunity: Opportunity;
  /** `null` for the two outcomes that recommend nothing. */
  service: ForgelineService | null;
  /** One or two sentences, factual, safe to show on the prospect page. */
  reason: string;
  /** The observations the rule fired on. Never anything it did not check. */
  evidence: string[];
  /** Which rule decided, so a result can always be traced back. */
  ruleId: OpportunityRuleId;
};

type OpportunityRule = {
  id: OpportunityRuleId;
  /** `null` when this rule does not apply to the scan. */
  evaluate: (scan: QuickScanResult) => { reason: string; evidence: string[] } | null;
  opportunity: Opportunity;
};

/**
 * The three page-level elements every page is expected to declare. The SEO
 * rule counts how many are absent; see `seoRule` for why two is the threshold.
 *
 * robots.txt and sitemap.xml are deliberately absent from this list. The quick
 * scan never requests them, so their absence is unknown rather than observed.
 */
const CORE_SEO_RULES = ["missing-title", "missing-meta-description", "missing-h1"] as const;

/** Concrete implementation faults, each a deterministic finding or a scan fact. */
const TECHNICAL_RULES = ["missing-viewport", "fixed-width-layout", "redirect-chain-too-long"] as const;

/** Observable obstacles on the path to enquiring or buying. */
const COMMERCE_RULES = [
  "missing-primary-cta",
  "form-without-submit-control",
  "missing-viewport",
  "fixed-width-layout",
] as const;

/** Every line the named rules produced, in the order the lists declare them. */
function evidenceFor(scan: QuickScanResult, rules: readonly string[]): string[] {
  return rules
    .filter((rule) => has(scan, rule))
    .map((rule) => observationFor(rule, scan))
    .filter((line): line is string => line !== null);
}

/** True when the scan is not a shape the rules can safely read. */
function malformed(scan: QuickScanResult): boolean {
  return (
    typeof scan !== "object" ||
    scan === null ||
    !Array.isArray(scan.findings) ||
    typeof scan.page !== "object" ||
    scan.page === null ||
    typeof scan.signals !== "object" ||
    scan.signals === null
  );
}

/**
 * 1. Needs Manual Review — the scan did not establish enough to recommend on.
 *
 * Four conditions, all read from the scanner's own semantics rather than
 * invented here:
 *
 * - `error` is set, which is how `runAuditJob` reports every refusal the
 *   existing engine already makes: a blocked private address, a timeout, an
 *   unsupported content type, an oversized body, a redirect loop.
 * - the page was never reached, so there is no status or final URL.
 * - the homepage answered 4xx or 5xx. The bytes analysed are then an error
 *   page, and its missing title is the error page's, not the business's —
 *   recommending SEO from it would be a recommendation about the wrong page.
 * - the page asks not to be indexed. That is a deliberate choice or a staging
 *   site, and either way an automated SEO recommendation is unsafe.
 *
 * Having few findings is not one of these conditions. A clean site is a clean
 * result, and falls through to No Clear Opportunity.
 */
const manualReviewRule: OpportunityRule = {
  id: "needs-manual-review",
  opportunity: "Needs Manual Review",
  evaluate: (scan) => {
    if (malformed(scan)) {
      return {
        reason: "The scan result is incomplete, so nothing was assessed. Re-run the scan.",
        evidence: ["The scan returned an unreadable result."],
      };
    }
    if (scan.error) {
      return {
        reason: "The website could not be read, so there is nothing to assess yet.",
        evidence: [`The scan did not complete: ${scan.error}`],
      };
    }
    if (scan.httpStatus === null || scan.finalUrl === null) {
      return {
        reason: "The website could not be reached, so there is nothing to assess yet.",
        evidence: ["The homepage was not reached."],
      };
    }
    if (scan.httpStatus >= 400) {
      return {
        reason:
          `The homepage returned HTTP ${scan.httpStatus}, so the page that was read is not the business's homepage. ` +
          "Check the address by hand before drawing anything from this scan.",
        evidence: [observationFor("http-response-error", scan) ?? `The homepage returned HTTP ${scan.httpStatus}.`],
      };
    }
    if (has(scan, "noindex-meta")) {
      return {
        reason:
          "The homepage asks search engines not to index it. That is usually deliberate or a staging site, " +
          "so an automated recommendation would not be safe here.",
        evidence: [observationFor("noindex-meta", scan) ?? "The page declares a noindex robots directive."],
      };
    }
    return null;
  },
};

/**
 * 2. E-commerce — a detected storefront that also shows an observable
 *    obstacle on the buying path.
 *
 * The platform alone is not a reason to contact anyone: running Shopify is a
 * fact about the site, not a problem with it. So this rule needs the platform
 * AND at least one concrete finding — no visible call to action, a form that
 * cannot be submitted, or a layout that does not adapt to a phone. A storefront
 * with none of those falls through, and may well end at No Clear Opportunity.
 *
 * Nothing here claims the store underperforms, loses sales, or has a checkout
 * problem. The quick scan never reaches a checkout, so it cannot say.
 */
const ecommerceRule: OpportunityRule = {
  id: "ecommerce",
  opportunity: "E-commerce",
  evaluate: (scan) => {
    if (!scan.signals.ecommerce) return null;
    const evidence = evidenceFor(scan, COMMERCE_RULES);
    if (evidence.length === 0) return null;

    const platform = scan.technologies.find((name) => name === "Shopify" || name === "WooCommerce");
    return {
      reason:
        `${platform ?? "An online store platform"} was detected, and the homepage shows ` +
        `${evidence.length === 1 ? "an observable obstacle" : "observable obstacles"} on the path to buying or enquiring.`,
      evidence: [
        `Storefront platform detected: ${platform ?? "yes"}.`,
        ...evidence,
      ],
    };
  },
};

/**
 * 3. SEO — two or more of the three core page-level elements are absent.
 *
 * The threshold is two of {title, meta description, H1}, and it is a count of
 * named elements rather than a score: there are no weights, and no other
 * finding can push a site over the line.
 *
 * Why two. Each of the three is something every page is expected to declare,
 * and each is reported by `analyze.ts` at high or medium severity. One missing
 * element is an oversight and not worth an email. Two or more is a pattern
 * that a person can see for themselves in ten seconds, which is exactly the
 * standard for a defensible opening.
 *
 * Deliberately excluded: `missing-canonical`, `missing-structured-data` and
 * `missing-robots` are low or informational and common on perfectly healthy
 * sites. `missing-robots-txt` and `missing-sitemap` are excluded because the
 * quick scan never requests those files — their absence from the findings
 * means "not checked", never "not there".
 */
const seoRule: OpportunityRule = {
  id: "seo",
  opportunity: "SEO",
  evaluate: (scan) => {
    if (countOf(scan, CORE_SEO_RULES) < 2) return null;

    const missing = [
      has(scan, "missing-title") ? "a page title" : null,
      has(scan, "missing-meta-description") ? "a meta description" : null,
      has(scan, "missing-h1") ? "an H1" : null,
    ].filter((item): item is string => item !== null);
    const list =
      missing.length === 2 ? missing.join(" and ") : `${missing.slice(0, -1).join(", ")} and ${missing.at(-1)}`;

    return {
      reason:
        `The homepage is missing ${list}. Those are page-level elements both a visitor and a search engine read, ` +
        "so there is a clear on-page improvement opportunity.",
      evidence: evidenceFor(scan, CORE_SEO_RULES),
    };
  },
};

/**
 * 4. Website Development — a concrete implementation fault.
 *
 * Any one of: served without HTTPS, no responsive viewport, a large
 * fixed-width layout, or a redirect chain past the scanner's threshold. Each
 * is a deterministic observation about how the site is built.
 *
 * `slow-response` and `oversized-html` are deliberately not triggers. Both
 * vary with the network and the moment of measurement, and neither is by
 * itself an implementation fault worth an email. They still appear in the
 * findings summary for a person to read.
 *
 * A detected platform is never a trigger. WordPress, Shopify or PHP is
 * information about the build, not a defect in it.
 */
const websiteDevelopmentRule: OpportunityRule = {
  id: "website-development",
  opportunity: "Website Development",
  evaluate: (scan) => {
    const insecure = !scan.https;
    const evidence = [
      insecure ? "The site is served without HTTPS." : null,
      ...evidenceFor(scan, TECHNICAL_RULES),
    ].filter((line): line is string => line !== null);
    if (evidence.length === 0) return null;

    return {
      reason: insecure
        ? "The site is served without HTTPS, which is a concrete technical issue worth reviewing."
        : "The homepage shows a concrete technical issue in how the site is built, which is worth reviewing.",
      evidence,
    };
  },
};

/**
 * 5. No Clear Opportunity — the scan worked and nothing reached a threshold.
 *
 * A real and useful outcome, not a failure. Forcing every prospect into a
 * service is how a prospecting tool starts inventing problems.
 */
const noClearOpportunityRule: OpportunityRule = {
  id: "no-clear-opportunity",
  opportunity: "No Clear Opportunity",
  evaluate: () => ({
    reason:
      "The homepage was read and none of the checks found a clear, defensible reason to make contact.",
    evidence: [],
  }),
};

/**
 * The precedence. First match wins, and the order is the product decision:
 *
 * 1. refuse to recommend when the scan is not trustworthy;
 * 2. a storefront with a buying-path obstacle is the most specific result;
 * 3. on-page SEO gaps are the most common defensible opening;
 * 4. an implementation fault;
 * 5. otherwise, say so plainly.
 */
export const OPPORTUNITY_RULES: readonly OpportunityRule[] = [
  manualReviewRule,
  ecommerceRule,
  seoRule,
  websiteDevelopmentRule,
  noClearOpportunityRule,
];

/** The single service for an opportunity, or `null` where it recommends none. */
export function serviceFor(opportunity: Opportunity): ForgelineService | null {
  return SERVICE_FOR_OPPORTUNITY[opportunity] || null;
}

/**
 * The one opportunity for a scan.
 *
 * Always returns a result: the last rule matches unconditionally, so there is
 * no undefined case and no empty state for a caller to handle.
 */
export function detectOpportunity(scan: QuickScanResult): OpportunityResult {
  for (const rule of OPPORTUNITY_RULES) {
    const outcome = rule.evaluate(scan);
    if (!outcome) continue;
    return {
      opportunity: rule.opportunity,
      service: serviceFor(rule.opportunity),
      reason: outcome.reason,
      evidence: outcome.evidence,
      ruleId: rule.id,
    };
  }

  // Unreachable: `noClearOpportunityRule` always matches. Kept so a future
  // edit that makes the last rule conditional fails loudly rather than
  // returning undefined into the application layer.
  throw new Error("No opportunity rule matched the scan.");
}
