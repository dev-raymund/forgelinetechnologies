import type { AuditFinding as StoredAuditFinding, ProspectAudit } from "@/db";
import { Status, when } from "@/components/admin/ui";
import { RerunButton } from "@/components/admin/prospecting/rerun-button";

type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function JsonEvidence({ value }: { value: unknown }) {
  const entries = Object.entries(object(value));
  return entries.length ? (
    <dl className="mt-2 grid gap-1 text-[0.8125rem] sm:grid-cols-[auto_1fr] sm:gap-x-3">
      {entries.map(([key, item]) => (
        <div key={key} className="contents">
          <dt className="font-mono text-faint">{key}</dt>
          <dd className="break-words text-muted">{typeof item === "string" ? item : JSON.stringify(item)}</dd>
        </div>
      ))}
    </dl>
  ) : (
    <p className="mt-2 text-[0.8125rem] text-faint">No additional value was observed.</p>
  );
}

export function AuditReport({
  audit,
  findings,
}: {
  audit: ProspectAudit;
  findings: StoredAuditFinding[];
}) {
  const report = object(audit.report);
  const performance = object(report.performance);
  const indicators = Array.isArray(report.technologyIndicators) ? report.technologyIndicators : [];
  const scores = object(audit.scores);
  const redirectChain = Array.isArray(audit.redirectChain) ? audit.redirectChain : [];
  const classification = text(report.primaryOpportunity) || "Build Audit";

  return (
    <div className="space-y-8">
      <section className="rounded-sm border border-rule bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-micro text-faint">Audit #{audit.id}</p>
            <h2 className="mt-1 text-[1.15rem] font-semibold">{classification}</h2>
          </div>
          <div className="flex items-center gap-3">
            <Status value={audit.status} />
            {audit.status === "queued" || audit.status === "running" ? (
              <RerunButton auditId={audit.id} />
            ) : null}
          </div>
        </div>
        {audit.status === "queued" || audit.status === "running" ? (
          <p className="mt-4 text-[0.8125rem] leading-relaxed text-muted">
            This audit has not finished. Reload the page to see the result. If it
            stays here, the process running it stopped before it could record
            one — re-run to start a fresh audit of the same URL.
          </p>
        ) : null}
        {audit.errorDetail ? (
          <p role="alert" className="mt-4 border-l-2 border-accent bg-paper px-3 py-2 text-[0.875rem]">
            {audit.errorDetail}
          </p>
        ) : null}
        <dl className="mt-5 grid gap-4 text-[0.875rem] md:grid-cols-2">
          <div>
            <dt className="font-mono text-micro text-faint">Requested URL</dt>
            <dd className="mt-1 break-all text-graphite">{audit.requestedUrl}</dd>
          </div>
          <div>
            <dt className="font-mono text-micro text-faint">Final URL</dt>
            <dd className="mt-1 break-all text-graphite">{audit.finalUrl || "Not fetched"}</dd>
          </div>
          <div>
            <dt className="font-mono text-micro text-faint">HTTP status</dt>
            <dd className="mt-1 text-graphite">{audit.httpStatus ?? "Not available"}</dd>
          </div>
          <div>
            <dt className="font-mono text-micro text-faint">Transport</dt>
            <dd className="mt-1 text-graphite">{audit.https ? "HTTPS" : "HTTP or not available"}</dd>
          </div>
        </dl>
        {redirectChain.length ? (
          <div className="mt-5 border-t border-rule pt-4">
            <h3 className="font-mono text-micro text-faint">Redirect chain</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-[0.875rem] text-muted">
              {redirectChain.map((url) => <li key={url} className="break-all">{url}</li>)}
            </ol>
          </div>
        ) : null}
        <p className="mt-5 text-[0.8125rem] text-faint">Requested {when(audit.requestedAt)}.</p>
      </section>

      <section>
        <h2 className="mb-3 text-[1.0625rem] font-semibold">Observed signals</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-sm border border-rule bg-white p-4">
            <h3 className="font-mono text-micro text-faint">Performance and response</h3>
            <dl className="mt-3 grid gap-2 text-[0.875rem]">
              <Metric label="Response time" value={number(performance.responseTimeMs) === null ? "Not available" : `${performance.responseTimeMs} ms`} />
              <Metric label="HTML bytes" value={number(performance.htmlBytes) === null ? "Not available" : String(performance.htmlBytes)} />
              <Metric label="Stylesheets" value={number(performance.renderBlockingStylesheets) === null ? "Not available" : String(performance.renderBlockingStylesheets)} />
              <Metric label="Scripts" value={number(performance.scriptCount) === null ? "Not available" : String(performance.scriptCount)} />
              <Metric label="Images" value={number(performance.imageCount) === null ? "Not available" : String(performance.imageCount)} />
            </dl>
          </div>
          <div className="rounded-sm border border-rule bg-white p-4">
            <h3 className="font-mono text-micro text-faint">Technology signals</h3>
            {indicators.length ? (
              <ul className="mt-3 space-y-2 text-[0.875rem]">
                {indicators.map((item, index) => {
                  const signal = object(item);
                  return <li key={`${text(signal.name)}-${index}`}><span className="font-medium">{text(signal.name) || "Unknown"}</span><span className="ml-2 text-muted">{text(signal.signal) || "Observed"}</span></li>;
                })}
              </ul>
            ) : <p className="mt-3 text-[0.875rem] text-muted">No technology signal was identified by the deterministic checks.</p>}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[1.0625rem] font-semibold">Score components</h2>
          <span className="font-mono text-micro text-faint">Total {audit.totalScore}/100</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            ["Website UX", "websiteUx"], ["SEO", "seo"], ["Technical", "technical"],
            ["Conversion", "conversion"], ["Business fit", "businessFit"], ["Decision-maker availability", "decisionMakerAvailability"],
          ].map(([label, key]) => <MetricCard key={key} label={label} value={number(scores[key]) === null ? "Not assessed" : String(scores[key])} />)}
        </div>
        <p className="mt-3 text-[0.8125rem] text-faint">Business fit and decision-maker availability are not assessed in Phase 1.</p>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[1.0625rem] font-semibold">Findings and evidence</h2>
          <span className="font-mono text-micro text-faint">{findings.length} recorded</span>
        </div>
        {findings.length ? (
          <div className="space-y-3">
            {findings.map((finding) => (
              <article key={finding.id} className="rounded-sm border border-rule bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-micro text-faint">{finding.category}</span>
                  <Status value={finding.severity} />
                  <span className="font-mono text-micro text-faint">{finding.confidence} confidence</span>
                </div>
                <h3 className="mt-2 font-medium">{finding.rule}</h3>
                <p className="mt-1 text-[0.875rem] text-muted">{finding.recommendation}</p>
                <p className="mt-3 break-all font-mono text-micro text-faint">{finding.pageUrl}</p>
                <JsonEvidence value={finding.evidence} />
              </article>
            ))}
          </div>
        ) : <p className="rounded-sm border border-dashed border-rule-strong bg-white px-5 py-8 text-center text-[0.9375rem] text-muted">No findings were recorded.</p>}
      </section>

      <p className="border-l-2 border-rule-strong bg-white px-4 py-3 text-[0.8125rem] leading-relaxed text-muted">
        This report contains observations from a bounded unauthenticated fetch.
        It is not a claim about revenue, rankings, customer loss, or conversion
        loss, and it does not replace human review.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3"><dt className="text-muted">{label}</dt><dd className="font-mono text-graphite">{value}</dd></div>;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-sm border border-rule bg-white px-4 py-3"><span className="block font-mono text-[1.2rem] text-graphite">{value}</span><span className="mt-1 block text-[0.8125rem] text-muted">{label}</span></div>;
}
