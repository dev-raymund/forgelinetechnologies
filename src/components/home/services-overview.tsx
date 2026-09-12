import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/section";
import { services } from "@/data/services";
import { ServiceIcon } from "@/components/ui/service-icon";
import { Reveal } from "@/components/ui/reveal";

/**
 * What the studio builds.
 *
 * A list, not a grid of cards. Six identical rounded boxes with six identical
 * icons is the default treatment for this content everywhere on the web, and
 * it flattens the hierarchy — every service ends up looking equally weighted
 * and equally generic. A catalogue reads as a studio that knows its own range.
 *
 * The index numbers are set as a reference in the left column rather than
 * glued to the title, so they behave like a catalogue reference instead of
 * implying these six are a sequence you move through in order.
 */
export function ServicesOverview() {
  return (
    <Section id="services" ground="paper" size="lg" labelledBy="services-title">
      <SectionHeading
        id="services-title"
        title="What we build"
        dek="Six things a business actually commissions. Each one is a service on its own, not a bullet inside a bigger package."
      />

      <ul className="border-t border-rule">
        {services.map((service, i) => (
          <li key={service.slug} className="border-b border-rule">
            <Reveal delay={i * 50}>
              <Link
                href={`/services/${service.slug}`}
                className="group grid grid-cols-1 gap-x-8 gap-y-3 py-7 transition-colors hover:bg-white md:grid-cols-12 md:items-baseline md:py-8"
              >
                <span className="flex items-center gap-3 md:col-span-1">
                  <ServiceIcon
                    icon={service.icon}
                    className="mark text-accent"
                  />
                  <span className="font-mono text-micro text-faint">
                    {service.number}
                  </span>
                </span>
                <h3 className="text-subtitle font-semibold text-graphite transition-colors group-hover:underline group-hover:decoration-accent group-hover:underline-offset-4 md:col-span-5">
                  {service.title}
                </h3>
                <p className="max-w-[58ch] text-[0.9375rem] leading-relaxed text-muted md:col-span-6">
                  {service.summary}
                </p>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
