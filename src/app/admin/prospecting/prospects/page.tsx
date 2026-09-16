import Link from "next/link";
import { requireCapability } from "@/lib/auth/guard";
import { listProspects } from "@/lib/prospecting/prospects";
import type { Opportunity } from "@/lib/prospecting/types";
import { withRetry } from "@/lib/queries";
import { Empty, PageTitle, Status, when } from "@/components/admin/ui";
import { QueueActions } from "@/components/admin/prospecting/queue-actions";

export const metadata = { title: "Prospects" };

/**
 * `runQueueNow`, a server action invoked from this page, runs real audits
 * inline via `drainAuditQueue` (bounded to a 45s budget). 60 leaves clear
 * headroom, matching the comment on the audit pages that do the same thing.
 */
export const maxDuration = 60;

const STATUSES = ["new", "queued", "audited", "suppressed"];
const OPPORTUNITIES: Opportunity[] = [
  "Website Improvement",
  "Website Rebuild",
  "SEO",
  "Automation",
  "E-commerce",
  "API / Integration",
  "Custom Software",
  "Build Audit",
];

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    opportunity?: string;
    country?: string;
    industry?: string;
  }>;
}) {
  await requireCapability("prospecting.manage", "/admin/prospecting/prospects");
  const sp = await searchParams;
  const filter = {
    status: sp.status,
    opportunity: sp.opportunity,
    // `country` is stored as an upper-case ISO code and matched with `eq`, and
    // the input's `uppercase` class only restyles the glyphs — the form still
    // submits what was typed. Without this, "au" matches nothing and the empty
    // result is indistinguishable from having no Australian prospects.
    country: sp.country?.toUpperCase(),
    industry: sp.industry,
  };
  const filtered = Boolean(sp.status || sp.opportunity || sp.country || sp.industry);

  const rows = await withRetry(() => listProspects(filter));

  const href = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...filter, ...patch };
    for (const [key, value] of Object.entries(merged)) if (value) params.set(key, value);
    const query = params.toString();
    return `/admin/prospecting/prospects${query ? `?${query}` : ""}`;
  };

  return (
    <>
      <PageTitle
        title="Prospects"
        count={`${rows.length} ${rows.length === 1 ? "prospect" : "prospects"}${
          filtered ? " matching" : ""
        }${rows.length === 200 ? " — showing the top 200 by score" : ""}`}
        action={<QueueActions />}
      />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        <FilterField label="Country">
          <input
            type="text"
            name="country"
            defaultValue={filter.country ?? ""}
            placeholder="AU"
            maxLength={2}
            className="w-20 rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] uppercase focus:border-ink focus:outline-none"
          />
        </FilterField>
        <FilterField label="Industry">
          <input
            type="text"
            name="industry"
            defaultValue={sp.industry ?? ""}
            placeholder="e.g. Accounting"
            className="rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] focus:border-ink focus:outline-none"
          />
        </FilterField>
        <FilterField label="Opportunity">
          <select
            name="opportunity"
            defaultValue={sp.opportunity ?? ""}
            className="rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] focus:border-ink focus:outline-none"
          >
            <option value="">All</option>
            {OPPORTUNITIES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </FilterField>
        {sp.status ? <input type="hidden" name="status" value={sp.status} /> : null}
        <button
          type="submit"
          className="rounded-sm border border-rule-strong bg-white px-4 py-2 text-[0.875rem] font-medium hover:bg-black/[0.04]"
        >
          Filter
        </button>
      </form>

      <div className="mb-5 flex flex-wrap gap-1.5">
        <FilterChip href={href({ status: undefined })} active={!sp.status}>
          All
        </FilterChip>
        {STATUSES.map((s) => (
          <FilterChip key={s} href={href({ status: s })} active={sp.status === s}>
            {s}
          </FilterChip>
        ))}
      </div>

      {rows.length === 0 ? (
        <Empty>
          {filtered
            ? "No prospects match that filter."
            : "No prospects yet. Import a CSV to get started."}
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-rule bg-white">
          <table className="w-full min-w-[56rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule">
                {["Company", "Domain", "Industry", "Location", "Status", "Score", "Last audited", ""].map(
                  (h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-4 py-2.5 font-mono text-micro font-normal text-faint"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-rule last:border-b-0">
                  <td className="px-4 py-3 text-[0.9375rem] font-medium">
                    <Link href={`/admin/prospecting/prospects/${r.id}`} className="hover:underline">
                      {r.companyName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">
                    <a
                      href={r.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-rule-strong underline-offset-4 hover:decoration-accent"
                    >
                      {r.domain}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">{r.industry || "—"}</td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">
                    {[r.location, r.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Status value={r.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-[0.875rem] text-graphite">{r.totalScore}</td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">{when(r.lastAuditedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/prospecting/prospects/${r.id}`}
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
    </>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[0.8125rem] text-muted">
      {label}
      {children}
    </label>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded-sm px-2.5 py-1 font-mono text-micro transition-colors ${
        active ? "bg-ink text-on-ink" : "bg-white text-muted hover:bg-black/[0.04]"
      }`}
    >
      {children}
    </Link>
  );
}
