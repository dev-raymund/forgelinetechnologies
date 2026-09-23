import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { requireCapability } from "@/lib/auth/guard";
import { getProspectRow } from "@/lib/prospecting/prospect-store";
import { getDb, prospectAudits } from "@/db";
import { withRetry } from "@/lib/queries";
import { Empty, PageTitle, Status, when } from "@/components/admin/ui";
import {
  OpportunityControl,
  ReanalyzeControl,
  StatusControl,
  SuppressionControl,
} from "@/components/admin/prospecting/prospect-controls";
import { ProspectOutreach } from "@/components/admin/prospecting/prospect-outreach";

export const metadata = { title: "Prospect" };

/**
 * `generateProspectOutreach` and the re-analysis both read the homepage inline:
 * one bounded fetch with a ten second timeout. 60 leaves clear headroom.
 */
export const maxDuration = 60;

/**
 * One prospect.
 *
 * Business, contact, opportunity, pipeline. Nothing on this page reads a
 * score, a band or a qualification decision — the columns still exist in the
 * database until Phase 7, but no active code path touches them.
 */
export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  await requireCapability("prospecting.manage", `/admin/prospecting/prospects/${raw}`);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const prospect = await withRetry(() => getProspectRow(id));
  if (!prospect) notFound();

  const audits = await withRetry(() =>
    getDb()
      .select({
        id: prospectAudits.id,
        status: prospectAudits.status,
        auditVersion: prospectAudits.auditVersion,
        requestedAt: prospectAudits.requestedAt,
      })
      .from(prospectAudits)
      .where(eq(prospectAudits.prospectId, id))
      .orderBy(desc(prospectAudits.id)),
  );

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

      {suppressed ? (
        <p className="mb-6 border-l-2 border-accent bg-paper px-4 py-3 text-[0.875rem]">
          <strong>Suppressed {when(prospect.suppressedAt)}.</strong> This business asked not to be
          contacted{prospect.suppressionReason ? `: ${prospect.suppressionReason}` : "."} That is separate
          from the pipeline status, and outreach should not be sent.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-sm border border-rule bg-white p-5">
            <h2 className="text-[1.0625rem] font-semibold">Business</h2>
            <dl className="mt-4 grid gap-4 text-[0.875rem] sm:grid-cols-2">
              <Fact label="Company" value={prospect.companyName} />
              <Fact label="Domain" value={prospect.domain} mono />
              <Fact label="Website" value={prospect.websiteUrl} href={prospect.websiteUrl} mono />
              <Fact label="Industry" value={prospect.industry} />
              <Fact label="Location" value={prospect.location} />
              <Fact label="Country" value={prospect.country} />
            </dl>
          </section>

          <section className="rounded-sm border border-rule bg-white p-5">
            <h2 className="text-[1.0625rem] font-semibold">Contact</h2>
            <p className="mt-2 text-[0.8125rem] text-muted">
              Only what has been recorded. Nothing is looked up.
            </p>
            <dl className="mt-4 grid gap-4 text-[0.875rem] sm:grid-cols-2">
              <Fact label="Email" value={prospect.contactEmail} mono />
              <Fact label="Phone" value={prospect.contactPhone} mono />
            </dl>
          </section>

          <section className="rounded-sm border border-rule bg-white p-5">
            <h2 className="font-mono text-micro text-faint">Opportunity</h2>
            <p className="mt-2 text-[1.5rem] font-semibold leading-tight text-graphite">
              {prospect.opportunity || "Not analyzed"}
            </p>
            <p className="mt-1 font-mono text-micro text-faint">
              {prospect.opportunitySetBy === null
                ? "Detected from the website"
                : `Chosen by a person (user #${prospect.opportunitySetBy})`}
            </p>

            {prospect.service ? (
              <div className="mt-5 border-t border-rule pt-4">
                <h3 className="font-mono text-micro text-faint">Recommended service</h3>
                <p className="mt-1 text-[1.0625rem] font-medium text-graphite">{prospect.service}</p>
              </div>
            ) : null}

            {prospect.opportunityReason ? (
              <div className="mt-5 border-l-2 border-accent bg-paper px-4 py-3">
                <h3 className="font-mono text-micro text-faint">Why</h3>
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-graphite">
                  {prospect.opportunityReason}
                </p>
              </div>
            ) : (
              <p className="mt-5 text-[0.875rem] text-muted">
                This prospect predates the simplified model, so it carries no opportunity yet.
                Generate outreach below to read the website again.
              </p>
            )}

            <OpportunityControl
              prospectId={prospect.id}
              opportunity={prospect.opportunity}
              service={prospect.service}
            />
          </section>

          <ProspectOutreach prospectId={prospect.id} contactEmail={prospect.contactEmail} />
        </div>

        <div className="space-y-6 lg:col-span-5">
          <section className="rounded-sm border border-rule bg-white p-5">
            <h2 className="text-[1.0625rem] font-semibold">Pipeline</h2>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
              Only you move a prospect. Generating or copying an email changes nothing here.
            </p>
            <div className="mt-4">
              <StatusControl prospectId={prospect.id} status={prospect.status} />
            </div>
            <dl className="mt-5 grid gap-3 border-t border-rule pt-4 text-[0.875rem]">
              <Fact label="Added" value={when(prospect.createdAt)} />
              <Fact label="Updated" value={when(prospect.updatedAt)} />
            </dl>
          </section>

          <section className="rounded-sm border border-rule bg-white p-5">
            <h2 className="text-[1.0625rem] font-semibold">Website</h2>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
              Reads the homepage once with the quick scan. It does not run the full audit.
            </p>
            <div className="mt-4">
              <ReanalyzeControl prospectId={prospect.id} />
            </div>
          </section>

          <section className="rounded-sm border border-rule bg-white p-5">
            <h2 className="text-[1.0625rem] font-semibold">
              {suppressed ? "Opt-out" : "Suppress this prospect"}
            </h2>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
              {suppressed
                ? "Recorded as an opt-out. This is separate from the pipeline status."
                : "Records that the business asked not to be contacted. Separate from marking them Not a Fit, which is your own judgement."}
            </p>
            <div className="mt-4">
              <SuppressionControl prospectId={prospect.id} suppressed={suppressed} />
            </div>
          </section>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-[1.0625rem] font-semibold">
          Website history{" "}
          <span className="font-mono text-micro font-normal text-faint">{audits.length}</span>
        </h2>
        {audits.length === 0 ? (
          <Empty>No stored website reports for this prospect.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-rule bg-white">
            <table className="w-full min-w-[34rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-rule">
                  {["Report", "Kind", "State", "Run", ""].map((h) => (
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
                    <td className="px-4 py-3 text-[0.875rem] text-muted">
                      {a.auditVersion === "quick-v1" ? "Quick scan" : "Full audit"}
                    </td>
                    <td className="px-4 py-3">
                      <Status value={a.status} />
                    </td>
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

function Fact({
  label,
  value,
  mono,
  href,
}: {
  label: string;
  value: string;
  mono?: boolean;
  href?: string;
}) {
  return (
    <div>
      <dt className="font-mono text-micro text-faint">{label}</dt>
      <dd className={`mt-1 break-all text-graphite ${mono ? "font-mono text-[0.8125rem]" : ""}`}>
        {value ? (
          href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-rule-strong underline-offset-4 hover:decoration-accent"
            >
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-faint">—</span>
        )}
      </dd>
    </div>
  );
}
