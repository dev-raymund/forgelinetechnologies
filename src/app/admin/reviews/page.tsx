import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { requireCapability, roleHas } from "@/lib/auth/guard";
import { getDb, reviews, projects } from "@/db";
import { withRetry } from "@/lib/queries";
import { Empty, PageTitle, Status, when } from "@/components/admin/ui";
import { ReviewControls } from "@/components/admin/review-controls";

export const metadata = { title: "Reviews" };

const STATUSES = ["pending", "approved", "published", "rejected"] as const;

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireCapability("reviews.manage", "/admin/reviews");
  const { status } = await searchParams;
  const filter = (STATUSES as readonly string[]).includes(status ?? "") ? status : undefined;

  const [rows, counts] = await Promise.all([
    withRetry(() =>
      getDb()
        .select({
          id: reviews.id,
          name: reviews.name,
          company: reviews.company,
          email: reviews.email,
          rating: reviews.rating,
          body: reviews.body,
          status: reviews.status,
          permissionToPublish: reviews.permissionToPublish,
          createdAt: reviews.createdAt,
          projectTitle: projects.title,
        })
        .from(reviews)
        .leftJoin(projects, eq(reviews.projectId, projects.id))
        .where(filter ? eq(reviews.status, filter) : undefined)
        .orderBy(desc(reviews.createdAt)),
    ),
    withRetry(() =>
      getDb().select({ status: reviews.status, n: count() }).from(reviews).groupBy(reviews.status),
    ),
  ]);

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.n]));
  const total = counts.reduce((a, c) => a + c.n, 0);

  return (
    <>
      <PageTitle
        title="Reviews"
        count={`${total} submitted · ${byStatus.published ?? 0} published`}
        action={
          <Link
            href="/review"
            className="text-[0.875rem] font-medium underline decoration-rule-strong underline-offset-4"
          >
            View the public form
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        <Chip href="/admin/reviews" active={!filter}>
          All {total ? `(${total})` : ""}
        </Chip>
        {STATUSES.map((s) => (
          <Chip key={s} href={`/admin/reviews?status=${s}`} active={filter === s}>
            {s} {byStatus[s] ? `(${byStatus[s]})` : ""}
          </Chip>
        ))}
      </div>

      {rows.length === 0 ? (
        <Empty>
          {filter
            ? `No ${filter} reviews.`
            : "No reviews yet. Send a client to /review and they will arrive here as pending."}
        </Empty>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-sm border border-rule bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[1.0625rem] font-semibold text-graphite">
                    {r.name}
                    {r.company ? (
                      <span className="font-normal text-muted"> · {r.company}</span>
                    ) : null}
                  </p>
                  <p className="mt-1 font-mono text-micro text-faint">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)} · {r.projectTitle ?? "No project"} ·{" "}
                    {when(r.createdAt)}
                  </p>
                </div>
                <Status value={r.status} />
              </div>

              <p className="mt-4 max-w-[74ch] whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-graphite">
                {r.body}
              </p>

              <p className="mt-3 font-mono text-micro text-faint">
                {r.email} ·{" "}
                {r.permissionToPublish
                  ? "permission given"
                  : "NO PERMISSION TO PUBLISH"}
              </p>

              <ReviewControls
                id={r.id}
                status={r.status}
                name={r.name}
                company={r.company}
                body={r.body}
                permissionToPublish={r.permissionToPublish}
                canDelete={roleHas(user.role, "users.manage")}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Chip({
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
        active ? "bg-ink text-white" : "bg-white text-muted hover:bg-black/[0.04]"
      }`}
    >
      {children}
    </Link>
  );
}
