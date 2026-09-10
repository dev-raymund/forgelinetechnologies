import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users, works, posts } from "@/db/schema";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { logout } from "../actions";
import AdminNav from "./nav";
import ThemeToggle from "./theme-toggle";
import { IconExternal, IconLogout } from "@/components/admin-icons";

const count = async (table: typeof works | typeof posts | typeof users) => {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(table);
  return row?.n ?? 0;
};

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  // Covers the session outliving the account: deleted or deactivated users are
  // bounced here even though their cookie still verifies in middleware.
  if (!user) redirect("/admin/login");

  const admin = isAdmin(user);
  const [nWorks, nPosts, nUsers] = await Promise.all([
    count(works),
    count(posts),
    admin ? count(users) : Promise.resolve(0),
  ]);

  const label = user.name || user.email;
  const initials = label
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <Link className="adm-side-brand" href="/admin">
          <span className="mark">F</span>
          <span className="txt">
            <b>Forgeline</b>
            <span>Admin</span>
          </span>
        </Link>

        <AdminNav
          canManageUsers={admin}
          counts={{ works: nWorks, posts: nPosts, users: nUsers }}
        />

        <div className="adm-side-foot">
          <div className="adm-user">
            <span className="adm-avatar">{initials || "?"}</span>
            <span className="meta">
              <b>{label}</b>
              <span>{admin ? "Admin" : "Editor"}</span>
            </span>
          </div>
          <div className="adm-side-actions">
            <ThemeToggle />
            <Link className="adm-btn ghost sm icon" href="/" target="_blank" title="View site">
              <IconExternal />
            </Link>
            <form action={logout}>
              <button className="adm-btn ghost sm icon" type="submit" title="Sign out">
                <IconLogout />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="adm-main">{children}</div>
    </div>
  );
}
