import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/sections/page-header";
import { PageVisual } from "@/components/sections/page-visual";
import { ClosingCta } from "@/components/sections/cta-band";
import { Section } from "@/components/ui/section";
import { Empty } from "@/components/admin/ui";
import { getPublishedPosts } from "@/lib/queries";
import { excerptFrom } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes on building and maintaining websites, web applications and the systems a business runs on.",
  alternates: { canonical: "/blog" },
};

/** Published posts reach the page within the hour without a deploy. */
export const revalidate = 3600;

const when = (d: Date | null) =>
  d
    ? new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" }).format(d)
    : "";

export default async function BlogIndex() {
  const posts = await getPublishedPosts();

  return (
    <>
      <PageHeader
        visual={<PageVisual variant="about" />}
        meta="Blog"
        title="Notes from the build"
        dek="Written when there is something worth saying about how a thing was built, or why it went the way it did. No posting schedule."
      />

      <Section ground="paper" size="lg" labelledBy="posts">
        <h2 id="posts" className="sr-only">
          Posts
        </h2>

        {posts.length === 0 ? (
          <Empty>Nothing published yet.</Empty>
        ) : (
          <ul className="grid gap-x-10 gap-y-12 md:grid-cols-2">
            {posts.map((p) => (
              <li key={p.id}>
                <article>
                  {p.coverUrl ? (
                    <Link href={`/blog/${p.slug}`} className="mb-5 block">
                      <span className="relative block aspect-[16/9] overflow-hidden border border-rule bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.coverUrl}
                          alt=""
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      </span>
                    </Link>
                  ) : null}
                  <p className="font-mono text-micro text-faint">{when(p.publishedAt)}</p>
                  <h3 className="mt-2.5 text-subtitle font-semibold text-graphite">
                    <Link
                      href={`/blog/${p.slug}`}
                      className="transition-colors hover:underline hover:decoration-accent hover:underline-offset-4"
                    >
                      {p.title}
                    </Link>
                  </h3>
                  <p className="mt-3 max-w-[54ch] text-[0.9375rem] leading-relaxed text-muted">
                    {p.excerpt || excerptFrom(p.body)}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <ClosingCta />
    </>
  );
}
