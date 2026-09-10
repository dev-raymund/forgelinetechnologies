import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, works, posts } from "@/db/schema";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAllWorks, getAllPosts } from "@/lib/queries";
import { formatDate } from "@/lib/markdown";
import PageShell from "./page-shell";
import {
  IconBriefcase, IconPen, IconUsers, IconPlus, IconInbox,
} from "@/components/admin-icons";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [allWorks, allPosts, me] = await Promise.all([
    getAllWorks(),
    getAllPosts(),
    getCurrentUser(),
  ]);

  const admin = isAdmin(me);
  const [userRow] = admin
    ? await db.select({ n: sql<number>`count(*)::int` }).from(users)
    : [undefined];

  const liveWorks = allWorks.filter((w) => w.published).length;
  const livePosts = allPosts.filter((p) => p.published).length;
  const drafts = allPosts.length - livePosts;
  const recent = [...allPosts]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 5);

  return (
    <PageShell
      title="Dashboard"
      actions={
        <>
          <Link className="adm-btn ghost sm" href="/admin/works/new">
            <IconPlus /> Project
          </Link>
          <Link className="adm-btn sm" href="/admin/posts/new">
            <IconPlus /> Write post
          </Link>
        </>
      }
    >
      <div className="adm-head">
        <div>
          <h2>Welcome back{me?.name ? `, ${me.name.split(" ")[0]}` : ""}</h2>
          <p>Everything on the public site is managed from here.</p>
        </div>
      </div>

      <div className="adm-stats">
        <Link className="adm-stat" href="/admin/works">
          <div className="top">
            <span className="label">Projects</span>
            <span className="ico"><IconBriefcase /></span>
          </div>
          <div className="n">{allWorks.length}</div>
          <div className="foot"><b>{liveWorks} live</b> on the homepage</div>
        </Link>

        <Link className="adm-stat" href="/admin/posts">
          <div className="top">
            <span className="label">Posts</span>
            <span className="ico"><IconPen /></span>
          </div>
          <div className="n">{allPosts.length}</div>
          <div className="foot">
            <b>{livePosts} published</b>{drafts > 0 && ` · ${drafts} draft${drafts === 1 ? "" : "s"}`}
          </div>
        </Link>

        {userRow && (
          <Link className="adm-stat" href="/admin/users">
            <div className="top">
              <span className="label">Users</span>
              <span className="ico"><IconUsers /></span>
            </div>
            <div className="n">{userRow.n}</div>
            <div className="foot">with admin access</div>
          </Link>
        )}
      </div>

      <div className="adm-card">
        <div className="adm-card-head">
          <h3>Recently edited posts</h3>
          <Link className="adm-btn subtle sm" href="/admin/posts">View all</Link>
        </div>
        {recent.length === 0 ? (
          <div className="adm-empty">
            <div className="ico"><IconInbox /></div>
            <h3>No posts yet</h3>
            <p>Your first post will show up here.</p>
            <Link className="adm-btn" href="/admin/posts/new"><IconPlus /> Write a post</Link>
          </div>
        ) : (
          <div className="adm-tablewrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th className="adm-hide-sm">Status</th>
                  <th className="adm-hide-sm">Updated</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
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
                    <td className="adm-hide-sm t-sub">{formatDate(p.updatedAt)}</td>
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
