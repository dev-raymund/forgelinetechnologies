import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { requireCapability } from "@/lib/auth/guard";
import { getDb, posts, users } from "@/db";
import { withRetry } from "@/lib/queries";
import { PAGE_SIZE, offsetFor, pageFrom, paged } from "@/lib/admin/pagination";
import { Empty, PageTitle, Pagination, Status, when } from "@/components/admin/ui";

export const metadata = { title: "Blogs" };

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireCapability("posts.manage", "/admin/blog");
  const page = pageFrom((await searchParams).page);

  const [rows, totals] = await Promise.all([
    withRetry(() =>
      getDb()
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          status: posts.status,
          publishedAt: posts.publishedAt,
          updatedAt: posts.updatedAt,
          authorName: users.name,
          authorEmail: users.email,
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .orderBy(desc(posts.updatedAt))
        .limit(PAGE_SIZE)
        .offset(offsetFor(page)),
    ),
    withRetry(() => getDb().select({ n: count() }).from(posts)),
  ]);
  const list = paged(rows, totals[0]?.n ?? 0, page);

  return (
    <>
      <PageTitle
        title="Blogs"
        count={`${list.total} ${list.total === 1 ? "post" : "posts"}`}
        action={
          <Link
            href="/admin/blog/new"
            className="rounded-sm bg-ink px-4 py-2 text-[0.875rem] font-medium text-on-ink"
          >
            New post
          </Link>
        }
      />

      {list.rows.length === 0 ? (
        <Empty>
          No posts yet. A published post appears at /blog and in the sitemap;
          a draft appears nowhere public.
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-rule bg-white">
          <table className="w-full min-w-[44rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule">
                {["Title", "Status", "Author", "Published", "Updated", ""].map((h) => (
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
                    <Link href={`/admin/blog/${r.id}/edit`} className="hover:underline">
                      {r.title}
                    </Link>
                    <span className="block font-mono text-micro font-normal text-faint">
                      /blog/{r.slug}
                    </span>
                  </td>
                  <td className="px-4 py-3"><Status value={r.status} /></td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">
                    {r.authorName || r.authorEmail || "—"}
                  </td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">{when(r.publishedAt)}</td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">{when(r.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/blog/${r.id}/edit`}
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
        label="posts"
        href={(n) => (n === 1 ? "/admin/blog" : `/admin/blog?page=${n}`)}
      />
    </>
  );
}
