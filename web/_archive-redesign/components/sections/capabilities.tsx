import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { capabilities } from "@/lib/content";

/**
 * An editorial index, not a card grid. Each row is a hairline-separated
 * hanging-indent entry; hover/focus draws an accent rule up the left edge,
 * lifts the tech metadata to full opacity and slides the arrow. Restrained
 * on purpose — one accent, one arrow, no card lift.
 */
export default function Capabilities() {
  return (
    <section id="capabilities" className="bg-paper py-section">
      <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-end">
          <div>
            <p className="eyebrow">What we build</p>
            <h2 className="mt-6 max-w-[13ch] text-h1 font-semibold">
              Six things, done to production standard.
            </h2>
          </div>
          <p className="max-w-[46ch] text-[1.02rem] leading-relaxed lg:pb-2">
            Most engagements start with one of these and grow into the others. Nothing is
            subcontracted to a partner you never meet, and the stack is chosen for the
            problem rather than for what we felt like using.
          </p>
        </div>

        <ul className="mt-16 border-t border-line">
          {capabilities.map((c, i) => (
            <li key={c.slug} className="border-b border-line">
              <Link
                href={`/services#${c.slug}`}
                className="group relative grid items-baseline gap-x-8 gap-y-3 py-8 pl-5 transition-[background-color] duration-300 hover:bg-paper-50 md:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1.35fr)_auto] md:pr-4"
              >
                {/* accent rule — scales from the top on hover/focus */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 h-full w-px origin-top scale-y-0 bg-brand-600 transition-transform duration-300 ease-out group-hover:scale-y-100 group-focus-visible:scale-y-100"
                />
                <span className="font-mono text-[0.72rem] text-muted transition-colors duration-300 group-hover:text-brand-600">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <h3 className="text-[1.32rem] font-semibold tracking-[-0.02em] transition-transform duration-300 ease-out group-hover:translate-x-1">
                  {c.title}
                </h3>

                <p className="text-[0.95rem] leading-relaxed text-copy">{c.summary}</p>

                <span className="flex items-center gap-5">
                  <span className="hidden gap-1.5 opacity-55 transition-opacity duration-300 group-hover:opacity-100 lg:flex">
                    {c.tags.map((t) => (
                      <span
                        key={t}
                        className="border border-line px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-muted transition-all duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
