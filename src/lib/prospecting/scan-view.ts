/**
 * What the prospecting screen shows.
 *
 * Everything the result screen renders is decided here, so the React component
 * stays a renderer with no logic of its own. That matters for two reasons: the
 * project's tests are plain `node:test` with no DOM, so logic in a component is
 * logic nobody can test; and the opportunity rules must have exactly one home,
 * which is `opportunity.ts`.
 *
 * Nothing here re-reads a finding, re-decides an opportunity, or rewords a
 * reason. `reason` and `evidence` are passed through from the deterministic
 * result untouched — the whole point of Phase 3 is that those sentences are
 * already safe, and a UI that "improves" them would be the exact place a
 * fabricated claim gets introduced.
 *
 * Pure: no database, no network, no React.
 */
import { observationList, summarizeFindings, type Observation } from "./findings-summary.ts";
import type { OpportunityResult } from "./opportunity.ts";
import type { QuickScanResult } from "./quick-scan.ts";
import type { ForgelineService, Opportunity } from "./types.ts";

export type ScanView = {
  /** The title the site declared, or its domain. Never a guessed business name. */
  siteName: string;
  /** Lower-case host without `www.`, always shown so the reader knows what was read. */
  domain: string;
  requestedUrl: string;
  finalUrl: string | null;
  httpStatus: number | null;
  https: boolean;
  /** True when the requested URL and the URL finally read are not the same. */
  redirected: boolean;
  /** Whether a page was read at all. False means the Website block has little to say. */
  reached: boolean;
  /** Short factual observation lines for the screen. Capped for readability. */
  quickFindings: string[];
  /**
   * Every observation the scan supports, with its rule identifier.
   *
   * The screen shows `quickFindings`; this is the complete set, and it is what
   * the outreach draft draws a supporting observation from. Keeping the rule
   * beside the sentence means a caller selects by identifier rather than by
   * matching prose.
   */
  observations: Observation[];
  opportunity: Opportunity;
  /** `null` for No Clear Opportunity and Needs Manual Review. */
  service: ForgelineService | null;
  /** Rendered as supplied by `detectOpportunity`. Never edited here. */
  reason: string;
  /** Rendered as supplied. Empty for No Clear Opportunity. */
  evidence: string[];
};

/**
 * Separators a site puts between its name and its SEO tail.
 *
 * The ASCII hyphen is deliberately absent. Plenty of real names contain one —
 * "Roofing in Charlottesville, VA - Vanguard Roofing" is a title where cutting
 * at the hyphen would throw away the company — so only the separators that are
 * conventionally decorative are used.
 */
const TITLE_SEPARATOR = /\s*[|–—]\s*/;

/**
 * The business name out of a page title.
 *
 * Titles are written for search results, so they routinely read "The Roofing
 * Company North West | Local Roofing Contractor | Manchester". Addressing an
 * email to all of that announces it was generated. The first segment is the
 * name often enough to be worth taking, and nothing is added: no legal suffix,
 * no expansion, no guess.
 */
export function cleanSiteName(title: string): string {
  const [first = ""] = title.split(TITLE_SEPARATOR);
  return first.trim();
}

/** The host of a URL, lower-cased and without `www.`; `""` when unparseable. */
export function hostOf(url: string | null): string {
  if (!url) return "";
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return "";
  }
}

/**
 * Pure: the screen's data for one completed detection.
 *
 * `siteName` prefers the page's own `<title>`, because that is what the
 * business published about itself. With no title it falls back to the domain.
 * It never tries to extract a company name from a title, and never fills the
 * gap from anywhere else — a guessed business name in an outreach tool is a
 * fabrication waiting to be sent to a stranger.
 */
export function toScanView(scan: QuickScanResult, opportunity: OpportunityResult): ScanView {
  const domain = hostOf(scan.finalUrl) || hostOf(scan.requestedUrl);
  const title = cleanSiteName(scan.page?.title ?? "");

  return {
    // Cleaned title, else the domain. Never a name that was not on the page.
    siteName: title || domain || scan.requestedUrl,
    domain,
    requestedUrl: scan.requestedUrl,
    finalUrl: scan.finalUrl,
    httpStatus: scan.httpStatus,
    https: scan.https,
    redirected: scan.finalUrl !== null && scan.finalUrl !== scan.requestedUrl,
    reached: scan.finalUrl !== null && scan.httpStatus !== null,
    quickFindings: summarizeFindings(scan),
    observations: observationList(scan),
    opportunity: opportunity.opportunity,
    service: opportunity.service,
    reason: opportunity.reason,
    evidence: opportunity.evidence,
  };
}
