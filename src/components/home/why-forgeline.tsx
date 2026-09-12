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

const forgelineChain = ["You", "The developer", "Your product"];

const consequences = [
  {
    title: "Fewer misunderstandings",
    body: "The person who hears what you need is the person who builds it. Nothing is summarised twice on its way to the code, so what ships matches what you actually asked for.",
  },
  {
    title: "Faster decisions",
    body: "Questions get answered on the call by someone who can genuinely answer them, rather than taken away and brought back next week.",
  },
  {
    title: "One point of accountability",
    body: "If something is wrong there is no discussion about whose scope it was. It is the same person either way, which makes it quicker to put right.",
  },
  {
    title: "A handover you can act on",
    body: "Code, accounts and documentation all transfer to you. You own the result outright and you are free to take it to anyone.",
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
        title="Fewer layers between you and the build"
        dek="Bigger teams exist for good reasons, and on large programmes they are the right answer. But on a website or a web application, every handoff between people is somewhere the brief can drift — and that is where most projects go wrong, long before the code does."
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
