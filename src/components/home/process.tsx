import { Section, SectionHeading } from "@/components/ui/section";
import { processSteps, METHOD_NAME } from "@/data/process";
import { Reveal } from "@/components/ui/reveal";

/**
 * Process.
 *
 * The one place on this page where numbered markers are correct: these four
 * genuinely are a sequence, and the number carries real information about
 * where you are in it. Numbering a set that is not a sequence — six services,
 * say — would be decoration wearing the costume of structure.
 *
 * Each step states its outcome as well as its activity, because "what happens"
 * matters less to a buyer than "what do I have when it is finished".
 */
export function Process() {
  return (
    <Section id="process" ground="white" size="lg" labelledBy="process-title">
      <SectionHeading
        id="process-title"
        eyebrow={METHOD_NAME}
        title="Understand. Plan. Engineer. Build. Improve."
        dek="A clear process from first conversation to launch, with agreed scope, visible progress and direct communication at every stage. The first step is a diagnosis rather than a quote, because building the wrong thing correctly is the most expensive mistake in this industry."
      />

      <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {processSteps.map((step, i) => (
          <li key={step.number} className="border-t-2 border-accent pt-5">
            <Reveal delay={i * 70}>
              <span className="font-mono text-micro text-graphite">
                {step.number}
              </span>
              <h3 className="mt-3 text-subtitle font-semibold text-graphite">
                {step.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
                {step.summary}
              </p>
              <p className="mt-4 border-t border-rule pt-3 text-[0.875rem] leading-relaxed text-graphite">
                {step.outcome}
              </p>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}
