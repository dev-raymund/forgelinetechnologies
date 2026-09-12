import { Section } from "@/components/ui/section";
import { PartnerGrid } from "@/components/ui/partner-grid";

/**
 * Partners and ecosystem.
 *
 * Deliberately small. This block previously ran to two columns explaining the
 * TechZQuad relationship at length, which made a section of Forgeline's site
 * into an argument about a different company. The relationship is worth
 * showing; it is not worth three paragraphs.
 *
 * One line of context and the logos. A visitor takes the meaning from the
 * treatment — these are companies we work alongside — without being walked
 * through it.
 */
export function Partnership() {
  return (
    <Section ground="paper" size="sm" labelledBy="partner-title">
      <div className="flex flex-col gap-8 border-t border-rule pt-8 md:flex-row md:items-center md:justify-between md:gap-16">
        <div className="max-w-[40ch]">
          <h2
            id="partner-title"
            className="text-[1.0625rem] font-semibold text-graphite"
          >
            Partners &amp; ecosystem
          </h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
            Technology companies we work alongside when a project needs
            capability beyond web engineering.
          </p>
        </div>
        <PartnerGrid className="shrink-0" />
      </div>
    </Section>
  );
}
