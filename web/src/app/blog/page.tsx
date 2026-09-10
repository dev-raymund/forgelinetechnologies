import type { Metadata } from "next";
import { openGraph } from "@/lib/metadata";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/queries";
import { formatDate } from "@/lib/markdown";
import "../site.css";
import "./blog.css";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on building, shipping, and keeping websites fast.",
  alternates: { canonical: "/blog" },
  openGraph: openGraph({
    url: "/blog",
    title: "Blog — Forgeline Technologies",
    description: "Notes on building, shipping, and keeping websites fast.",
  }),
};

export default async function BlogIndex() {
  const posts = await getPublishedPosts();

  return (
    <main className="blog-wrap">
      <Link className="back" href="/">← Forgeline Technologies</Link>

      <div className="blog-index-head">
        <h1>Blog</h1>
        <p>Notes on building, shipping, and keeping websites fast.</p>
      </div>

      {posts.length === 0 ? (
        <p className="blog-empty">No posts published yet — check back soon.</p>
      ) : (
        <div className="post-list">
          {posts.map((p) => (
            <Link key={p.id} className="post-row" href={`/blog/${p.slug}`}>
              <span className="when">{formatDate(p.publishedAt)}</span>
              <h2>{p.title}</h2>
              {p.excerpt && <p>{p.excerpt}</p>}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
