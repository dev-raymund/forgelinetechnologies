import Link from "next/link";
import { asc, count, desc } from "drizzle-orm";
import { requireCapability } from "@/lib/auth/guard";
import { getDb, projects } from "@/db";
import { withRetry } from "@/lib/queries";
import { PAGE_SIZE, offsetFor, pageFrom, paged } from "@/lib/admin/pagination";
import { Empty, PageTitle, Pagination, Status, when } from "@/components/admin/ui";

export const metadata = { title: "Works" };

export default async function WorksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireCapability("works.manage", "/admin/works");
  const page = pageFrom((await searchParams).page);

  const [rows, totals] = await Promise.all([
    withRetry(() =>
      getDb()
        .select({
          id: projects.id,
          title: projects.title,
          slug: projects.slug,
          kind: projects.kind,
          status: projects.status,
          featured: projects.featured,
          liveUrl: projects.liveUrl,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .orderBy(asc(projects.sortOrder), desc(projects.updatedAt))
        .limit(PAGE_SIZE)
        .offset(offsetFor(page)),
    ),
    withRetry(() => getDb().select({ n: count() }).from(projects)),
  ]);
  const list = paged(rows, totals[0]?.n ?? 0, page);

  return (
    <>
      <PageTitle
        title="Works"
        count={`${list.total} ${list.total === 1 ? "project" : "projects"}`}
        action={
          <Link
            href="/admin/works/new"
            className="rounded-sm bg-ink px-4 py-2 text-[0.875rem] font-medium text-on-ink"
          >
            New project
          </Link>
        }
      />

      {list.rows.length === 0 ? (
        <Empty>No projects yet.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-rule bg-white">
          <table className="w-full min-w-[48rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule">
                {["Project", "Category", "Status", "Featured", "Live site", "Updated", ""].map((h) => (
                  <th key={h} scope="col" className="px-4 py-2.5 font-mono text-micro font-normal text-faint">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.rows.map((r) => (
                <tr key={r.id} className="border-b border-rule last:border-b-0">
                  <td className="px-4 py-3 text-[0.9375rem] font-medium">
                    <Link href={`/admin/works/${r.id}/edit`} className="hover:underline">
                      {r.title}
                    </Link>
                    <span className="block font-mono text-micro font-normal text-faint">
                      /work/{r.slug}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[0.9375rem] text-muted">{r.kind}</td>
                  <td className="px-4 py-3"><Status value={r.status} /></td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">
                    {r.featured ? "Yes" : "—"}
                  </td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">
                    {r.liveUrl ? (
                      <a
                        href={r.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-rule-strong underline-offset-4"
                      >
                        Visit
                      </a>
                    ) : (
                      // Not a gap in the data — some sites are genuinely gone.
                      <span title="No reachable live site">none</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">{when(r.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/works/${r.id}/edit`}
                      className="text-[0.875rem] font-medium underline decoration-rule-strong underline-offset-4 hover:decoration-accent"
                    >
                      Edit
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
        label="projects"
        href={(n) => (n === 1 ? "/admin/works" : `/admin/works?page=${n}`)}
      />
    </>
  );
}
