import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getPublishedPosts } from "@/lib/queries";
import { renderMarkdown, formatDate } from "@/lib/markdown";
import "../blog.css";

export const revalidate = 3600;

export async function generateStaticParams() {
  // Prebuilding post pages is an optimization, not a correctness requirement:
  // if the DB is briefly unreachable at build time, fall back to rendering
  // them on demand rather than failing the whole deploy.
  try {
    const posts = await getPublishedPosts();
    return posts.map((p) => ({ slug: p.slug }));
  } catch (err) {
    console.warn("generateStaticParams: could not reach the database, posts will render on demand.", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      images: post.coverUrl ? [post.coverUrl] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const tags = post.tags.split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <main className="blog-wrap">
      <Link className="back" href="/blog">← All posts</Link>

      <article>
        <header className="post-head">
          <h1>{post.title}</h1>
          <p className="post-meta">
            {formatDate(post.publishedAt)}
            {tags.map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </p>
          {post.coverUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img className="post-cover" src={post.coverUrl} alt={post.coverAlt || post.title} />
          )}
        </header>

        <div
          className="post-body"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
        />
      </article>
    </main>
  );
}
