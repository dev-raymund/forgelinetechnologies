import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/sections/page-header";
import { PageVisual } from "@/components/sections/page-visual";
import { ClosingCta } from "@/components/sections/cta-band";
import { Section, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRight } from "@/components/ui/icon";
import { auditAreas, auditOutcomes } from "@/data/build-audit";
import { processSteps } from "@/data/process";
import { jsonLd, breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Build Audit",
  description:
    "Not sure what to build? A Build Audit works out what is actually wrong with your site, application or workflows, what is worth keeping, and what to do first — before anyone quotes you for a rebuild.",
  alternates: { canonical: "/build-audit" },
};

/**
 * The Build Audit.
 *
 * The entry point for the larger half of the market: people who know something
 * is wrong but cannot specify what to build. "Start a project" asks them to
 * have already decided; this asks them to describe a symptom.
 *
 * No invented price. The conversation is free — which was already true of the
 * process — and anything deeper is scoped like any other work. Making up a
 * headline figure for a diagnostic would undermine the one thing the pricing
 * page has going for it.
 */
export default function BuildAuditPage() {
  const trail = [{ name: "Build Audit", path: "/build-audit" }];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema(trail)) }}
      />

      <PageHeader
        visual={<PageVisual variant="audit" />}
        meta="Build Audit"
        title="Know what to build, before you build it"
        dek="Anyone can quote you for a website. Establishing whether a website is the answer is the part that saves money. A Build Audit reviews what you already have and sets out what is actually worth doing, and in what order."
      >
        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink
            href="/contact"
            ground="ink"
            variant="solid"
            icon={<ArrowRight />}
          >
            Book a Build Audit
          </ButtonLink>
        </div>
      </PageHeader>

      <Section ground="paper" size="lg" labelledBy="covers-title">
        <SectionHeading
          id="covers-title"
          eyebrow="The review"
          title="What we look at"
          dek="Six areas, in the order they usually matter. Measured where they can be measured, rather than described."
        />
        <dl className="grid gap-x-10 gap-y-9 md:grid-cols-2">
          {auditAreas.map((area) => (
            <div key={area.title} className="border-t border-rule pt-5">
              <dt className="text-[1.0625rem] font-semibold text-graphite">
                {area.title}
              </dt>
              <dd className="mt-2.5 max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted">
                {area.detail}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section ground="white" size="md" labelledBy="outcome-title">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <h2
              id="outcome-title"
              className="text-title max-w-[18ch] font-semibold text-graphite"
            >
              What you receive
            </h2>
            <p className="mt-5 max-w-[44ch] text-dek leading-relaxed text-muted">
              A recommendation you could hand to any developer — not a sales
              document that only works if you hire us.
            </p>
          </div>
          <ul className="grid gap-4 md:col-span-6 md:col-start-7">
            {auditOutcomes.map((item) => (
              <li
                key={item}
                className="border-t border-graphite/80 pt-4 text-[1.0625rem] leading-snug text-graphite"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section ground="paper" size="md" labelledBy="cost-title">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <h2
              id="cost-title"
              className="text-title max-w-[18ch] font-semibold text-graphite"
            >
              What it costs
            </h2>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <p className="max-w-[56ch] text-dek leading-relaxed text-muted">
              The conversation is free, and it is often enough. If the audit
              needs to go further than a call — reading a live codebase, running
              performance and SEO diagnostics, mapping how your systems connect
              — that is scoped and priced like any other work, and agreed before
              it starts.
            </p>
            <p className="mt-5 max-w-[56ch] text-[0.9375rem] leading-relaxed text-muted">
              There is no obligation to build anything afterwards, and no
              retainer attached to it.{" "}
              <Link
                href="/pricing"
                className="text-graphite underline decoration-rule-strong underline-offset-4 transition-colors hover:decoration-accent"
              >
                Published pricing
              </Link>{" "}
              applies to whatever you decide to do next.
            </p>
          </div>
        </div>
      </Section>

      <Section ground="white" size="md" labelledBy="then-title">
        <SectionHeading
          id="then-title"
          eyebrow="After the audit"
          title="What happens next"
          dek="The audit is the diagnosis. Everything after it runs the way every Forgeline project runs."
        />
        <ol className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step) => (
            <li key={step.number} className="border-t-2 border-accent pt-4">
              <span className="font-mono text-micro text-graphite">
                {step.number}
              </span>
              <h3 className="mt-2.5 text-[1.125rem] font-semibold text-graphite">
                {step.title}
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                {step.outcome}
              </p>
            </li>
          ))}
        </ol>
        <Link
          href="/process"
          className="mt-8 inline-block text-[0.9375rem] font-medium text-graphite underline decoration-rule-strong underline-offset-[6px] transition-colors hover:decoration-accent"
        >
          The full method
        </Link>
      </Section>

      <ClosingCta />
    </>
  );
}
