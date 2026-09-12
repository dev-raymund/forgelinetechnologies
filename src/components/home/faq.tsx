import { Section, SectionHeading } from "@/components/ui/section";
import { faqs } from "@/data/faqs";

/**
 * FAQ.
 *
 * Built on native <details>/<summary>. It is keyboard operable, screen-reader
 * announced and open-on-find-in-page for free, none of which a hand-rolled
 * accordion gets without work. It also needs no JavaScript, so the answers
 * are in the HTML for crawlers as well as people.
 *
 * All eleven render. The old site answered five easy questions and skipped
 * price, ownership and who writes the code — the three a buyer actually
 * decides on.
 */
export function Faq() {
  return (
    <Section id="faq" ground="paper" size="lg" labelledBy="faq-title">
      <SectionHeading
        id="faq-title"
        title="Questions worth asking"
        dek="Including the ones that decide whether you hire someone: what it costs, who owns the result, and who is actually doing the work."
      />

      <div className="border-t border-rule">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group border-b border-rule [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[1.0625rem] font-medium text-graphite transition-colors hover:text-graphite">
              <span className="max-w-[52ch]">{faq.question}</span>
              <span
                aria-hidden="true"
                className="relative mt-2 size-3 shrink-0"
              >
                <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
                <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current transition-transform duration-200 group-open:scale-y-0" />
              </span>
            </summary>
            <p className="max-w-[68ch] pb-6 text-[0.9375rem] leading-relaxed text-muted">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}
