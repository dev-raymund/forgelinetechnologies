import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/section";
import { problems } from "@/data/problems";

/**
 * Problem recognition.
 *
 * Sits directly after the hero because capability means nothing to someone who
 * has not yet named what is wrong. A visitor should find their own situation
 * in this list, in their own words, before being shown a service that matches
 * it.
 *
 * Two columns of statements rather than cards: these are things people say,
 * and a quotation-like list reads as recognition where a grid of boxes would
 * read as a feature comparison.
 */
export function Problem() {
  return (
    <Section id="problem" ground="white" size="lg" labelledBy="problem-title">
      <SectionHeading
        id="problem-title"
        eyebrow="Where projects start"
        title="Most digital problems aren't development problems"
        dek="Most projects arrive described as a redesign and turn out to be something else — two systems that cannot talk to each other, a process still running on a spreadsheet, or a site search engines cannot read properly. Identifying which one you have is the first piece of work."
      />

      <ul className="grid gap-x-10 gap-y-8 md:grid-cols-2">
        {problems.map((item) => (
          <li key={item.situation} className="border-t border-rule pt-5">
            <p className="max-w-[42ch] text-[1.0625rem] font-medium leading-snug text-graphite">
              “{item.situation}”
            </p>
            <p className="mt-2.5 max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted">
              {item.reading}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-12 max-w-[62ch] text-dek leading-relaxed text-graphite">
        If any of those sound familiar, the right first step is not a quote.
        It is establishing what actually needs to change —{" "}
        <Link
          href="/build-audit"
          className="font-medium underline decoration-rule-strong underline-offset-[6px] transition-colors hover:decoration-accent"
        >
          that is what a Build Audit is for
        </Link>
        .
      </p>
    </Section>
  );
}
