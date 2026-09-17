import { fetchBoundedPage } from "./fetch.ts";
import { getAuditSummary, saveAuditFailure, saveAuditResult, saveAuditRunning } from "./audit.ts";
import { runAuditJob, type AuditJobDependencies } from "./runner.ts";
import { refreshQualificationSnapshot } from "./qualification.ts";
import { withRetry } from "../retry.ts";

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
 * Errors are already recorded on the row by `runAuditJob`; this last guard only
 * catches a failure to write that failure, which must not crash the process
 * after the response has been sent.
 */
export async function runAuditInBackground(input: {
  auditId: number;
  requestedUrl: string;
}): Promise<void> {
  try {
    await runAuditJob(input, auditJobDependencies());
  } catch (error) {
    console.error(`Prospecting audit ${input.auditId} could not be recorded.`, error);
  }

  // This inline path — `requestAudit` and `rerunAudit`, both routed through
  // `startAudit` — never goes through the drain, so nothing else refreshes
  // the list's snapshot for a prospect-linked audit here. Without this, the
  // detail page (which always recomputes) and the list (which reads the
  // snapshot) visibly disagree after a re-run. Retried, then caught: a
  // transient failure here must never fail the audit itself, which is
  // already saved.
  try {
    const summary = await getAuditSummary(input.auditId);
    if (summary && summary.prospectId !== null) {
      const prospectId = summary.prospectId;
      await withRetry(() => refreshQualificationSnapshot(prospectId));
    }
  } catch (error) {
    console.error(
      `[prospecting] snapshot refresh after audit ${input.auditId} failed`,
      error,
    );
  }
}
