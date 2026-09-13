import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/sections/page-header";
import { PageVisual } from "@/components/sections/page-visual";
import { ClosingCta } from "@/components/sections/cta-band";
import { ProjectCard } from "@/components/work/project-card";
import { Section, SectionHeading } from "@/components/ui/section";
import { services, getService } from "@/data/services";
import { getProject } from "@/data/projects";
import { processSteps } from "@/data/process";
import { site } from "@/lib/site";
import { jsonLd, breadcrumbSchema } from "@/lib/structured-data";
import { ServiceIcon } from "@/components/ui/service-icon";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.summary,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: `${service.title} — ${site.name}`,
      description: service.summary,
    },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const evidence = service.evidence
    .map((s) => getProject(s))
    .filter((p) => p !== undefined);
  const related = service.related
    .map((slug) => getService(slug))
    .filter((x) => x !== undefined);
  const trail = [
    { name: "Services", path: "/services" },
    { name: service.title, path: `/services/${service.slug}` },
  ];
  const others = services.filter(
    (s) => s.slug !== service.slug && !service.related.includes(s.slug),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.title,
            description: service.summary,
            url: `${site.url}/services/${service.slug}`,
            provider: {
              "@type": "Organization",
              name: site.name,
              url: site.url,
            },
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema(trail)) }}
      />

      <PageHeader
        visual={<PageVisual variant="services" />}
        trail={trail}
        meta={`Service ${service.number}`}
        title={service.title}
        dek={service.description}
      >
        <ServiceIcon
          icon={service.icon}
          className="hv-in mt-8 size-9 text-accent"
        />
      </PageHeader>

      <Section ground="paper" size="lg" labelledBy="includes-title">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <h2
              id="includes-title"
              className="text-title font-semibold text-graphite"
            >
              What this covers
            </h2>
            <p className="mt-5 max-w-[42ch] text-dek leading-relaxed text-muted">
              Scope is agreed against this list before anything is built, so
              what you approve is what arrives.
            </p>
          </div>

          <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2 md:col-span-7">
            {service.includes.map((item) => (
              <li
                key={item}
                className="border-t border-rule pt-4 text-[1.0625rem] leading-snug text-graphite"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {evidence.length ? (
        <Section ground="white" size="lg" labelledBy="evidence-title">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2
              id="evidence-title"
              className="text-title max-w-[20ch] font-semibold text-graphite"
            >
              Work of this kind
            </h2>
            <p className="max-w-[46ch] text-[0.9375rem] leading-relaxed text-muted">
              Live sites, not mockups. Each one links to the build and to the
              running product.
            </p>
          </div>
          <ul className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {evidence.map((p) => (
              <li key={p.slug}>
                <ProjectCard project={p} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section ground="paper" size="md" labelledBy="how-title">
        <h2 id="how-title" className="text-title font-semibold text-graphite">
          How the work runs
        </h2>
        <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step) => (
            <li key={step.number} className="border-t border-graphite/80 pt-4">
              <span className="font-mono text-micro text-graphite">
                {step.number}
              </span>
              <h3 className="mt-2.5 text-[1.125rem] font-semibold text-graphite">
                {step.title}
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                {step.outcome}
              </p>
            </li>
          ))}
        </ol>
        <Link
          href="/process"
          className="mt-8 inline-block text-[0.9375rem] font-medium text-graphite underline decoration-rule-strong underline-offset-[6px] transition-colors hover:text-graphite hover:decoration-accent"
        >
          The full process
        </Link>
      </Section>

      {service.faqs?.length ? (
        <Section ground="paper" size="md" labelledBy="service-faq-title">
          <SectionHeading
            id="service-faq-title"
            title={`${service.title}, answered`}
            dek="The questions buyers actually ask about this service, including the ones with uncomfortable answers."
          />
          <div className="border-t border-rule">
            {service.faqs.map((faq) => (
              <details
                key={faq.question}
                className="group border-b border-rule [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[1.0625rem] font-medium text-graphite">
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
      ) : null}

      {related.length ? (
        <Section ground="white" size="md" labelledBy="related-services-title">
          <SectionHeading
            id="related-services-title"
            title="Usually commissioned together"
            dek="Not an upsell — these are the pieces that tend to be part of the same job, and are cheaper to do at the same time than to retrofit."
          />
          <ul className="grid gap-x-8 gap-y-8 md:grid-cols-2">
            {related.map((r) => (
              <li key={r.slug} className="border-t-2 border-accent pt-5">
                <Link href={`/services/${r.slug}`} className="group block">
                  <span className="flex items-center gap-3">
                    <ServiceIcon
                      icon={r.icon}
                      className="mark size-5 text-accent"
                    />
                    <span className="font-mono text-micro text-faint">
                      {r.number}
                    </span>
                  </span>
                  <h3 className="mt-3 text-subtitle font-semibold text-graphite group-hover:underline group-hover:decoration-accent group-hover:underline-offset-4">
                    {r.title}
                  </h3>
                  <p className="mt-2 max-w-[48ch] text-[0.9375rem] leading-relaxed text-muted">
                    {r.summary}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section ground="paper" size="md" labelledBy="others-title">
        <h2
          id="others-title"
          className="text-subtitle font-semibold text-graphite"
        >
          All services
        </h2>
        <ul className="mt-8 border-t border-rule">
          {others.map((s) => (
            <li key={s.slug} className="border-b border-rule">
              <Link
                href={`/services/${s.slug}`}
                className="group grid grid-cols-1 gap-x-8 gap-y-2 py-5 md:grid-cols-12 md:items-baseline"
              >
                <span className="font-mono text-micro text-faint md:col-span-1">
                  {s.number}
                </span>
                <span className="text-[1.0625rem] font-semibold text-graphite transition-colors group-hover:underline group-hover:decoration-accent group-hover:underline-offset-4 md:col-span-5">
                  {s.title}
                </span>
                <span className="max-w-[54ch] text-[0.9375rem] text-muted md:col-span-6">
                  {s.summary}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <ClosingCta />
    </>
  );
}
