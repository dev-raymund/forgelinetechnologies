import { and, asc, count, eq } from "drizzle-orm";
import { requireCapability } from "@/lib/auth/guard";
import { getDb, users } from "@/db";
import { withRetry } from "@/lib/queries";
import { PAGE_SIZE, offsetFor, pageFrom, paged } from "@/lib/admin/pagination";
import { PageTitle, Pagination } from "@/components/admin/ui";
import { UserManager } from "@/components/admin/user-manager";

export const metadata = { title: "Users" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // Admin only. The nav hides this link from editors, but that is presentation
  // — this is the check that stops one reaching the page by typing the URL.
  const current = await requireCapability("users.manage", "/admin/users");

  const page = pageFrom((await searchParams).page);

  // The admin count is its own query, not a filter over this page. Counting
  // the visible slice would say "one active admin" on page two of three and
  // show a warning that is simply untrue.
  const [rows, totals, adminTotals] = await Promise.all([
    withRetry(() =>
      getDb()
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          active: users.active,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(asc(users.id))
        .limit(PAGE_SIZE)
        .offset(offsetFor(page)),
    ),
    withRetry(() => getDb().select({ n: count() }).from(users)),
    withRetry(() =>
      getDb()
        .select({ n: count() })
        .from(users)
        .where(and(eq(users.role, "admin"), eq(users.active, true))),
    ),
  ]);

  const list = paged(rows, totals[0]?.n ?? 0, page);
  const admins = adminTotals[0]?.n ?? 0;

  return (
    <>
      <PageTitle
        title="Users"
        count={`${list.total} ${list.total === 1 ? "account" : "accounts"} · ${admins} active ${admins === 1 ? "admin" : "admins"}`}
      />

      {admins === 1 ? (
        <p className="mb-5 max-w-[62ch] border-l-2 border-accent bg-white px-4 py-3 text-[0.9375rem] leading-relaxed">
          There is one active admin. If that account is lost, nobody can reach
          this page and recovery needs shell access to the setup command.
          Consider adding a second.
        </p>
      ) : null}

      <UserManager users={list.rows} currentUserId={current.id} />

      <Pagination
        page={list.page}
        pages={list.pages}
        total={list.total}
        label="accounts"
        href={(n) => (n === 1 ? "/admin/users" : `/admin/users?page=${n}`)}
      />
    </>
  );
}
