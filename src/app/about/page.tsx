import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/sections/page-header";
import { PageVisual } from "@/components/sections/page-visual";
import { ClosingCta } from "@/components/sections/cta-band";
import { Section, SectionHeading } from "@/components/ui/section";
import { Technology } from "@/components/home/technology";
import { Team } from "@/components/sections/team";
import { promises, promiseStatement } from "@/data/promise";
import { site, founder, stats, marketsSentence } from "@/lib/site";
import { projects } from "@/data/projects";
import { Counter } from "@/components/ui/counter";

export const metadata: Metadata = {
  title: "About",
  description: `Forgeline Technologies is a web engineering studio founded by ${founder.name}. Fixed scope, fixed price, and the developer you brief is the developer who builds it.`,
  alternates: { canonical: "/about" },
};

/**
 * Who the studio suits, and who it does not.
 *
 * Saying who you are wrong for is the cheapest credibility available: it
 * costs nothing, it filters the enquiries that would have wasted both sides'
 * time, and a buyer reads it as confidence rather than as a disclaimer.
 */
const goodFit = [
  "Businesses that need a website or application built properly and launched, not an ongoing design conversation.",
  "Teams that want to talk to the person writing the code rather than through an account manager.",
  "Anyone taking over a project that was left unfinished, or a site that has become impossible to maintain.",
  "Agencies needing a developer who can take a service line and ship it.",
];

const poorFit = [
  "Projects that need a large team working in parallel on many workstreams at once.",
  "Work where the scope genuinely cannot be pinned down before it starts — fixed price stops being honest there.",
  "Anyone looking for the cheapest possible quote rather than something maintainable afterwards.",
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        visual={<PageVisual variant="about" />}
        meta="About the studio"
        title="A web engineering studio, deliberately small"
        dek="Forgeline builds websites, web applications, e-commerce and custom software for businesses that need the result to work — and keeps the distance between the brief and the build as short as it can be."
      />

      <Section ground="paper" size="lg" labelledBy="why-exists">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-3">
            <div className="relative aspect-[4/5] w-40 overflow-hidden border border-rule bg-white sm:w-48 md:w-full md:max-w-[15rem]">
              <Image
                src={founder.photo}
                alt={founder.photoAlt}
                fill
                priority
                sizes="(min-width: 768px) 15rem, 12rem"
                className="object-cover"
              />
            </div>
            <p className="mt-4 text-[0.9375rem] font-semibold text-graphite">
              {founder.name}
            </p>
            <p className="font-mono text-micro text-faint">{founder.role}</p>
            <ul className="mt-5 flex flex-col gap-1.5">
              <li>
                <a
                  href={site.social.linkedin}
                  className="text-[0.875rem] text-muted underline decoration-rule-strong underline-offset-4 transition-colors hover:text-graphite hover:decoration-accent"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href={site.social.github}
                  className="text-[0.875rem] text-muted underline decoration-rule-strong underline-offset-4 transition-colors hover:text-graphite hover:decoration-accent"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-8 md:col-start-5">
            <h2
              id="why-exists"
              className="text-title max-w-[20ch] font-semibold text-graphite"
            >
              Why this studio exists
            </h2>
            <div className="mt-7 max-w-[64ch] space-y-5 text-dek leading-relaxed text-muted">
              <p>
                Over six years working with agencies and enterprise teams across
                Australia and New Zealand, I kept watching the same projects
                fail the same way. They ran over budget. They shipped something
                that did not match what the business actually needed. Some never
                launched at all. The ones that did were handed over badly enough
                that nobody could maintain them afterwards.
              </p>
              <p>
                Almost none of it was a technical problem. It was distance —
                between the person who understood the requirement and the person
                writing the code, with enough people in between that the brief
                arrived unrecognisable.
              </p>
              <p>
                Forgeline is the correction. Scope agreed before work starts. A
                price you approve up front. The developer you brief is the
                developer who builds it. Clean code, a clean handover, and a
                product that actually goes live.
              </p>
              <p className="text-graphite">
                That is also why the studio stays small. The moment it needs a
                layer of management to run, the thing that makes it worth hiring
                is gone.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Team ground="white" />

      <Section ground="ink" size="md" labelledBy="experience-title">
        <SectionHeading
          id="experience-title"
          title="The record so far"
          dek={`${projects.length} projects delivered for businesses in ${marketsSentence}, across websites, web applications, e-commerce and custom software.`}
          aside={
            <Link
              href="/work"
              className="shrink-0 self-start text-[0.9375rem] font-medium text-on-ink underline decoration-rule-ink-strong underline-offset-[6px] transition-colors hover:text-accent hover:decoration-accent md:self-end"
            >
              See the work
            </Link>
          }
        />
        <dl className="grid grid-cols-3 gap-x-6 gap-y-8 sm:gap-x-8">
          {stats.map((stat) => (
            <div key={stat.label} className="border-t border-rule-ink pt-4">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block font-mono text-[1.75rem] font-medium tracking-tight text-white">
                  <Counter value={stat.value} />
                </span>
                <span className="mt-1.5 block text-[0.8125rem] text-on-ink-muted">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Technology />

      <Section ground="paper" size="lg" labelledBy="fit-title">
        <SectionHeading
          id="fit-title"
          title="Who this works for"
          dek="And who it does not. Saying so up front saves a call that was never going to go anywhere."
        />
        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          <div>
            <h3 className="border-t border-graphite/80 pt-4 text-[1.0625rem] font-semibold text-graphite">
              A good fit
            </h3>
            <ul className="mt-5 flex flex-col gap-4">
              {goodFit.map((item) => (
                <li
                  key={item}
                  className="max-w-[48ch] text-[0.9375rem] leading-relaxed text-muted"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="border-t border-rule-strong pt-4 text-[1.0625rem] font-semibold text-graphite">
              Probably not a fit
            </h3>
            <ul className="mt-5 flex flex-col gap-4">
              {poorFit.map((item) => (
                <li
                  key={item}
                  className="max-w-[48ch] text-[0.9375rem] leading-relaxed text-muted"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* What clients can expect. The full Promise lives on the homepage;
          this is the same five commitments in brief, so the About page answers
          "what will working with you actually be like" without reprinting the
          section verbatim. */}
      <Section ground="white" size="md" labelledBy="expect-title">
        <SectionHeading
          id="expect-title"
          title="What you can expect"
          dek="Five commitments, all of them things we control. The full version, with what each one means in practice, is on the homepage."
        />
        <ol className="grid gap-x-10 gap-y-7 md:grid-cols-2">
          {promises.map((item) => (
            <li key={item.number} className="border-t border-graphite/80 pt-4">
              <span className="font-mono text-micro text-faint">
                {item.number}
              </span>
              <h3 className="mt-2.5 text-[1.0625rem] font-semibold text-graphite">
                {item.title}
              </h3>
              <p className="mt-2 max-w-[44ch] text-[0.9375rem] leading-relaxed text-muted">
                {item.claim}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-subtitle font-semibold text-graphite">
          {promiseStatement}
        </p>
      </Section>

      <ClosingCta />
    </>
  );
}
