import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { differences, engineeringSteps, executionSteps } from "@/data/engineering";

/**
 * Why Forgeline.
 *
 * The argument is structural, so the section is built structurally: two
 * sequences side by side. The emphasised one is the LONGER of the two, and
 * that inversion is the point — the extra steps sit before and after the
 * build, which is where the decisions that cost money get made.
 *
 * The comparison is to a way of working, never to a named competitor and never
 * to developers as people. Plenty of work genuinely is "build this, to this
 * spec"; the argument is about what happens when nobody checked the spec.
 *
 * The emphasised chain uses `accent`, not an `accent-bright` variant. That
 * token never existed in the theme, so Tailwind generated no rule for it and
 * the Forgeline column rendered with invisible dots, no connector and a label
 * that fell back to inherited white. The palette is deliberately two colours;
 * orange on ink measures 5.42:1, so the real token is both correct and legible
 * here.
 */

function Chain({
  label,
  steps,
  emphasis,
}: {
  label: string;
  steps: string[];
  emphasis: boolean;
}) {
  return (
    <div>
      <p
        className={`font-mono text-micro ${
          emphasis ? "text-accent" : "text-on-ink-muted"
        }`}
      >
        {label}
      </p>
      <ol className="mt-5">
        {steps.map((step, i) => (
          <li
            key={step}
            className="relative flex items-center gap-4 pb-7 last:pb-0"
          >
            {/* Connector. Drawn on every item but the last, so the chain reads
                as continuous rather than as separate dots. */}
            {i < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={`absolute left-[3px] top-[14px] h-full w-px ${
                  emphasis ? "bg-accent/45" : "bg-rule-ink"
                }`}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={`relative z-10 size-[7px] shrink-0 rounded-full ${
                emphasis ? "bg-accent" : "bg-on-ink-muted"
              }`}
            />
            <span
              className={`text-[0.9375rem] ${
                emphasis ? "text-white" : "text-on-ink-muted"
              }`}
            >
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function WhyForgeline() {
  return (
    <Section id="why" ground="ink" size="lg" labelledBy="why-title">
      <SectionHeading
        id="why-title"
        eyebrow="Why Forgeline"
        title="A developer builds it. An engineering team solves it."
        dek="Hiring execution gets you the thing you specified, which works when the specification is right. Often nobody has checked — and a project that builds the wrong thing correctly is still a project you pay for twice."
      />

      <div className="grid gap-12 md:grid-cols-12 md:gap-8">
        <Reveal className="grid grid-cols-2 gap-8 md:col-span-5">
          <Chain label="Execution only" steps={executionSteps} emphasis={false} />
          <Chain label="Engineering" steps={engineeringSteps} emphasis />
        </Reveal>

        <dl className="grid gap-x-8 gap-y-9 sm:grid-cols-2 md:col-span-6 md:col-start-7">
          {differences.map((item, i) => (
            <Reveal key={item.title} delay={i * 60}>
              <dt className="text-[1.0625rem] font-semibold text-white">
                {item.title}
              </dt>
              <dd className="mt-2 max-w-[44ch] text-[0.9375rem] leading-relaxed text-on-ink-muted">
                {item.body}
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </Section>
  );
}
