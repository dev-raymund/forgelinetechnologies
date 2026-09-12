import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { ServiceIcon } from "@/components/ui/service-icon";
import { services, type Service } from "@/data/services";

/**
 * What we build, grouped by what a client is actually trying to do.
 *
 * Eight services is too many to scan as a flat list, and the four groups are
 * how people already think about it: something needs building, something needs
 * improving, two things need connecting, or something needs to stop being done
 * by hand. Someone who cannot name the service can almost always name the
 * group.
 *
 * Each row leads with the situation in the client's words and only then names
 * the service. A service name means nothing to a reader who has not yet
 * diagnosed themselves.
 *
 * Still a list, not a grid of cards — eight identical boxes would flatten the
 * hierarchy the grouping just created.
 */
const groups: { name: Service["group"]; note: string }[] = [
  { name: "Build", note: "Something new, or a replacement for a system your business has outgrown." },
  { name: "Improve", note: "You already have it. It needs to perform better and be easier to find." },
  { name: "Connect", note: "The systems exist. They need to share information reliably." },
  { name: "Automate", note: "The work happens the same way every time. It should not need a person." },
];

export function ServicesOverview() {
  return (
    <Section id="services" ground="paper" size="lg" labelledBy="services-title">
      <SectionHeading
        id="services-title"
        eyebrow="What we do"
        title="Digital solutions built around your business"
        dek="Websites, web applications, e-commerce, custom software, integrations, search and automation — grouped by what you are trying to achieve rather than by the technology behind it. Most projects begin in one group and touch a second."
      />

      <div className="flex flex-col gap-14 md:gap-16">
        {groups.map((group) => {
          const inGroup = services.filter((s) => s.group === group.name);
          return (
            <section key={group.name} aria-label={group.name}>
              <div className="border-t-2 border-accent pt-4">
                <h3 className="text-subtitle font-semibold text-graphite">
                  {group.name}
                </h3>
                <p className="mt-1.5 max-w-[54ch] text-[0.9375rem] text-muted">
                  {group.note}
                </p>
              </div>

              <ul className="mt-6 border-t border-rule">
                {inGroup.map((service, i) => (
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

                        <span className="md:col-span-5">
                          {/* The situation leads, but the service name stays a
                              real heading — regrouping these had quietly
                              dropped all eight out of the heading outline,
                              which costs screen-reader navigation and the
                              weight those names carry on the page. */}
                          <span className="block max-w-[40ch] text-[1.0625rem] font-medium leading-snug text-graphite">
                            “{service.problem}”
                          </span>
                          <h4 className="mt-2 text-subtitle font-semibold text-graphite transition-colors group-hover:underline group-hover:decoration-accent group-hover:underline-offset-4">
                            {service.title}
                          </h4>
                        </span>

                        <span className="block max-w-[58ch] text-[0.9375rem] leading-relaxed text-muted md:col-span-6">
                          {service.summary}
                        </span>
                      </Link>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Section>
  );
}
