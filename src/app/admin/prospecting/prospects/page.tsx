import Link from "next/link";
import { requireCapability } from "@/lib/auth/guard";
import { listProspectRows, pipelineCounts } from "@/lib/prospecting/prospect-store";
import { OPPORTUNITY_VALUES, PROSPECT_STATUSES } from "@/lib/prospecting/types";
import { withRetry } from "@/lib/queries";
import { pageFrom } from "@/lib/admin/pagination";
import { Empty, PageTitle, Pagination, Status, when } from "@/components/admin/ui";

export const metadata = { title: "Prospects" };

/**
 * The pipeline.
 *
 * Answers one question: who am I contacting, what am I offering, and where are
 * they up to. No score, no band, no qualification breakdown — those belonged
 * to the retired model and are not read here at all.
 */
export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; opportunity?: string; page?: string }>;
}) {
  await requireCapability("prospecting.manage", "/admin/prospecting/prospects");
  const sp = await searchParams;
  const page = pageFrom(sp.page);
  const filter = { search: sp.q, status: sp.status, opportunity: sp.opportunity, page };
  const filtered = Boolean(sp.q || sp.status || sp.opportunity);

  const [list, counts] = await Promise.all([
    withRetry(() => listProspectRows(filter)),
    withRetry(() => pipelineCounts()),
  ]);
  const rows = list.rows;

  return (
    <>
      <PageTitle
        title="Prospects"
        count={`${list.total} ${list.total === 1 ? "prospect" : "prospects"}${filtered ? " matching" : ""}`}
        action={
          <Link
            href="/admin/prospecting/audit"
            className="rounded-sm bg-accent px-4 py-2 text-[0.875rem] font-medium text-white transition-colors hover:bg-accent-deep"
          >
            New prospect
          </Link>
        }
      />

      {/* Counts only. No rates, no conversion percentages, no win rate. */}
      <div className="mb-6 flex flex-wrap gap-2">
        {PROSPECT_STATUSES.slice(0, 6).map((status) => (
          <Link
            key={status}
            href={`/admin/prospecting/prospects?status=${encodeURIComponent(status)}`}
            className={`rounded-sm border px-3 py-2 text-[0.8125rem] transition-colors ${
              sp.status === status ? "border-ink bg-ink text-on-ink" : "border-rule bg-white hover:border-rule-strong"
            }`}
          >
            {status}
            <span className="ml-2 font-mono text-micro opacity-70">{counts[status] ?? 0}</span>
          </Link>
        ))}
      </div>

      <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[0.8125rem] text-muted">
          Search
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Company or domain"
            className="w-56 rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] focus:border-ink focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-[0.8125rem] text-muted">
          Status
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] focus:border-ink focus:outline-none"
          >
            <option value="">All</option>
            {PROSPECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[0.8125rem] text-muted">
          Opportunity
          <select
            name="opportunity"
            defaultValue={sp.opportunity ?? ""}
            className="rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] focus:border-ink focus:outline-none"
          >
            <option value="">All</option>
            {OPPORTUNITY_VALUES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-sm border border-rule-strong bg-white px-4 py-2 text-[0.875rem] font-medium hover:bg-black/[0.04]"
        >
          Filter
        </button>
        {filtered ? (
          <Link
            href="/admin/prospecting/prospects"
            className="py-2 text-[0.875rem] text-muted underline decoration-rule-strong underline-offset-4"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {rows.length === 0 ? (
        <Empty>
          {filtered ? (
            "No prospects match your filters."
          ) : (
            <>
              No prospects yet.{" "}
              <Link href="/admin/prospecting/audit" className="underline decoration-rule-strong underline-offset-4">
                Analyze a website
              </Link>{" "}
              to add your first prospect.
            </>
          )}
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-rule bg-white">
          <table className="w-full min-w-[56rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule">
                {["Company", "Website", "Opportunity", "Service", "Status", "Updated", ""].map((h) => (
                  <th key={h} scope="col" className="px-4 py-2.5 font-mono text-micro font-normal text-faint">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-rule last:border-b-0">
                  <td className="px-4 py-3 text-[0.9375rem] font-medium">
                    <Link href={`/admin/prospecting/prospects/${row.id}`} className="hover:underline">
                      {row.companyName}
                    </Link>
                    {row.suppressedAt ? (
                      <span className="ml-2 font-mono text-micro text-muted">suppressed</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">
                    <a
                      href={row.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-rule-strong underline-offset-4 hover:decoration-accent"
                    >
                      {row.domain}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-[0.875rem] text-graphite">
                    {row.opportunity || <span className="text-faint">Not analyzed</span>}
                  </td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">{row.service || "—"}</td>
                  <td className="px-4 py-3">
                    <Status value={row.status} />
                  </td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">{when(row.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/prospecting/prospects/${row.id}`}
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

      <Pagination
        page={list.page}
        pages={list.pages}
        total={list.total}
        label="prospects"
        href={(n) => {
          const p = new URLSearchParams();
          for (const [k, v] of Object.entries({ q: sp.q, status: sp.status, opportunity: sp.opportunity })) {
            if (v) p.set(k, v);
          }
          if (n > 1) p.set("page", String(n));
          const s = p.toString();
          return `/admin/prospecting/prospects${s ? `?${s}` : ""}`;
        }}
      />
    </>
  );
}
