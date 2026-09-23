/**
 * Factual observation lines from a quick scan.
 *
 * One job: turn the scanner's raw findings into short sentences a person can
 * read, so the opportunity rules never have to understand the finding
 * structure and never have to write prose of their own.
 *
 * Every line states what was observed. None of them says what it means for the
 * business — that reading belongs to the person, not to this file.
 *
 * This is not a ranking. `summarizeFindings` orders by the severity the
 * scanner itself recorded on each finding, which is the scanner's own metadata
 * and not a judgement about commercial value.
 *
 * Pure: no database, no network, no environment.
 */
import type { QuickScanResult } from "./quick-scan.ts";
import type { FindingSeverity } from "./types.ts";

/**
 * The four rules a quick scan can never produce, because each needs a request
 * quick mode deliberately does not make. Listed so that a rule written against
 * one of them fails a test instead of silently never firing.
 */
export const RULES_REQUIRING_A_FULL_AUDIT: readonly string[] = [
  "missing-robots-txt",
  "invalid-robots",
  "missing-sitemap",
  "invalid-sitemap",
  "broken-link",
];

const SEVERITY_ORDER: Record<FindingSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
  informational: 3,
};

/** The distinct rule identifiers this scan reported. */
export function findingRules(scan: QuickScanResult): ReadonlySet<string> {
  return new Set(scan.findings.map((finding) => finding.rule));
}

/** True when the scan reported the named rule at least once. */
export function has(scan: QuickScanResult, rule: string): boolean {
  return scan.findings.some((finding) => finding.rule === rule);
}

/** How many of the named rules the scan reported. Used for rule thresholds. */
export function countOf(scan: QuickScanResult, rules: readonly string[]): number {
  const present = findingRules(scan);
  return rules.filter((rule) => present.has(rule)).length;
}

/**
 * One factual sentence for a rule, or `null` where the rule has no useful
 * plain-English form.
 *
 * Counts are read from the scan's own signals rather than from a finding's
 * evidence blob: `missing-image-alt` is reported once per image, so the
 * finding count is not the number a person wants to read.
 *
 * `missing-robots` is the `<meta name="robots">` tag. Its wording says so,
 * because calling it "robots.txt" would report a file the quick scan never
 * requested.
 */
export function observationFor(rule: string, scan: QuickScanResult): string | null {
  switch (rule) {
    case "missing-title":
      return "No page title detected.";
    case "duplicate-title":
      return "More than one title element detected.";
    case "missing-meta-description":
      return "No meta description detected.";
    case "duplicate-meta-description":
      return "More than one meta description detected.";
    case "missing-h1":
      return "No H1 detected.";
    case "multiple-h1":
      return "More than one H1 detected.";
    case "missing-canonical":
      return "No canonical URL declared.";
    case "invalid-canonical":
      return "The declared canonical URL is not a valid HTTP or HTTPS address.";
    case "missing-robots":
      return "No robots meta tag declared on the page.";
    case "noindex-meta":
      return "The page declares a noindex robots directive.";
    case "missing-viewport":
      return "No responsive viewport meta tag detected.";
    case "fixed-width-layout":
      return "A large fixed-width layout was detected.";
    case "missing-structured-data":
      return "No JSON-LD structured data detected.";
    case "invalid-structured-data":
      return "A JSON-LD block on the page does not parse as valid JSON.";
    case "http-response-error":
      return scan.httpStatus === null
        ? "The homepage returned an error response."
        : `The homepage returned HTTP ${scan.httpStatus}.`;
    case "slow-response":
      return scan.responseTimeMs === null
        ? "The homepage was slow to respond."
        : `Response time: ${scan.responseTimeMs.toLocaleString("en-AU")} ms.`;
    case "oversized-html":
      return `HTML size: ${scan.signals.htmlBytes.toLocaleString("en-AU")} bytes.`;
    case "redirect-chain-too-long":
      return `The homepage followed ${scan.redirectChain.length} redirects.`;
    case "missing-image-alt":
      return `${scan.signals.imagesWithoutAlt} of ${scan.signals.images} images have no alt text.`;
    case "missing-image-dimensions":
      return "Images without declared width or height were detected.";
    case "form-without-submit-control":
      return "A form without a usable submit control was detected.";
    case "missing-primary-cta":
      return "No obvious call to action detected in the page text.";
    default:
      return null;
  }
}

/** One rule the scan reported, with the sentence that states it. */
export type Observation = { rule: string; line: string };

/**
 * Every observation the scan supports, most severe first and one per rule.
 *
 * Carries the rule identifier beside the sentence so a caller can select by
 * rule rather than by matching prose. Ordering is by the severity the scanner
 * itself recorded, which is its own metadata and not a judgement about value.
 */
export function observationList(scan: QuickScanResult): Observation[] {
  const bestSeverity = new Map<string, FindingSeverity>();
  for (const finding of scan.findings) {
    const current = bestSeverity.get(finding.rule);
    if (current === undefined || SEVERITY_ORDER[finding.severity] < SEVERITY_ORDER[current]) {
      bestSeverity.set(finding.rule, finding.severity);
    }
  }

  return [...bestSeverity.entries()]
    .sort((a, b) => SEVERITY_ORDER[a[1]] - SEVERITY_ORDER[b[1]])
    .map(([rule]) => ({ rule, line: observationFor(rule, scan) }))
    .filter((o): o is Observation => o.line !== null);
}

/**
 * The scan's observations as short factual lines, most severe first and one
 * line per rule.
 *
 * `limit` keeps the list readable on a prospect page. It is a display bound,
 * not a filter on importance.
 */
export function summarizeFindings(scan: QuickScanResult, limit = 6): string[] {
  return observationList(scan)
    .map((o) => o.line)
    .slice(0, limit);
}
