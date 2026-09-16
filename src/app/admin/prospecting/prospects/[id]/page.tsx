import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { requireCapability } from "@/lib/auth/guard";
import { getProspect } from "@/lib/prospecting/prospects";
import { getDb, prospectAudits } from "@/db";
import { withRetry } from "@/lib/queries";
import { Empty, PageTitle, Status, when } from "@/components/admin/ui";
import { SuppressControls } from "@/components/admin/prospecting/suppress-controls";

export const metadata = { title: "Prospect" };

/**
 * `ProspectSource.url` is free text supplied at import time and is not
 * guaranteed to be a safe scheme even after `commitImport` started rejecting
 * new ones — rows written before that check still exist. Only ever render it
 * as a clickable href when it parses as http(s); otherwise show it as plain
 * text with no href.
 */
function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  await requireCapability("prospecting.manage", `/admin/prospecting/prospects/${raw}`);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const prospect = await withRetry(() => getProspect(id));
  if (!prospect) notFound();

  const audits = await withRetry(() =>
    getDb()
      .select({
        id: prospectAudits.id,
        status: prospectAudits.status,
        totalScore: prospectAudits.totalScore,
        requestedAt: prospectAudits.requestedAt,
      })
      .from(prospectAudits)
      .where(eq(prospectAudits.prospectId, id))
      .orderBy(desc(prospectAudits.id)),
  );

  // `suppressedAt` is the column that carries the opt-out, not `status`, which
  // is only a workflow label: a drain that finished after the suppression
  // leaves the status at `audited` on a row that is genuinely suppressed.
  const suppressed = prospect.suppressedAt !== null;

  return (
    <>
      <Link
        href="/admin/prospecting/prospects"
        className="mb-4 inline-block text-[0.875rem] text-muted underline decoration-rule-strong underline-offset-4 hover:text-graphite"
      >
        ← All prospects
      </Link>

      <PageTitle
        title={prospect.companyName}
        count={`Prospect #${prospect.id}`}
        action={<Status value={prospect.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-sm border border-rule bg-white p-5">
            <h2 className="text-[1.0625rem] font-semibold">Details</h2>
            <dl className="mt-4 grid gap-4 text-[0.875rem] sm:grid-cols-2">
              <div>
                <dt className="font-mono text-micro text-faint">Website</dt>
                <dd className="mt-1 break-all">
                  <a
                    href={prospect.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-graphite underline decoration-rule-strong underline-offset-4 hover:decoration-accent"
                  >
                    {prospect.domain}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-mono text-micro text-faint">Industry</dt>
                <dd className="mt-1 text-graphite">{prospect.industry || "—"}</dd>
              </div>
              <div>
                <dt className="font-mono text-micro text-faint">Country</dt>
                <dd className="mt-1 text-graphite">{prospect.country || "—"}</dd>
              </div>
              <div>
                <dt className="font-mono text-micro text-faint">Location</dt>
                <dd className="mt-1 text-graphite">{prospect.location || "—"}</dd>
              </div>
              <div>
                <dt className="font-mono text-micro text-faint">Score</dt>
                <dd className="mt-1 text-graphite">{prospect.totalScore}/100</dd>
              </div>
              <div>
                <dt className="font-mono text-micro text-faint">Primary opportunity</dt>
                <dd className="mt-1 text-graphite">{prospect.primaryOpportunity || "—"}</dd>
              </div>
              <div>
                <dt className="font-mono text-micro text-faint">Last audited</dt>
                <dd className="mt-1 text-graphite">{when(prospect.lastAuditedAt)}</dd>
              </div>
            </dl>
            {suppressed ? (
              <p className="mt-5 border-l-2 border-accent bg-paper px-3 py-2 text-[0.875rem]">
                Suppressed {when(prospect.suppressedAt)}
                {prospect.suppressionReason ? `: ${prospect.suppressionReason}` : ""}
              </p>
            ) : null}
          </section>

          <section className="rounded-sm border border-rule bg-white p-5">
            <h2 className="text-[1.0625rem] font-semibold">Contact channel</h2>
            <dl className="mt-4 grid gap-4 text-[0.875rem] sm:grid-cols-2">
              <div>
                <dt className="font-mono text-micro text-faint">Channel</dt>
                <dd className="mt-1 break-all text-graphite">{prospect.contactChannel || "—"}</dd>
              </div>
              <div>
                <dt className="font-mono text-micro text-faint">Provenance</dt>
                <dd className="mt-1 text-graphite">{prospect.contactProvenance || "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-sm border border-rule bg-white p-5">
            <h2 className="text-[1.0625rem] font-semibold">
              Sources <span className="font-mono text-micro font-normal text-faint">{prospect.sources.length}</span>
            </h2>
            {prospect.sources.length ? (
              <ul className="mt-4 space-y-3 text-[0.875rem]">
                {prospect.sources.map((source, index) => (
                  <li key={`${source.name}-${index}`} className="border-t border-rule pt-3 first:border-t-0 first:pt-0">
                    <p className="font-medium text-graphite">{source.name || "Unnamed source"}</p>
                    {source.url && isHttpUrl(source.url) ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-[0.8125rem] text-muted underline decoration-rule-strong underline-offset-4 hover:decoration-accent"
                      >
                        {source.url}
                      </a>
                    ) : source.url ? (
                      <span className="break-all text-[0.8125rem] text-muted">{source.url}</span>
                    ) : null}
                    <p className="mt-1 font-mono text-micro text-faint">
                      Imported {source.importedAt ? when(new Date(source.importedAt)) : "—"}
                      {source.importedBy !== null ? ` by user #${source.importedBy}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[0.875rem] text-muted">No import source recorded.</p>
            )}
          </section>
        </div>

        <div className="lg:col-span-5">
          <section className="rounded-sm border border-rule bg-white p-5">
            <h2 className="text-[1.0625rem] font-semibold">
              {suppressed ? "Opt-out" : "Suppress this prospect"}
            </h2>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
              {suppressed
                ? "This prospect is suppressed and will not be revived by a re-import."
                : "Suppressing removes this prospect from further outreach. A re-import can never revive it."}
            </p>
            <div className="mt-4">
              <SuppressControls id={prospect.id} suppressed={suppressed} />
            </div>
          </section>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-[1.0625rem] font-semibold">
          Audit history <span className="font-mono text-micro font-normal text-faint">{audits.length}</span>
        </h2>
        {audits.length === 0 ? (
          <Empty>No audits have been run for this prospect yet.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-rule bg-white">
            <table className="w-full min-w-[36rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-rule">
                  {["Audit", "Status", "Score", "Requested", ""].map((h) => (
                    <th key={h} scope="col" className="px-4 py-2.5 font-mono text-micro font-normal text-faint">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audits.map((a) => (
                  <tr key={a.id} className="border-b border-rule last:border-b-0">
                    <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">#{a.id}</td>
                    <td className="px-4 py-3">
                      <Status value={a.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[0.875rem] text-graphite">{a.totalScore}</td>
                    <td className="px-4 py-3 text-[0.875rem] text-muted">{when(a.requestedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/prospecting/audits/${a.id}`}
                        className="text-[0.875rem] font-medium underline decoration-rule-strong underline-offset-4 hover:decoration-accent"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
