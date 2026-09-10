import Link from "next/link";
import type { Post } from "@/db/schema";
import { formatDate } from "@/lib/markdown";

/** Renders nothing until there is at least one published post. */
export default function BlogTeaser({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="wrap band wv-white wv-alt" id="blog">
      <div className="sec-head">
        <p className="kicker">Writing</p>
        <h2>
          From the <span className="grad-text">blog</span>
        </h2>
        <p className="sub">Notes on building, shipping, and keeping sites fast.</p>
        <Link className="sec-cta" href="/blog">
          Read all posts
          <svg viewBox="0 0 24 24">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>

      <div className="work-grid">
        {posts.map((p) => (
          <article key={p.id} className="work-card surface">
            {p.coverUrl && (
              <div className="thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img loading="lazy" src={p.coverUrl} alt={p.coverAlt || p.title} />
              </div>
            )}
            <div className="work-body">
              <span className="badge-tech">{formatDate(p.publishedAt)}</span>
              <h3>
                <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              </h3>
              {p.excerpt && <p>{p.excerpt}</p>}
              <p className="links">
                <Link href={`/blog/${p.slug}`}>Read post →</Link>
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
