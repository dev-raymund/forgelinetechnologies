import { analyzePage, collectAuditLinks, type PageAnalysis, type ResourceCheck } from "./analyze.ts";
import { fetchBoundedPage, type BoundedPageResponse } from "./fetch.ts";
import { failedQuickScan, toQuickScanResult, type QuickScanResult } from "./quick-scan.ts";
import type { AuditFinding, AuditMode } from "./types.ts";

/**
 * `mode` defaults to `full`, so every existing caller keeps the deeper audit
 * it already had without naming it.
 */
export type AuditJobInput = { auditId: number; requestedUrl: string; mode?: AuditMode };

export type AuditResultToPersist = {
  id: number;
  status: "completed" | "partial";
  finalUrl: string;
  httpStatus: number;
  https: boolean;
  redirectChain: string[];
  report: Record<string, unknown>;
  findings: AuditFinding[];
};

export type LinkCheck = {
  url: string;
  status: number | null;
  error?: string;
};

export type AuditSupport = {
  robotsTxt?: ResourceCheck;
  sitemap?: ResourceCheck;
  linkChecks: LinkCheck[];
};

export type AuditJobDependencies = {
  markRunning: (id: number) => Promise<unknown>;
  fetchPage: (url: string) => Promise<BoundedPageResponse>;
  fetchResource?: (url: string) => Promise<BoundedPageResponse>;
  saveResult: (input: AuditResultToPersist) => Promise<unknown>;
  saveFailure: (id: number, detail: string) => Promise<unknown>;
};

/**
 * `scan` is on both outcomes and in both modes: it is a projection of the same
 * analysis, so a consumer reads one shape and never branches on the mode.
 * `analysis` carries the fuller detail the stored report page renders.
 */
export type AuditJobSuccess = {
  status: "completed" | "partial";
  analysis: PageAnalysis;
  scan: QuickScanResult;
};
export type AuditJobFailure = { status: "failed"; error: string; scan: QuickScanResult };
export type AuditJobResult = AuditJobSuccess | AuditJobFailure;

function errorDetail(error: unknown): string {
  return (error instanceof Error ? error.message : "The audit could not be completed.").slice(0, 10_000);
}

function supportFinding(
  pageUrl: string,
  rule: string,
  severity: AuditFinding["severity"],
  evidence: Record<string, string | number>,
  recommendation: string,
): AuditFinding {
  return {
    id: `${rule}:${pageUrl}`,
    category: rule === "broken-link" ? "links" : "technical",
    rule,
    severity,
    pageUrl,
    evidence,
    recommendation,
    confidence: "high",
    observedAt: new Date().toISOString(),
  };
}

export async function collectAuditSupport(
  page: BoundedPageResponse,
  fetchResource: (url: string) => Promise<BoundedPageResponse>,
): Promise<AuditSupport> {
  const base = new URL(page.finalUrl);
  const resource = async (path: string): Promise<ResourceCheck> => {
    const url = new URL(path, base).toString();
    try {
      const response = await fetchResource(url);
      return { url, status: response.status, body: response.body };
    } catch {
      return { url, status: 0, body: "" };
    }
  };
  const [robotsTxt, sitemap] = await Promise.all([resource("/robots.txt"), resource("/sitemap.xml")]);
  const links = collectAuditLinks(page.finalUrl, page.body);
  const linkChecks = await Promise.all(
    links.map(async (link) => {
      try {
        const response = await fetchResource(link.url);
        return { url: link.url, status: response.status };
      } catch (error) {
        return {
          url: link.url,
          status: null,
          error: error instanceof Error ? error.message.slice(0, 200) : "Fetch failed",
        };
      }
    }),
  );
  return { robotsTxt, sitemap, linkChecks };
}

function linkFindings(pageUrl: string, checks: LinkCheck[]): AuditFinding[] {
  return checks
    .filter((check) => check.status === null || check.status <= 0 || check.status >= 400)
    .map((check) =>
      supportFinding(
        pageUrl,
        "broken-link",
        "medium",
        { url: check.url, ...(check.status === null ? {} : { status: check.status }) },
        "Review the linked destination and update or remove the link if it is no longer available.",
      ),
    );
}

export function prepareAuditResult(input: {
  auditId: number;
  page: BoundedPageResponse;
  support?: AuditSupport;
  mode?: AuditMode;
}): {
  analysis: PageAnalysis;
  scan: QuickScanResult;
  persistence: AuditResultToPersist;
} {
  const { page } = input;
  const support = input.support ?? { linkChecks: [] };
  const partialChecks = [
    ...(support.robotsTxt?.status === 0 ? ["robots.txt"] : []),
    ...(support.sitemap?.status === 0 ? ["sitemap.xml"] : []),
    ...(support.linkChecks.some((check) => check.status === null || check.status <= 0) ? ["link probes"] : []),
  ];
  const status = partialChecks.length ? "partial" : "completed";
  const analysis = analyzePage({
    pageUrl: page.requestedUrl,
    finalUrl: page.finalUrl,
    status: page.status,
    headers: page.headers,
    body: page.body,
    bytes: page.bytes,
    elapsedMs: page.elapsedMs,
    redirectChain: page.redirectChain,
    robotsTxt: support.robotsTxt,
    sitemap: support.sitemap,
  });
  const allFindings = [...analysis.findings, ...linkFindings(page.finalUrl, support.linkChecks)];
  const completeAnalysis = { ...analysis, findings: allFindings };

  return {
    analysis: completeAnalysis,
    // Projected from the analysis with every finding the mode gathered, so a
    // full audit's scan carries its link findings too.
    scan: toQuickScanResult(page, completeAnalysis),
    persistence: {
      id: input.auditId,
      status,
      finalUrl: page.finalUrl,
      httpStatus: page.status,
      https: page.finalUrl.startsWith("https:"),
      redirectChain: page.redirectChain,
      report: {
        auditVersion: input.mode === "quick" ? "quick-v1" : "phase1-v1",
        mode: input.mode ?? "full",
        requestedUrl: page.requestedUrl,
        performance: analysis.performance,
        technologyIndicators: analysis.technologyIndicators,
        links: analysis.links,
        linkChecks: support.linkChecks,
        partialChecks,
      },
      findings: allFindings,
    },
  };
}

export async function runAuditJob(
  input: AuditJobInput,
  dependencies: AuditJobDependencies = {
    markRunning: async () => undefined,
    fetchPage: (url) => fetchBoundedPage(url),
    saveResult: async () => undefined,
    saveFailure: async () => undefined,
  },
): Promise<AuditJobResult> {
  await dependencies.markRunning(input.auditId);

  try {
    const page = await dependencies.fetchPage(input.requestedUrl);
    // The single branch between the two modes. Quick mode makes no request
    // beyond the primary page, and is decided by the mode alone — never by
    // whether a `fetchResource` dependency happens to have been supplied,
    // which the production wiring always does.
    const support =
      input.mode !== "quick" && dependencies.fetchResource
        ? await collectAuditSupport(page, dependencies.fetchResource)
        : undefined;
    const prepared = prepareAuditResult({ auditId: input.auditId, page, support, mode: input.mode });
    await dependencies.saveResult(prepared.persistence);

    return {
      status: prepared.persistence.status,
      analysis: prepared.analysis,
      scan: prepared.scan,
    };
  } catch (error) {
    const detail = errorDetail(error);
    await dependencies.saveFailure(input.auditId, detail);
    return { status: "failed", error: detail, scan: failedQuickScan(input.requestedUrl, detail) };
  }
}
