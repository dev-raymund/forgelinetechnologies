/**
 * The quick scan's result, and the projection that produces it.
 *
 * This is the shape the next phase reads. It exists so that opportunity
 * detection never has to understand the audit engine: no `PageAnalysis`, no
 * findings-to-components mapping, no persistence row — just the facts one
 * bounded fetch established about one page.
 *
 * There is no scanner here. Fetching lives in `fetch.ts` and analysis in
 * `analyze.ts`; this module only re-shapes what they already produced, so
 * there is exactly one implementation of each.
 *
 * Everything in it is an observation. Nothing in it is a conclusion about the
 * business — that judgement belongs to the phase that consumes this, and to
 * the person reading it.
 */
import type { PageAnalysis, PageObservations, PageSignals } from "./analyze.ts";
import type { BoundedPageResponse } from "./fetch.ts";
import type { AuditFinding } from "./types.ts";

export type QuickScanResult = {
  requestedUrl: string;
  /** `null` when the page was never reached. */
  finalUrl: string | null;
  httpStatus: number | null;
  https: boolean;
  responseTimeMs: number | null;
  /** Every hop followed, in order. Empty when there were none. */
  redirectChain: string[];
  page: PageObservations;
  signals: PageSignals;
  /** Detected platform and framework names, e.g. `["WordPress", "WooCommerce"]`. */
  technologies: string[];
  /** The existing deterministic findings, unchanged. */
  findings: AuditFinding[];
  /** Present only when the scan could not be completed. */
  error?: string;
};

const NO_OBSERVATIONS: PageObservations = {
  title: null,
  metaDescription: null,
  h1: null,
  canonical: null,
  viewport: false,
  robotsMeta: false,
  sitemapLink: false,
  jsonLd: false,
};

const NO_SIGNALS: PageSignals = {
  forms: 0,
  ctas: 0,
  images: 0,
  imagesWithoutAlt: 0,
  scripts: 0,
  stylesheets: 0,
  htmlBytes: 0,
  ecommerce: false,
};

/**
 * Pure: the scan result for a page that was fetched and analysed.
 *
 * `https` is read from the final URL rather than the requested one, so a site
 * that redirects http to https is recorded as the secure page it actually
 * served.
 */
export function toQuickScanResult(page: BoundedPageResponse, analysis: PageAnalysis): QuickScanResult {
  return {
    requestedUrl: page.requestedUrl,
    finalUrl: page.finalUrl,
    httpStatus: page.status,
    https: page.finalUrl.startsWith("https:"),
    responseTimeMs: page.elapsedMs,
    redirectChain: page.redirectChain,
    page: analysis.observations,
    signals: analysis.signals,
    technologies: analysis.technologyIndicators.map((indicator) => indicator.name),
    findings: analysis.findings,
  };
}

/**
 * Pure: the scan result for a page that could not be read.
 *
 * A failed scan still returns the full shape so the consumer has one branch
 * rather than two. Every field says "nothing was observed" rather than
 * standing in for a value, because a fetch that never happened must not look
 * like a page with no title.
 */
export function failedQuickScan(requestedUrl: string, error: string): QuickScanResult {
  return {
    requestedUrl,
    finalUrl: null,
    httpStatus: null,
    https: false,
    responseTimeMs: null,
    redirectChain: [],
    page: { ...NO_OBSERVATIONS },
    signals: { ...NO_SIGNALS },
    technologies: [],
    findings: [],
    error,
  };
}
