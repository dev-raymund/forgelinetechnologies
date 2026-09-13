import { asc } from "drizzle-orm";
import { requireCapability } from "@/lib/auth/guard";
import { getDb, users } from "@/db";
import { withRetry } from "@/lib/queries";
import { PageTitle } from "@/components/admin/ui";
import { UserManager } from "@/components/admin/user-manager";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  // Admin only. The nav hides this link from editors, but that is presentation
  // — this is the check that stops one reaching the page by typing the URL.
  const current = await requireCapability("users.manage", "/admin/users");

  const rows = await withRetry(() =>
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
      .orderBy(asc(users.id)),
  );

  const admins = rows.filter((u) => u.role === "admin" && u.active).length;

  return (
    <>
      <PageTitle
        title="Users"
        count={`${rows.length} ${rows.length === 1 ? "account" : "accounts"} · ${admins} active ${admins === 1 ? "admin" : "admins"}`}
      />

      {admins === 1 ? (
        <p className="mb-5 max-w-[62ch] border-l-2 border-accent bg-white px-4 py-3 text-[0.9375rem] leading-relaxed">
          There is one active admin. If that account is lost, nobody can reach
          this page and recovery needs shell access to the setup command.
          Consider adding a second.
        </p>
      ) : null}

      <UserManager users={rows} currentUserId={current.id} />
    </>
  );
}
