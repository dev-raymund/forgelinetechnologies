import { ArrowUpRight } from "lucide-react";
import { partnership } from "@/lib/content";

/**
 * States the relationship as complementary, not hierarchical: two focuses side
 * by side, neither presented as owning or subcontracting to the other. Kept to
 * one restrained band — it's useful context, not a selling point to lead with.
 */
export default function Partnership() {
  return (
    <section className="border-t border-line bg-paper py-section-tight">
      <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <div>
            <p className="eyebrow">Ecosystem</p>
            <h2 className="mt-5 max-w-[16ch] text-h3 font-semibold sm:text-[1.55rem] sm:leading-[1.2] sm:tracking-[-0.025em]">
              {partnership.heading}
            </h2>
            <p className="mt-5 max-w-[48ch] text-[0.95rem] leading-relaxed">
              {partnership.body}
            </p>
            <a
              href={partnership.url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-5 inline-flex items-center gap-1.5 text-[0.9rem] font-medium text-ink-900 underline-offset-4 transition-colors hover:text-brand-600 hover:underline"
            >
              Visit {partnership.name}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          <div className="grid gap-px self-start border border-line bg-line sm:grid-cols-2">
            {partnership.split.map((col) => (
              <div key={col.name} className="bg-paper p-6">
                <p className="font-display text-[1rem] font-semibold tracking-[-0.02em] text-ink-900">
                  {col.name}
                </p>
                <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                  {col.role}
                </p>
                <ul className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
                  {col.items.map((i) => (
                    <li key={i} className="text-[0.86rem] leading-snug text-copy">
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
