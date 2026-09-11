import { Section, SectionHeading } from "@/components/ui/section";

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
    title: "Nothing is lost in relay",
    body: "The person who hears the requirement is the person who implements it. No brief gets summarised twice before it reaches the code.",
  },
  {
    title: "Decisions happen in one step",
    body: "Technical questions get answered by someone who can answer them, on the call, rather than taken away and brought back next week.",
  },
  {
    title: "Accountability has one address",
    body: "When something is wrong there is no question of whose scope it was. It is the same person either way.",
  },
  {
    title: "Handover is clean",
    body: "Code, accounts and documentation, all transferred. You own the result outright and you are free to take it anywhere.",
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
          emphasis ? "text-signal-bright" : "text-on-ink-muted"
        }`}
      >
        {label}
      </p>
      <ol className="mt-5">
        {steps.map((step, i) => (
          <li key={step} className="relative flex items-center gap-4 pb-7 last:pb-0">
            {/* Connector. Drawn on every item but the last, so the chain reads
                as continuous rather than as separate dots. */}
            {i < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={`absolute left-[3px] top-[14px] h-full w-px ${
                  emphasis ? "bg-signal-bright/40" : "bg-rule-ink"
                }`}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={`relative z-10 size-[7px] shrink-0 rounded-full ${
                emphasis ? "bg-signal-bright" : "bg-on-ink-muted"
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
        dek="Most project failures are communication failures. A brief gets relayed, summarised and reinterpreted until what ships is not what was asked for. Removing the relay removes the failure."
      />

      <div className="grid gap-12 md:grid-cols-12 md:gap-8">
        <div className="grid grid-cols-2 gap-8 md:col-span-5">
          <Chain label="A typical agency" steps={typicalChain} emphasis={false} />
          <Chain label="Forgeline" steps={forgelineChain} emphasis />
        </div>

        <dl className="grid gap-x-8 gap-y-9 sm:grid-cols-2 md:col-span-6 md:col-start-7">
          {consequences.map((item) => (
            <div key={item.title}>
              <dt className="text-[1.0625rem] font-semibold text-white">
                {item.title}
              </dt>
              <dd className="mt-2 max-w-[44ch] text-[0.9375rem] leading-relaxed text-on-ink-muted">
                {item.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
