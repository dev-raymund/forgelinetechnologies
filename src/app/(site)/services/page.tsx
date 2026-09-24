import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/sections/page-header";
import { PageVisual } from "@/components/sections/page-visual";
import { ClosingCta } from "@/components/sections/cta-band";
import { Section } from "@/components/ui/section";
import { services } from "@/data/services";
import { getProject } from "@/data/projects";
import { ServiceIcon } from "@/components/ui/service-icon";

export const metadata: Metadata = {
  title: "What we solve",
  description:
    "You do not always need a new website. Sometimes the answer is a custom application, a faster store, an integration, better search visibility, or removing work someone is doing by hand.",
  alternates: { canonical: "/services" },
};

/**
 * Services index.
 *
 * Each entry carries its deliverables and the real projects that demonstrate
 * it. A service claim standing next to a live build is worth more than another
 * paragraph describing the service.
 */
export default function ServicesPage() {
  return (
    <>
      <PageHeader
        visual={<PageVisual variant="services" />}
        meta="Services"
        title="One team. Different problems."
        dek={`Digital solutions built around your business — ${services.length} services spanning websites, web applications, e-commerce, custom software, integrations, search and automation. Each one is something a business commissions on its own, not a bullet inside a bigger package.`}
      />

      <Section ground="paper" size="lg" labelledBy="services-list">
        <h2 id="services-list" className="sr-only">
          Services
        </h2>

        <div className="flex flex-col gap-16 md:gap-20">
          {services.map((service) => {
            const evidence = service.evidence
              .map((slug) => getProject(slug))
              .filter((p) => p !== undefined);

            return (
              <article
                key={service.slug}
                className="grid gap-8 border-t border-graphite/80 pt-8 md:grid-cols-12 md:gap-10"
              >
                <div className="md:col-span-5">
                  <span className="flex items-center gap-3">
                    <ServiceIcon
                      icon={service.icon}
                      className="size-5 text-accent"
                    />
                    <span className="font-mono text-micro text-faint">
                      {service.number}
                    </span>
                  </span>
                  <h3 className="mt-3 text-subtitle font-semibold text-graphite">
                    <Link
                      href={`/services/${service.slug}`}
                      className="transition-colors hover:text-graphite"
                    >
                      {service.title}
                    </Link>
                  </h3>
                  <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted">
                    {service.description}
                  </p>
                  <Link
                    href={`/services/${service.slug}`}
                    className="mt-6 inline-block text-[0.9375rem] font-medium text-graphite underline decoration-rule-strong underline-offset-[6px] transition-colors hover:text-graphite hover:decoration-accent"
                  >
                    {service.title} in detail
                  </Link>
                </div>

                <div className="md:col-span-4">
                  <h4 className="font-mono text-micro text-faint">Includes</h4>
                  <ul className="mt-3 flex flex-col gap-2">
                    {service.includes.map((item) => (
                      <li
                        key={item}
                        className="text-[0.9375rem] leading-relaxed text-graphite"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-3">
                  <h4 className="font-mono text-micro text-faint">Shipped</h4>
                  <ul className="mt-3 flex flex-col gap-2">
                    {evidence.map((p) => (
                      <li key={p.slug}>
                        <Link
                          href={`/work/${p.slug}`}
                          className="text-[0.9375rem] text-graphite underline decoration-rule-strong underline-offset-4 transition-colors hover:text-graphite hover:decoration-accent"
                        >
                          {p.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      <ClosingCta />
    </>
  );
}
