import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";

/**
 * Why Forgeline.
 *
 * The studio's actual differentiator is structural, so the section is built
 * structurally: two chains side by side, one long and one short. The argument
 * is made by the difference in length before a word of it is read, which is
 * why this is a diagram rather than another list of adjectives.
 *
 * The comparison is to a typical agency structure, not to a named competitor.
 */

const typicalChain = [
  "You",
  "Account manager",
  "Project manager",
  "Design team",
  "Developer",
  "Your product",
];

const forgelineChain = ["You", "The team building it", "Your product"];

const consequences = [
  {
    title: "Fewer misunderstandings",
    body: "Your requirements go directly to the people responsible for implementing them. Nothing is re-interpreted on its way to the build, so what ships matches what you asked for.",
  },
  {
    title: "Faster decisions",
    body: "Technical questions are answered on the call by the people responsible for the work, instead of being taken away and returned the following week.",
  },
  {
    title: "One point of accountability",
    body: "One team is responsible for the result. If something is wrong there is no discussion about whose scope it was, which makes it faster to resolve.",
  },
  {
    title: "A handover you can act on",
    body: "Code, accounts and documentation transfer to you on completion. You own the result outright and are free to take it to any developer.",
  },
];

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
          emphasis ? "text-accent-bright" : "text-on-ink-muted"
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
                  emphasis ? "bg-accent-bright/45" : "bg-rule-ink"
                }`}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={`relative z-10 size-[7px] shrink-0 rounded-full ${
                emphasis ? "bg-accent-bright" : "bg-on-ink-muted"
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
        title="A simpler way to get digital work done"
        dek="You work directly with the people responsible for your project. Layered teams earn their keep on large programmes; on a website or a web application, every handoff is a point where the brief can drift — and that is where most projects go wrong, long before the code does."
      />

      <div className="grid gap-12 md:grid-cols-12 md:gap-8">
        <Reveal className="grid grid-cols-2 gap-8 md:col-span-5">
          <Chain
            label="A typical agency"
            steps={typicalChain}
            emphasis={false}
          />
          <Chain label="Forgeline" steps={forgelineChain} emphasis />
        </Reveal>

        <dl className="grid gap-x-8 gap-y-9 sm:grid-cols-2 md:col-span-6 md:col-start-7">
          {consequences.map((item, i) => (
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
