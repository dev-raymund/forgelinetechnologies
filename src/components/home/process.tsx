import { Section, SectionHeading } from "@/components/ui/section";
import { processSteps } from "@/data/process";

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
        title="No black box"
        dek="Four steps, and you know the price and the plan before any code is written. At every point you can see what is happening, what is being built, and what comes next."
      />

      <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {processSteps.map((step) => (
          <li key={step.number} className="border-t border-graphite/80 pt-5">
            <span className="font-mono text-micro text-signal">
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
          </li>
        ))}
      </ol>
    </Section>
  );
}
