import type { Metadata } from "next";
import { Check, ArrowRight } from "lucide-react";
import PageHero from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import Process from "@/components/sections/process";
import Tech from "@/components/sections/tech";
import Partnership from "@/components/sections/partnership";
import Faq from "@/components/sections/faq";
import Cta from "@/components/sections/cta";
import { capabilities, engagements, smallerPieces, fixedPrice } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Web development, web applications, e-commerce, API integrations and custom software — scoped at a fixed price. Engagements from $150/month care plans to $4,000+ product builds.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="What we build, and how you buy it."
        lede="Two things worth separating: the kind of work, and the shape of the commitment. Pricing is fixed and published — you shouldn't have to book a call to find out roughly what something costs."
      />

      {/* capabilities — what it is, who needs it, what you get */}
      <section className="bg-paper py-section">
        <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
          <p className="eyebrow">Capabilities</p>
          <ul className="mt-10 border-t border-line">
            {capabilities.map((c, i) => (
              <li
                key={c.slug}
                id={c.slug}
                className="scroll-mt-28 border-b border-line py-9"
              >
                <div className="grid gap-x-10 gap-y-5 lg:grid-cols-[3rem_minmax(0,1.15fr)_minmax(0,1fr)]">
                  <span className="font-mono text-[0.72rem] text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div>
                    <h2 className="text-[1.32rem] font-semibold tracking-[-0.022em]">
                      {c.title}
                    </h2>
                    <p className="mt-3 max-w-[52ch] text-[0.95rem] leading-relaxed">
                      {c.summary}
                    </p>
                    <p className="mt-4 max-w-[52ch] text-[0.88rem] leading-relaxed text-muted">
                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-800">
                        Who it&rsquo;s for ·{" "}
                      </span>
                      {c.who}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className="border border-line px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-muted"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="lg:border-l lg:border-line lg:pl-8">
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                      What you get
                    </p>
                    <ul className="mt-3 flex flex-col gap-2">
                      {c.delivers.map((d) => (
                        <li key={d} className="flex gap-2.5 text-[0.88rem] leading-snug">
                          <Check
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600"
                            aria-hidden="true"
                          />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* why fixed price matters, not just that it exists */}
      <section className="border-t border-line bg-paper-50 py-section-tight">
        <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
            <div>
              <p className="eyebrow">Pricing</p>
              <h2 className="mt-5 max-w-[18ch] text-h2 font-semibold">
                {fixedPrice.heading}
              </h2>
              <p className="mt-5 max-w-[46ch] leading-relaxed">{fixedPrice.body}</p>
            </div>
            <dl className="grid gap-px self-start border border-line bg-line sm:grid-cols-2">
              {fixedPrice.points.map((p) => (
                <div key={p.title} className="bg-paper-50 p-6">
                  <dt className="text-[0.98rem] font-semibold text-ink-900">{p.title}</dt>
                  <dd className="mt-2 text-[0.88rem] leading-relaxed text-copy">{p.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* engagements — real published pricing */}
      <section className="border-t border-line bg-paper py-section">
        <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
          <p className="eyebrow">Engagements</p>
          <h2 className="mt-5 max-w-[16ch] text-h2 font-semibold">
            Four ways to work together.
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {engagements.map((e) => (
              <article
                key={e.slug}
                id={e.slug}
                className={`flex scroll-mt-28 flex-col rounded-[3px] border bg-paper p-6 ${
                  e.featured ? "border-ink-900" : "border-line"
                }`}
              >
                {e.featured ? (
                  <span className="mb-4 self-start rounded-[2px] bg-ink-900 px-2 py-1 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-white">
                    Most common
                  </span>
                ) : null}
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                  {e.audience}
                </p>
                <h3 className="mt-2.5 text-[1.15rem] font-semibold tracking-[-0.02em]">
                  {e.name}
                </h3>
                <p className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-display text-[1.75rem] font-semibold tracking-[-0.035em] text-ink-900">
                    {e.price}
                  </span>
                  <span className="text-[0.82rem] text-muted">/ {e.cadence}</span>
                </p>
                <p className="mt-3 text-[0.9rem] leading-relaxed">{e.summary}</p>

                <p className="mt-4 border-t border-line pt-4 text-[0.85rem] leading-relaxed text-muted">
                  {e.solves}
                </p>

                <ul className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
                  {e.includes.map((inc) => (
                    <li key={inc} className="flex gap-2 text-[0.85rem] text-ink-800">
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600"
                        aria-hidden="true"
                      />
                      {inc}
                    </li>
                  ))}
                </ul>

                <dl className="mt-4 border-t border-line pt-4 text-[0.82rem]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Typical timeline</dt>
                    <dd className="text-right font-medium text-ink-900">{e.timeline}</dd>
                  </div>
                  <div className="mt-2">
                    <dt className="text-muted">After delivery</dt>
                    <dd className="mt-1 leading-relaxed text-copy">{e.after}</dd>
                  </div>
                </dl>

                <ButtonLink
                  href="/contact"
                  variant={e.featured ? "primary" : "ghost"}
                  className="mt-6 w-full"
                >
                  Get started
                </ButtonLink>
              </article>
            ))}
          </div>

          {/* smaller pieces — a quiet hairline row */}
          <div className="mt-14 border-t border-line pt-10">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-muted">
              Also available
            </p>
            <ul className="mt-6 grid gap-px bg-line sm:grid-cols-3">
              {smallerPieces.map((s) => (
                <li key={s.name} className="bg-paper py-5 sm:px-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-[0.98rem] font-semibold text-ink-900">{s.name}</h3>
                    <span className="font-display text-[1rem] font-semibold text-ink-900">
                      from {s.price}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[0.85rem] leading-relaxed text-muted">{s.note}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <ButtonLink href="/contact" size="lg">
              Book a scoping call
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <p className="text-[0.9rem] text-muted">Free, 20 minutes, no obligation.</p>
          </div>
        </div>
      </section>

      <Process />
      <Tech />
      <Partnership />
      <Faq />
      <Cta />
    </>
  );
}
