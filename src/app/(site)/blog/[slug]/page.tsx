import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/sections/page-header";
import { ClosingCta } from "@/components/sections/cta-band";
import { Section } from "@/components/ui/section";
import { getDb, posts } from "@/db";
import { getPostBySlug, withRetry } from "@/lib/queries";
import { renderMarkdown, excerptFrom } from "@/lib/markdown";
import { site } from "@/lib/site";
import { jsonLd, breadcrumbSchema } from "@/lib/structured-data";

/**
 * Only published posts exist here.
 *
 * generateStaticParams lists published slugs, and dynamicParams is false, so a
 * draft cannot be reached by guessing its URL — it is a 404 rather than a page
 * that happens to be empty.
 */
export async function generateStaticParams() {
  const rows = await withRetry(() =>
    getDb().select({ slug: posts.slug }).from(posts).where(eq(posts.status, "published")),
  );
  return rows.map((r) => ({ slug: r.slug }));
}

export const dynamicParams = false;
export const revalidate = 3600;

const when = (d: Date | null) =>
  d
    ? new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" }).format(d)
    : "";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  // Every field falls back to something derived from the post, so an author
  // who fills in none of the SEO boxes still gets sensible metadata.
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || excerptFrom(post.body, 155);
  const image = post.ogImage || post.coverUrl;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${site.url}/blog/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const html = renderMarkdown(post.body);

  return (
    <>
      {jsonLd([
        {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt || excerptFrom(post.body, 155),
          datePublished: post.publishedAt?.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          url: `${site.url}/blog/${post.slug}`,
          publisher: { "@type": "Organization", name: site.name, url: site.url },
        },
        breadcrumbSchema([
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ]),
      ])}

      <PageHeader
        meta={when(post.publishedAt)}
        title={post.title}
        dek={post.excerpt || undefined}
        trail={[{ name: "Blog", path: "/blog" }]}
      />

      <Section ground="paper" size="lg" labelledBy="post-body">
        <h2 id="post-body" className="sr-only">
          {post.title}
        </h2>
        <div className="grid md:grid-cols-12">
          <div className="md:col-span-8 md:col-start-3">
            {/*
              A plain <img>, not next/image.
              Cover URLs are typed into the admin and can point at any host.
              next/image rejects a host that is not in remotePatterns and takes
              the whole page down with it, so an editor pasting an Unsplash
              link would 500 the post rather than show a picture. The
              aspect-ratio box keeps layout shift at zero either way.
            */}
            {post.coverUrl ? (
              <figure className="mb-10">
                <div className="relative aspect-[16/9] overflow-hidden border border-rule bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
              </figure>
            ) : null}

            {/* The HTML comes from renderMarkdown, which escapes author text
                before emitting any tag and only ever produces tags it chose.
                Nothing here is author-supplied markup. */}
            <div className="prose-post" dangerouslySetInnerHTML={{ __html: html }} />

            <p className="mt-12 border-t border-rule pt-6">
              <Link
                href="/blog"
                className="text-[0.9375rem] font-medium text-graphite underline decoration-rule-strong underline-offset-[6px] transition-colors hover:decoration-accent"
              >
                All posts
              </Link>
            </p>
          </div>
        </div>
      </Section>

      <ClosingCta />
    </>
  );
}
