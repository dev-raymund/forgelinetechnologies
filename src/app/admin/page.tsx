import Link from "next/link";
import { requireUser, roleHas } from "@/lib/auth/guard";
import {
  getDashboardStats,
  getRecentInquiries,
  getRecentReviews,
  getRecentPosts,
} from "@/lib/admin/stats";
import { Card, Empty, PageTitle, Status, when } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await requireUser("/admin");
  const { denied } = await searchParams;

  const [stats, recentInquiries, recentReviews, recentPosts] = await Promise.all([
    getDashboardStats(),
    getRecentInquiries(),
    getRecentReviews(),
    getRecentPosts(),
  ]);

  return (
    <>
      <PageTitle
        title={`Good to see you, ${(user.name || user.email).split(" ")[0]}`}
        count={`Signed in as ${user.email}`}
      />

      {denied ? (
        <p
          role="alert"
          className="mb-6 border-l-2 border-accent bg-white px-4 py-3 text-[0.9375rem] text-graphite"
        >
          You do not have access to that section.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="New inquiries" value={stats.inquiriesNew} href="/admin/inquiries" emphasis />
        <Card label="Total inquiries" value={stats.inquiriesTotal} href="/admin/inquiries" />
        <Card label="Pending reviews" value={stats.reviewsPending} href="/admin/reviews" emphasis />
        <Card label="Published reviews" value={stats.reviewsPublished} href="/admin/reviews" />
        <Card label="Published posts" value={stats.postsPublished} href="/admin/blog" />
        <Card label="Draft posts" value={stats.postsDraft} href="/admin/blog" />
        <Card label="Works" value={stats.worksTotal} href="/admin/works" />
        {roleHas(user.role, "users.manage") ? (
          <Card label="Active users" value={stats.usersActive} href="/admin/users" />
        ) : (
          <Card label="Active users" value={stats.usersActive} />
        )}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="recent-inquiries">
          <h2 id="recent-inquiries" className="mb-3 text-[1.0625rem] font-semibold">
            Latest inquiries
          </h2>
          {recentInquiries.length === 0 ? (
            <Empty>No enquiries yet.</Empty>
          ) : (
            <ul className="rounded-sm border border-rule bg-white">
              {recentInquiries.map((i) => (
                <li key={i.id} className="border-b border-rule last:border-b-0">
                  <Link
                    href={`/admin/inquiries/${i.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-black/[0.02]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[0.9375rem] font-medium">
                        {i.name}
                        {i.company ? (
                          <span className="font-normal text-muted"> · {i.company}</span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-[0.8125rem] text-faint">
                        {i.projectType || "No category"} · {when(i.createdAt)}
                      </span>
                    </span>
                    <Status value={i.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-reviews">
          <h2 id="recent-reviews" className="mb-3 text-[1.0625rem] font-semibold">
            Latest reviews
          </h2>
          {recentReviews.length === 0 ? (
            <Empty>No reviews submitted yet.</Empty>
          ) : (
            <ul className="rounded-sm border border-rule bg-white">
              {recentReviews.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3 last:border-b-0"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[0.9375rem] font-medium">
                      {r.name}
                      {r.company ? (
                        <span className="font-normal text-muted"> · {r.company}</span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[0.8125rem] text-faint">
                      {r.rating}/5 · {when(r.createdAt)}
                    </span>
                  </span>
                  <Status value={r.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-posts" className="lg:col-span-2">
          <h2 id="recent-posts" className="mb-3 text-[1.0625rem] font-semibold">
            Latest blog posts
          </h2>
          {recentPosts.length === 0 ? (
            <Empty>No posts yet.</Empty>
          ) : (
            <ul className="rounded-sm border border-rule bg-white">
              {recentPosts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3 last:border-b-0"
                >
                  <span className="truncate text-[0.9375rem] font-medium">{p.title}</span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-[0.8125rem] text-faint">{when(p.updatedAt)}</span>
                    <Status value={p.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
