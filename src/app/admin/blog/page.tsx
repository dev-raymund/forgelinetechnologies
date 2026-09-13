import Link from "next/link";
import { desc } from "drizzle-orm";
import { requireCapability } from "@/lib/auth/guard";
import { getDb, posts, users } from "@/db";
import { withRetry } from "@/lib/queries";
import { Empty, PageTitle, Status, when } from "@/components/admin/ui";
import { eq } from "drizzle-orm";

export const metadata = { title: "Blog posts" };

export default async function BlogPage() {
  await requireCapability("posts.manage", "/admin/blog");

  const rows = await withRetry(() =>
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
      .orderBy(desc(posts.updatedAt)),
  );

  return (
    <>
      <PageTitle
        title="Blog posts"
        count={`${rows.length} ${rows.length === 1 ? "post" : "posts"}`}
        action={
          <Link
            href="/admin/blog/new"
            className="rounded-sm bg-ink px-4 py-2 text-[0.875rem] font-medium text-white"
          >
            New post
          </Link>
        }
      />

      {rows.length === 0 ? (
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
              {rows.map((r) => (
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
    </>
  );
}
