import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/sections/page-header";
import { ClosingCta } from "@/components/sections/cta-band";
import { Section, SectionHeading } from "@/components/ui/section";
import { processSteps } from "@/data/process";

export const metadata: Metadata = {
  title: "Process",
  description:
    "Four steps from first call to launch. Scope and price agreed before any code is written, weekly visible progress, and a clean handover you own outright.",
  alternates: { canonical: "/process" },
};

/**
 * Commitments, not values.
 *
 * A process page is only worth publishing if it constrains the studio running
 * it. Each of these is something a client can point at afterwards and say it
 * did not happen, which is the only kind of promise worth printing.
 */
const commitments = [
  {
    title: "The price is fixed against the scope",
    body: "You approve a number before work starts and it does not move. If you ask for something outside the agreed scope, you get a separate fixed price for that addition before it is built — never an invoice explaining it afterwards.",
  },
  {
    title: "Progress is visible weekly",
    body: "You see working software in a browser rather than a percentage in a status report. Anything that has slipped is said out loud in the week it slips, not in the week before launch.",
  },
  {
    title: "You talk to the developer",
    body: "Questions go to the person writing the code and get answered by them. There is no account manager in the middle, which is why answers take hours rather than a sprint.",
  },
  {
    title: "Handover transfers everything",
    body: "Repository, hosting, accounts and documentation. No proprietary builder holding your content, no licence to keep paying, and no requirement to stay for support.",
  },
];

export default function ProcessPage() {
  return (
    <>
      <PageHeader
        meta="Four steps"
        title="No black box"
        dek="Most projects go wrong quietly — the scope drifts, the budget moves, and nobody says anything until launch. This process exists to make that impossible to hide."
      />

      <Section ground="paper" size="lg" labelledBy="steps-title">
        <h2 id="steps-title" className="sr-only">
          The four steps
        </h2>

        <ol className="flex flex-col">
          {processSteps.map((step, i) => (
            <li
              key={step.number}
              className={`grid gap-6 border-t-2 border-accent py-9 md:grid-cols-12 md:gap-10 ${
                i === processSteps.length - 1 ? "border-b" : ""
              }`}
            >
              <div className="md:col-span-3">
                <span className="font-mono text-micro text-graphite">
                  {step.number}
                </span>
                <h3 className="mt-3 text-subtitle font-semibold text-graphite">
                  {step.title}
                </h3>
              </div>
              <p className="max-w-[62ch] text-dek leading-relaxed text-muted md:col-span-6">
                {step.summary}
              </p>
              <div className="md:col-span-3">
                <h4 className="font-mono text-micro text-faint">
                  You end up with
                </h4>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-graphite">
                  {step.outcome}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section ground="ink" size="lg" labelledBy="commitments-title">
        <SectionHeading
          id="commitments-title"
          title="What this commits us to"
          dek="A process is only worth publishing if it constrains the people running it. These are the parts you can hold us to."
        />
        <dl className="grid gap-x-8 gap-y-10 md:grid-cols-2">
          {commitments.map((c) => (
            <div key={c.title} className="border-t border-rule-ink pt-5">
              <dt className="text-[1.125rem] font-semibold text-white">
                {c.title}
              </dt>
              <dd className="mt-3 max-w-[52ch] text-[0.9375rem] leading-relaxed text-on-ink-muted">
                {c.body}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section ground="white" size="md" labelledBy="pricing-link-title">
        <div className="grid gap-8 md:grid-cols-12 md:items-center">
          <div className="md:col-span-7">
            <h2
              id="pricing-link-title"
              className="text-title max-w-[22ch] font-semibold text-graphite"
            >
              The price is published, not quoted on request
            </h2>
            <p className="mt-5 max-w-[54ch] text-dek leading-relaxed text-muted">
              You can see what a build costs before you speak to anyone. Most
              studios will not tell you until they have your phone number.
            </p>
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-sm bg-accent-deep px-5 py-3 text-[0.9375rem] font-medium text-white transition-colors hover:bg-accent-deeper"
            >
              See what it costs
            </Link>
          </div>
        </div>
      </Section>

      <ClosingCta />
    </>
  );
}
