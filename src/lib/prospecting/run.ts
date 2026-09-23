import { fetchBoundedPage } from "./fetch.ts";
import { getAuditSummary, saveAuditFailure, saveAuditResult, saveAuditRunning } from "./audit.ts";
import { runAuditJob, type AuditJobDependencies, type AuditJobResult } from "./runner.ts";
import { recordAuditOutcome } from "./outcome.ts";
import type { QuickScanResult } from "./quick-scan.ts";
import type { AuditMode } from "./types.ts";

/**
 * robots.txt and sitemap.xml are not HTML, so the supporting fetches accept the
 * plain-text and XML types the homepage fetch deliberately rejects.
 */
const SUPPORT_CONTENT_TYPES = [
  "text/html",
  "application/xhtml+xml",
  "text/plain",
  "application/xml",
  "text/xml",
] as const;

export function auditJobDependencies(): AuditJobDependencies {
  return {
    markRunning: saveAuditRunning,
    fetchPage: (url) => fetchBoundedPage(url),
    fetchResource: (url) => fetchBoundedPage(url, { allowedContentTypes: SUPPORT_CONTENT_TYPES }),
    saveResult: saveAuditResult,
    saveFailure: saveAuditFailure,
  };
}

/**
 * The whole audit is bounded — one homepage, robots.txt, sitemap.xml and at
 * most twelve link probes, each with a ten second timeout — so it completes
 * well inside a single serverless invocation and needs no external queue.
 *
 * A `quick` audit is bounded far tighter still: the one homepage fetch and
 * nothing else. `mode` is optional and defaults to `full`, so every caller
 * that does not name it keeps the audit it already had.
 *
 * Errors are already recorded on the row by `runAuditJob`; this last guard only
 * catches a failure to write that failure, which must not crash the process
 * after the response has been sent.
 */
export async function runAuditInBackground(input: {
  auditId: number;
  requestedUrl: string;
  mode?: AuditMode;
}): Promise<void> {
  let result: AuditJobResult | undefined;
  try {
    result = await runAuditJob(input, auditJobDependencies());
  } catch (error) {
    console.error(`Prospecting audit ${input.auditId} could not be recorded.`, error);
  }
  // Nothing was recorded on the row, so there is no outcome to apply either.
  if (!result) return;

  // This inline path — `requestAudit` and `rerunAudit`, both routed through
  // `startAudit` — never goes through the drain, so this is where a
  // prospect-linked audit records its outcome. Without it a re-run left the
  // prospect at `queued`, pointing at the superseded run, with a stale list
  // snapshot the recomputing detail page visibly disagreed with.
  //
  // Caught, never thrown: the audit itself is already saved, and this runs
  // after the response has been sent.
  try {
    const summary = await getAuditSummary(input.auditId);
    if (summary) {
      await recordAuditOutcome({
        prospectId: summary.prospectId,
        auditId: input.auditId,
        status: result.status,
      });
    }
  } catch (error) {
    console.error(`[prospecting] recording audit ${input.auditId} against its prospect failed`, error);
  }
}

/**
 * A quick scan that writes nothing.
 *
 * `fetchResource` is deliberately absent as well as `mode: "quick"`: the mode
 * is what decides, and leaving the dependency out means even a future edit to
 * that branch cannot make this path probe a second URL.
 *
 * The three persistence hooks are no-ops because this path stores nothing —
 * the result lives in the request that asked for it. `auditId` is therefore
 * never read by anything; it exists only to satisfy the job input that the
 * persisting path needs.
 */
export function quickScanDependencies(): AuditJobDependencies {
  return {
    markRunning: async () => undefined,
    fetchPage: (url) => fetchBoundedPage(url),
    saveResult: async () => undefined,
    saveFailure: async () => undefined,
  };
}

/**
 * Reads one website and returns what was observed.
 *
 * The caller is responsible for having normalised and safety-checked the URL
 * first; `fetchBoundedPage` asserts it again on the request and on every
 * redirect hop regardless, so the guarantee does not rest on that.
 *
 * Never throws for a site that cannot be read: `runAuditJob` records the
 * failure on the result, and the scan comes back with `error` set.
 */
export async function scanWebsite(
  requestedUrl: string,
  dependencies: AuditJobDependencies = quickScanDependencies(),
): Promise<QuickScanResult> {
  const result = await runAuditJob({ auditId: 0, requestedUrl, mode: "quick" }, dependencies);
  return result.scan;
}
