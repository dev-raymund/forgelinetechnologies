import Link from "next/link";
import { getAllPosts } from "@/lib/queries";
import { deletePost, togglePostPublished } from "../../actions";
import { formatDate } from "@/lib/markdown";
import PageShell from "../page-shell";
import { IconPlus, IconEdit, IconTrash, IconPen, IconEye, IconEyeOff } from "@/components/admin-icons";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const rows = await getAllPosts();
  const live = rows.filter((p) => p.published).length;

  return (
    <PageShell
      title="Blog"
      actions={<Link className="adm-btn sm" href="/admin/posts/new"><IconPlus /> Write post</Link>}
    >
      <div className="adm-head">
        <div>
          <h2>Posts</h2>
          <p>{rows.length} total · {live} published · {rows.length - live} draft{rows.length - live === 1 ? "" : "s"}.</p>
        </div>
      </div>

      <div className="adm-card">
        {rows.length === 0 ? (
          <div className="adm-empty">
            <div className="ico"><IconPen /></div>
            <h3>Nothing written yet</h3>
            <p>Drafts stay private until you publish them.</p>
            <Link className="adm-btn" href="/admin/posts/new"><IconPlus /> Write your first post</Link>
          </div>
        ) : (
          <div className="adm-tablewrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th className="adm-hide-sm">Status</th>
                  <th className="adm-hide-sm">Published</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link className="t-title" href={`/admin/posts/${p.id}`}>{p.title}</Link>
                      <div className="t-sub">/blog/{p.slug}</div>
                    </td>
                    <td className="adm-hide-sm">
                      <span className={`pill ${p.published ? "live" : "draft"}`}>
                        {p.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="adm-hide-sm t-sub">
                      {p.publishedAt ? formatDate(p.publishedAt) : "—"}
                    </td>
                    <td>
                      <div className="adm-actions">
                        <form action={togglePostPublished}>
                          <input type="hidden" name="id" value={p.id} />
                          <button className="adm-btn ghost sm" type="submit"
                            title={p.published ? "Unpublish" : "Publish"}>
                            {p.published ? <IconEyeOff /> : <IconEye />}
                            <span className="adm-hide-sm">{p.published ? "Unpublish" : "Publish"}</span>
                          </button>
                        </form>
                        <Link className="adm-btn ghost sm icon" href={`/admin/posts/${p.id}`} title="Edit">
                          <IconEdit />
                        </Link>
                        <form action={deletePost}>
                          <input type="hidden" name="id" value={p.id} />
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
