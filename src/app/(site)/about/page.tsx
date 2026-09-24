import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/sections/page-header";
import { PageVisual } from "@/components/sections/page-visual";
import { ClosingCta } from "@/components/sections/cta-band";
import { Section, SectionHeading } from "@/components/ui/section";
import { Technology } from "@/components/home/technology";
import { People } from "@/components/sections/people";
import { Reviews } from "@/components/sections/reviews";
import { promises, promiseStatement } from "@/data/promise";
import { site, founder, statsWith, marketsSentence } from "@/lib/site";
import { countPublishedProjects } from "@/lib/queries";
import { Counter } from "@/components/ui/counter";

export const metadata: Metadata = {
  title: "About",
  description: `Forgeline Technologies is a focused technology studio founded by ${founder.name}. Agreed scope, an agreed price, and direct access to the people building your project.`,
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
  "Businesses that need a website or application built properly and launched, rather than an open-ended design conversation.",
  "Teams that want to speak with the people writing the code rather than through an account manager.",
  "Businesses inheriting a project that was left unfinished, or a site that has become impossible to maintain.",
  "Agencies that need a development partner able to take a service line and deliver it.",
];

const poorFit = [
  "Programmes that need a large team working in parallel across many workstreams at once.",
  "Work where the scope genuinely cannot be established before it starts — a fixed price stops being honest there.",
  "Buyers looking for the cheapest possible quote rather than something maintainable afterwards.",
];

export default async function AboutPage() {
  const projectCount = await countPublishedProjects();
  const stats = statsWith(projectCount);

  return (
    <>
      <PageHeader
        visual={<PageVisual variant="about" />}
        meta="About Forgeline"
        title="An engineering team, not a developer for hire"
        dek="We work out what a business actually needs before deciding what to build. Sometimes that is a website. Often it is an application, an integration, or removing work a person is doing by hand. The service follows the problem."
      />

      <Section ground="paper" size="lg" labelledBy="why-exists">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4">
            <p className="mb-4 font-mono text-micro text-faint">Our story</p>
            <h2
              id="why-exists"
              className="text-title max-w-[16ch] font-semibold text-graphite"
            >
              Why this studio exists
            </h2>
          </div>

          <div className="md:col-span-7 md:col-start-6">
            <div className="max-w-[64ch] space-y-5 text-dek leading-relaxed text-muted">
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
                price you approve up front. Clean code, a clean handover, and a
                product that actually goes live.
              </p>
              <p className="text-graphite">
                That is also why the team stays focused. Everyone on a project
                has a name and a defined responsibility — the moment it needs a
                layer of management to run, the thing that makes it worth
                hiring is gone.
              </p>
            </div>

            {/* The story is written in the first person, so it needs an
                author. The portrait that used to sit beside it is gone: he
                appears in the row below with everyone else, and showing the
                same face twice in one section made a three-person studio look
                like a founder plus staff. */}
            <p className="mt-7 text-[0.9375rem] font-semibold text-graphite">
              {founder.name}
            </p>
            <p className="font-mono text-micro text-faint">{founder.role}</p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
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
        </div>

        <People />
      </Section>

      <Section ground="ink" size="md" labelledBy="experience-title">
        <SectionHeading
          id="experience-title"
          eyebrow="Track record"
          title="What we have delivered"
          dek={`${projectCount} projects delivered across websites, web applications, e-commerce and custom software — for businesses in ${marketsSentence}.`}
          aside={
            <Link
              href="/work"
              className="shrink-0 self-start text-[0.9375rem] font-medium text-on-ink underline decoration-rule-ink-strong underline-offset-[6px] transition-colors hover:text-accent hover:decoration-accent md:self-end"
            >
              View our work
            </Link>
          }
        />
        <dl className="grid grid-cols-3 gap-x-6 gap-y-8 sm:gap-x-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col-reverse border-t border-rule-ink pt-4"
            >
              <dt className="mt-1.5 text-[0.8125rem] text-on-ink-muted">
                {stat.label}
              </dt>
              <dd className="font-mono text-[1.75rem] font-medium tracking-tight text-white">
                <Counter value={stat.value} />
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Technology />

      <Section ground="paper" size="lg" labelledBy="fit-title">
        <SectionHeading
          id="fit-title"
          eyebrow="Working together"
          title="Who we work best with"
          dek="And who we are not the right fit for. Saying so up front saves a conversation that was never going to go anywhere."
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
          eyebrow="The Forgeline Promise"
          title="What you can expect from us"
          dek="Five commitments that apply to every project, all of them things within our control. The full version, with what each one means in practice, is on the homepage."
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

      {/* Published reviews sit after our own commitments, so the page reads
          as "here is what we promise" followed by "here is what clients
          said". Renders nothing until a review is published. */}
      <Reviews />

      <ClosingCta />
    </>
  );
}
