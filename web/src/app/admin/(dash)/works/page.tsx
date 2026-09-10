import Link from "next/link";
import { getAllWorks } from "@/lib/queries";
import { deleteWork } from "../../actions";
import { WORK_CATEGORIES } from "@/db/schema";
import PageShell from "../page-shell";
import { IconPlus, IconEdit, IconTrash, IconBriefcase } from "@/components/admin-icons";

export const dynamic = "force-dynamic";

const catLabel = (v: string) => WORK_CATEGORIES.find((c) => c.value === v)?.label ?? v;

export default async function WorksPage() {
  const rows = await getAllWorks();
  const live = rows.filter((w) => w.published).length;

  return (
    <PageShell
      title="Work"
      actions={
        <Link className="adm-btn sm" href="/admin/works/new"><IconPlus /> Add project</Link>
      }
    >
      <div className="adm-head">
        <div>
          <h2>Projects</h2>
          <p>
            {rows.length} total · {live} live. Filter counts on the homepage are derived
            from this list, so they can&apos;t drift.
          </p>
        </div>
      </div>

      <div className="adm-card">
        {rows.length === 0 ? (
          <div className="adm-empty">
            <div className="ico"><IconBriefcase /></div>
            <h3>No projects yet</h3>
            <p>Add your first one and it appears on the homepage grid.</p>
            <Link className="adm-btn" href="/admin/works/new"><IconPlus /> Add project</Link>
          </div>
        ) : (
          <div className="adm-tablewrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th className="adm-hide-sm">Category</th>
                  <th className="adm-hide-sm">Status</th>
                  <th className="adm-hide-sm num">Order</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <div className="adm-cell">
                        {w.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img className="adm-thumb" src={w.imageUrl} alt="" />
                        ) : (
                          <div className="adm-thumb" />
                        )}
                        <div>
                          <Link className="t-title" href={`/admin/works/${w.id}`}>{w.title}</Link>
                          <div className="t-sub">{w.badge}</div>
                        </div>
                      </div>
                    </td>
                    <td className="adm-hide-sm"><span className="pill cat">{catLabel(w.category)}</span></td>
                    <td className="adm-hide-sm">
                      <span className={`pill ${w.published ? "live" : "draft"}`}>
                        {w.published ? "Live" : "Hidden"}
                      </span>
                    </td>
                    <td className="adm-hide-sm num t-sub">{w.sortOrder}</td>
                    <td>
                      <div className="adm-actions">
                        <Link className="adm-btn ghost sm icon" href={`/admin/works/${w.id}`} title="Edit">
                          <IconEdit />
                        </Link>
                        <form action={deleteWork}>
                          <input type="hidden" name="id" value={w.id} />
                          <button className="adm-btn danger sm icon" type="submit" title="Delete">
                            <IconTrash />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}
