import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageHero from "@/components/site/page-hero";
import Cta from "@/components/sections/cta";
import { getPublishedPosts } from "@/lib/queries";
import { formatDate } from "@/lib/markdown";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes on web development from a working studio — stack decisions, performance, and what actually matters at handover.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndex() {
  const posts = await getPublishedPosts();

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Notes on building and shipping."
        lede="Occasional writing on the decisions that actually affect whether a project lands — stack choices, performance, and handover."
      />

      <section className="bg-paper py-section">
        <div className="mx-auto max-w-[52rem] px-6 lg:px-8">
          {posts.length === 0 ? (
            <p className="py-16 text-center text-muted">
              No posts published yet — check back soon.
            </p>
          ) : (
            <ul className="border-t border-line">
              {posts.map((p) => (
                <li key={p.id} className="border-b border-line">
                  <Link href={`/blog/${p.slug}`} className="group block py-8">
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">
                      {formatDate(p.publishedAt)}
                    </p>
                    <h2 className="mt-3 text-h3 font-semibold transition-colors group-hover:text-brand-600">
                      {p.title}
                    </h2>
                    {p.excerpt ? (
                      <p className="mt-2 max-w-[60ch] leading-relaxed">{p.excerpt}</p>
                    ) : null}
                    <span className="mt-3 inline-flex items-center gap-1.5 text-[0.88rem] font-medium text-brand-600">
                      Read
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Cta />
    </>
  );
}
