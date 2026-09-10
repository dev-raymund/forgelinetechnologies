import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Work } from "@/db";

const CATEGORY_LABEL: Record<string, string> = {
  apps: "Web application",
  ecommerce: "E-commerce",
  sites: "Website",
};

/**
 * Curated, not a billboard.
 *
 * The lead project sits in a two-column composition where the screenshot takes
 * a little over half the width — evidence beside the argument, rather than a
 * full-bleed image with the copy pushed underneath. The four supporting
 * projects run at roughly a third of that scale in a quiet 2×2.
 *
 * Only real columns from the works table are rendered. The table holds no
 * outcome metrics, so none are claimed.
 */
export default function FeaturedWork({ works }: { works: Work[] }) {
  if (works.length === 0) return null;

  const [lead, ...rest] = works;
  const secondary = rest.slice(0, 4);

  return (
    <section className="border-t border-line bg-paper-50 py-section">
      <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-4">
          <div>
            <p className="eyebrow">Selected work</p>
            <h2 className="mt-5 max-w-[16ch] text-h2 font-semibold">
              Shipped, live, and still running.
            </h2>
          </div>
          <Link
            href="/work"
            className="group inline-flex items-center gap-2 border-b border-line-strong pb-0.5 text-[0.88rem] font-medium text-ink-900 transition-colors hover:border-brand-600 hover:text-brand-600"
          >
            All 17 projects
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* ---- lead project: controlled, image ~55% of the composition ---- */}
        <article className="mt-12 group lg:mt-14">
          <Link
            href={`/work/${lead.slug}`}
            className="grid gap-7 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14"
          >
            <div className="relative aspect-[16/10] overflow-hidden rounded-[3px] border border-line bg-paper shadow-[0_1px_2px_rgba(5,8,15,0.04)]">
              {lead.imageUrl ? (
                <Image
                  src={lead.imageUrl}
                  alt={lead.imageAlt || `${lead.title} — project screenshot`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover object-top transition-transform duration-[900ms] ease-out group-hover:scale-[1.02]"
                />
              ) : null}
            </div>

            <div>
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-muted">
                Featured · {lead.badge || CATEGORY_LABEL[lead.category] || lead.category}
              </p>
              <h3 className="mt-4 text-[clamp(1.5rem,2.4vw,2rem)] font-semibold leading-[1.12] tracking-[-0.028em] transition-colors duration-300 group-hover:text-brand-600">
                {lead.title}
              </h3>
              <p className="mt-4 max-w-[46ch] text-[0.95rem] leading-relaxed">
                {lead.description}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-[0.9rem] font-medium text-ink-900 transition-colors duration-300 group-hover:text-brand-600">
                View project
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </div>
          </Link>
          {lead.liveUrl ? (
            <a
              href={lead.liveUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-flex items-center gap-1.5 text-[0.84rem] text-muted underline-offset-4 transition-colors hover:text-brand-600 hover:underline"
            >
              Visit the live site
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : null}
        </article>

        {/* ---- supporting work: quiet 2×2, roughly a third of the lead ---- */}
        {secondary.length > 0 && (
          <ul className="mt-16 grid gap-x-8 gap-y-10 border-t border-line pt-12 sm:grid-cols-2">
            {secondary.map((w) => (
              <li key={w.id}>
                <Link href={`/work/${w.slug}`} className="group grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-5">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] border border-line bg-paper">
                    {w.imageUrl ? (
                      <Image
                        src={w.imageUrl}
                        alt={w.imageAlt || `${w.title} — project screenshot`}
                        fill
                        sizes="120px"
                        className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted">
                      {w.badge || CATEGORY_LABEL[w.category] || w.category}
                    </p>
                    <h3 className="mt-2 text-[1.02rem] font-semibold leading-[1.25] tracking-[-0.018em] transition-colors duration-300 group-hover:text-brand-600">
                      {w.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-[0.86rem] leading-relaxed text-muted">
                      {w.description}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
