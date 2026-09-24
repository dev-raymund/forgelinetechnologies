import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/sections/page-header";
import { PageVisual } from "@/components/sections/page-visual";
import { ClosingCta } from "@/components/sections/cta-band";
import { Section, SectionHeading } from "@/components/ui/section";
import { packages, addOns, SCOPED } from "@/data/pricing";
import { ArrowRight } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Every engagement starts with understanding the problem, the scope and the requirements. These are the published starting figures those fixed quotes are built from.",
  alternates: { canonical: "/pricing" },
};

/**
 * Pricing.
 *
 * Its own route rather than a band inside another page. Published pricing is
 * one of this studio's genuine advantages over the agencies it competes with,
 * and an advantage buried in a scroll cannot be linked to in an email or found
 * in a search.
 *
 * Every figure comes from src/data/pricing.ts, which carries the previous
 * site's numbers unchanged. Nothing here is invented or rounded.
 */
export default function PricingPage() {
  return (
    <>
      <PageHeader
        visual={<PageVisual variant="pricing" />}
        meta="Pricing"
        title="What it costs, before you call"
        dek="Every engagement starts with a free scoping call and a fixed quote. These are the starting figures those quotes are built from, published so you can decide whether a conversation is worth your time."
      />

      <Section ground="paper" size="lg" labelledBy="packages-title">
        <h2 id="packages-title" className="sr-only">
          Packages
        </h2>

        <div className="grid gap-x-8 gap-y-10 md:grid-cols-2">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.name} delay={(i % 2) * 70}>
              <article
                key={pkg.name}
                className={`flex flex-col p-7 md:p-8 ${
                  pkg.highlight
                    ? "on-ink bg-ink text-on-ink"
                    : "border border-rule bg-white"
                }`}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3
                    className={`text-subtitle font-semibold ${
                      pkg.highlight ? "text-white" : "text-graphite"
                    }`}
                  >
                    {pkg.name}
                  </h3>
                  <span
                    className={`font-mono text-micro ${
                      pkg.highlight ? "text-accent" : "text-faint"
                    }`}
                  >
                    {pkg.audience}
                  </span>
                </div>

                <p
                  className={`mt-5 font-mono text-[1.75rem] font-medium tracking-tight ${
                    pkg.highlight ? "text-white" : "text-graphite"
                  }`}
                >
                  {pkg.price}
                  <span
                    className={`ml-2 text-[0.875rem] font-normal ${
                      pkg.highlight ? "text-on-ink-muted" : "text-muted"
                    }`}
                  >
                    {pkg.unit}
                  </span>
                </p>

                <p
                  className={`mt-4 max-w-[44ch] text-[0.9375rem] leading-relaxed ${
                    pkg.highlight ? "text-on-ink-muted" : "text-muted"
                  }`}
                >
                  {pkg.summary}
                </p>

                <ul
                  className={`mt-6 flex flex-col gap-2.5 border-t pt-5 ${
                    pkg.highlight ? "border-rule-ink" : "border-rule"
                  }`}
                >
                  {pkg.includes.map((item) => (
                    <li
                      key={item}
                      className={`text-[0.9375rem] ${
                        pkg.highlight ? "text-on-ink" : "text-graphite"
                      }`}
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 pt-1">
                  <Link
                    href="/contact"
                    className={`inline-flex items-center justify-center gap-2 rounded-sm px-5 py-3 text-[0.9375rem] font-medium transition-colors ${
                      pkg.highlight
                        ? "bg-white text-ink hover:bg-accent hover:text-white"
                        : "border border-rule-strong text-graphite hover:border-graphite hover:bg-paper"
                    }`}
                  >
                    Talk about your project
                    <ArrowRight />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section ground="white" size="md" labelledBy="addons-title">
        <SectionHeading
          id="addons-title"
          eyebrow="Add-ons"
          title="Additional services"
          dek="Smaller pieces of work, priced the same way — fixed, and agreed up front."
        />
        <ul className="grid gap-x-8 gap-y-8 md:grid-cols-3">
          {addOns.map((item) => (
            <li key={item.name} className="border-t border-graphite/80 pt-5">
              <h3 className="text-[1.125rem] font-semibold text-graphite">
                {item.name}
              </h3>
              <p
                className={
                  item.price === SCOPED
                    ? "mt-2 text-[1.0625rem] font-medium text-muted"
                    : "mt-2 font-mono text-[1.125rem] font-medium text-graphite"
                }
              >
                {item.price}
              </p>
              <p className="mt-3 max-w-[38ch] text-[0.9375rem] leading-relaxed text-muted">
                {item.summary}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section ground="paper" size="md" labelledBy="how-pricing-title">
        <SectionHeading
          id="how-pricing-title"
          eyebrow="How pricing works"
          title="What a fixed price commits us to"
          dek="Fixed price is only meaningful if both sides know what happens when something changes. This is that answer."
        />
        <dl className="grid gap-x-8 gap-y-9 md:grid-cols-3">
          <div className="border-t border-rule pt-5">
            <dt className="text-[1.0625rem] font-semibold text-graphite">
              Scope is agreed first
            </dt>
            <dd className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
              The free scoping call produces a written list of what is being
              built. The price is attached to that list, not to an estimate of
              hours.
            </dd>
          </div>
          <div className="border-t border-rule pt-5">
            <dt className="text-[1.0625rem] font-semibold text-graphite">
              Changes get their own price
            </dt>
            <dd className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
              Ask for something outside the list and you get a fixed price for
              it before it is built. You can always say no, and the original
              price is unaffected either way.
            </dd>
          </div>
          <div className="border-t border-rule pt-5">
            <dt className="text-[1.0625rem] font-semibold text-graphite">
              Overruns are ours
            </dt>
            <dd className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
              If the agreed work takes longer than expected, that is a
              mis-estimate on our side. It does not become a variation on your
              invoice.
            </dd>
          </div>
        </dl>
      </Section>

      <ClosingCta />
    </>
  );
}
