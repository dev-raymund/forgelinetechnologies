import { fetchBoundedPage } from "./fetch.ts";
import { saveAuditFailure, saveAuditResult, saveAuditRunning } from "./audit.ts";
import { runAuditJob, type AuditJobDependencies } from "./runner.ts";

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
}
