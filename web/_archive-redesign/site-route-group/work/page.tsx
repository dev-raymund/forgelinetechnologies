import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/site/page-hero";
import Cta from "@/components/sections/cta";
import { getPublishedWorks, countByCategory } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Work",
  description:
    "Web development portfolio — 17 live projects across web applications, e-commerce storefronts and business websites, built for clients in Australia, New Zealand, the Philippines and the US.",
  alternates: { canonical: "/work" },
};

const FILTERS = [
  { key: "all", label: "All work" },
  { key: "apps", label: "Web apps" },
  { key: "ecommerce", label: "E-commerce" },
  { key: "sites", label: "Websites" },
] as const;

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const all = await getPublishedWorks();
  const counts = countByCategory(all);

  const active = FILTERS.some((f) => f.key === category) ? category! : "all";
  const shown = active === "all" ? all : all.filter((w) => w.category === active);
  const total = all.length;

  return (
    <>
      <PageHero
        eyebrow="Work"
        title="Every project here is live."
        lede={`${total} builds across web applications, commerce and marketing sites. Presented as they are — no invented metrics, no case studies written after the fact.`}
      />

      {/* Filtering is plain links + searchParams: server-rendered, crawlable,
          and works with JavaScript disabled. */}
      <section className="border-b border-line bg-paper">
        <nav
          aria-label="Filter projects by category"
          className="mx-auto flex max-w-[76rem] flex-wrap gap-1 px-6 py-5 lg:px-8"
        >
          {FILTERS.map((f) => {
            const isActive = f.key === active;
            const count = f.key === "all" ? total : (counts[f.key] ?? 0);
            return (
              <Link
                key={f.key}
                href={f.key === "all" ? "/work" : `/work?category=${f.key}`}
                aria-current={isActive ? "true" : undefined}
                className={`inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[0.9rem] transition-colors ${
                  isActive
                    ? "bg-ink-900 text-white"
                    : "text-copy hover:bg-paper-100 hover:text-ink-900"
                }`}
              >
                {f.label}
                <span className={`font-mono text-[0.7rem] ${isActive ? "text-white/50" : "text-muted"}`}>
                  {count}
                </span>
              </Link>
            );
          })}
        </nav>
      </section>

      <section className="bg-paper py-20">
        <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
          {shown.length === 0 ? (
            <p className="py-16 text-center text-muted">No projects in this category yet.</p>
          ) : (
            <ul className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {shown.map((w) => (
                <li key={w.id}>
                  <article>
                    <Link href={`/work/${w.slug}`} className="group block">
                      <div className="relative aspect-[16/11] overflow-hidden rounded-[3px] border border-line bg-paper-100">
                        {w.imageUrl ? (
                          <Image
                            src={w.imageUrl}
                            alt={w.imageAlt || `${w.title} — project screenshot`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">
                            Image pending
                          </div>
                        )}
                      </div>
                      <p className="mt-4 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted">
                        {w.badge || w.category}
                      </p>
                      <h2 className="mt-2 text-h3 font-semibold transition-colors group-hover:text-brand-600">
                        {w.title}
                      </h2>
                    </Link>
                    <p className="mt-2 text-[0.93rem] leading-relaxed">{w.description}</p>
                    {w.liveUrl ? (
                      <a
                        href={w.liveUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-3 inline-flex items-center gap-1.5 text-[0.88rem] font-medium text-brand-600 underline-offset-4 hover:underline"
                      >
                        Visit site
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    ) : null}
                  </article>
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
