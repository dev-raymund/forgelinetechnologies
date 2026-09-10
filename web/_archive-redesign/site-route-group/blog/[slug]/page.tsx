import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Cta from "@/components/sections/cta";
import { getPostBySlug, getPublishedPosts } from "@/lib/queries";
import { renderMarkdown, formatDate } from "@/lib/markdown";

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
    alternates: { canonical: `/blog/${post.slug}` },
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
    <>
      <section className="on-dark bg-ink-950 pt-32 pb-14 text-white/65 lg:pt-40">
        <div className="mx-auto max-w-[52rem] px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            All posts
          </Link>
          <h1 className="mt-7 text-h1 font-semibold text-white">{post.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <time className="font-mono text-[0.72rem] uppercase tracking-[0.12em] text-white/45">
              {formatDate(post.publishedAt)}
            </time>
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-[2px] border border-white/20 px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-white/70"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <article className="bg-paper pb-section pt-14">
        <div className="mx-auto max-w-[52rem] px-6 lg:px-8">
          {post.coverUrl ? (
            <div className="relative mb-12 aspect-[16/9] overflow-hidden rounded-[3px] border border-line bg-paper-100">
              <Image
                src={post.coverUrl}
                alt={post.coverAlt || post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 52rem"
                className="object-cover"
              />
            </div>
          ) : null}

          {/* Bodies are authored only by signed-in admins — see lib/markdown.ts */}
          <div
            className="prose-forge"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
          />
        </div>
      </article>

      <Cta />
    </>
  );
}
