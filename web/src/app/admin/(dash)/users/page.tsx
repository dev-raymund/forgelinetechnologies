import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { requireAdminRole } from "@/lib/guards";
import { deleteUser } from "../../actions";
import { formatDate } from "@/lib/markdown";
import PageShell from "../page-shell";
import { IconPlus, IconEdit, IconTrash } from "@/components/admin-icons";

export const dynamic = "force-dynamic";

const initialsOf = (s: string) =>
  s.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

export default async function UsersPage() {
  // Editors must not reach user management, even by typing the URL.
  await requireAdminRole();
  const [rows, me] = await Promise.all([
    db.select().from(users).orderBy(asc(users.id)),
    getCurrentUser(),
  ]);
  const activeAdmins = rows.filter((u) => u.role === "admin" && u.active).length;

  return (
    <PageShell
      title="Users"
      actions={<Link className="adm-btn sm" href="/admin/users/new"><IconPlus /> Add user</Link>}
    >
      <div className="adm-head">
        <div>
          <h2>Team</h2>
          <p>
            {rows.length} account{rows.length === 1 ? "" : "s"} · {activeAdmins} active admin
            {activeAdmins === 1 ? "" : "s"}. Editors can manage work and posts, but not users.
          </p>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-tablewrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>User</th>
                <th className="adm-hide-sm">Role</th>
                <th className="adm-hide-sm">Status</th>
                <th className="adm-hide-sm">Last login</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const isSelf = u.id === me?.id;
                // Deleting either of these would strand somebody.
                const lastAdmin = u.role === "admin" && u.active && activeAdmins === 1;
                const locked = isSelf || lastAdmin;
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="adm-cell">
                        <span className="adm-avatar">{initialsOf(u.name || u.email)}</span>
                        <div>
                          <Link className="t-title" href={`/admin/users/${u.id}`}>
                            {u.name || u.email}
                          </Link>
                          <div className="t-sub">{u.email}{isSelf && " · you"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="adm-hide-sm">
                      <span className={`pill ${u.role === "admin" ? "cat" : "draft"}`}>
                        {u.role === "admin" ? "Admin" : "Editor"}
                      </span>
                    </td>
                    <td className="adm-hide-sm">
                      <span className={`pill ${u.active ? "live" : "danger"}`}>
                        {u.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="adm-hide-sm t-sub">
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : "never"}
                    </td>
                    <td>
                      <div className="adm-actions">
                        <Link className="adm-btn ghost sm icon" href={`/admin/users/${u.id}`} title="Edit">
                          <IconEdit />
                        </Link>
                        {locked ? (
                          <button className="adm-btn danger sm icon" type="button" disabled
                            title={isSelf ? "You can't delete your own account" : "The only active admin"}>
                            <IconTrash />
                          </button>
                        ) : (
                          <form action={deleteUser}>
                            <input type="hidden" name="id" value={u.id} />
                            <button className="adm-btn danger sm icon" type="submit" title="Delete">
                              <IconTrash />
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
