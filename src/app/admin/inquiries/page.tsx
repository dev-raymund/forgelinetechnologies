import Link from "next/link";
import { requireCapability } from "@/lib/auth/guard";
import {
  INQUIRY_STATUSES,
  listInquiries,
  inquiryStatusCounts,
} from "@/lib/admin/inquiries";
import { Empty, PageTitle, Status, when } from "@/components/admin/ui";

export const metadata = { title: "Inquiries" };

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireCapability("inquiries.manage", "/admin/inquiries");
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;

  const [{ rows, total, pages }, counts] = await Promise.all([
    listInquiries({ q: sp.q, status: sp.status, page }),
    inquiryStatusCounts(),
  ]);

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q: sp.q, status: sp.status, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/inquiries${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageTitle
        title="Inquiries"
        count={`${total} ${total === 1 ? "enquiry" : "enquiries"}${sp.q || sp.status ? " matching" : ""}`}
      />

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search name, email, company or message"
          aria-label="Search inquiries"
          className="min-w-0 flex-1 rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.9375rem] focus:border-ink focus:outline-none"
        />
        {sp.status ? (
          <input type="hidden" name="status" value={sp.status} />
        ) : null}
        <button
          type="submit"
          className="rounded-sm border border-rule-strong bg-white px-4 py-2 text-[0.9375rem] font-medium hover:bg-black/[0.04]"
        >
          Search
        </button>
      </form>

      <div className="mb-5 flex flex-wrap gap-1.5">
        <FilterChip href={href({ status: undefined, page: undefined })} active={!sp.status}>
          All {total && !sp.q ? `(${Object.values(counts).reduce((a, b) => a + b, 0)})` : ""}
        </FilterChip>
        {INQUIRY_STATUSES.map((s) => (
          <FilterChip
            key={s}
            href={href({ status: s, page: undefined })}
            active={sp.status === s}
          >
            {s} {counts[s] ? `(${counts[s]})` : ""}
          </FilterChip>
        ))}
      </div>

      {rows.length === 0 ? (
        <Empty>
          {sp.q || sp.status
            ? "No enquiries match that filter."
            : "No enquiries yet. They arrive here from the contact form."}
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-rule bg-white">
          <table className="w-full min-w-[44rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule">
                {["Name", "Company", "Project", "Status", "Received", ""].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-2.5 font-mono text-micro font-normal text-faint"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-rule last:border-b-0">
                  <td className="px-4 py-3 text-[0.9375rem] font-medium">
                    <Link href={`/admin/inquiries/${r.id}`} className="hover:underline">
                      {r.name}
                    </Link>
                    <span className="block text-[0.8125rem] font-normal text-faint">
                      {r.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[0.9375rem] text-muted">{r.company || "—"}</td>
                  <td className="px-4 py-3 text-[0.9375rem] text-muted">{r.projectType || "—"}</td>
                  <td className="px-4 py-3"><Status value={r.status} /></td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">{when(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/inquiries/${r.id}`}
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

      {pages > 1 ? (
        <nav aria-label="Pagination" className="mt-5 flex items-center gap-3">
          {page > 1 ? (
            <Link href={href({ page: String(page - 1) })} className="text-[0.9375rem] underline">
              Previous
            </Link>
          ) : null}
          <span className="font-mono text-micro text-faint">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={href({ page: String(page + 1) })} className="text-[0.9375rem] underline">
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
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
