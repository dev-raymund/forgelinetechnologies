import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/sections/page-header";
import { ClosingCta } from "@/components/sections/cta-band";
import { ProjectCard } from "@/components/work/project-card";
import { Section } from "@/components/ui/section";
import { services, getService } from "@/data/services";
import { getProject } from "@/data/projects";
import { processSteps } from "@/data/process";
import { site } from "@/lib/site";
import { jsonLd } from "@/lib/structured-data";

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
  const others = services.filter((s) => s.slug !== service.slug);

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

      <PageHeader
        meta={`Service ${service.number}`}
        title={service.title}
        dek={service.description}
      />

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
              <span className="font-mono text-micro text-signal">
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
          className="mt-8 inline-block text-[0.9375rem] font-medium text-graphite underline decoration-rule-strong underline-offset-[6px] transition-colors hover:text-signal hover:decoration-signal"
        >
          The full process
        </Link>
      </Section>

      <Section ground="white" size="md" labelledBy="others-title">
        <h2
          id="others-title"
          className="text-subtitle font-semibold text-graphite"
        >
          Other services
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
                <span className="text-[1.0625rem] font-semibold text-graphite transition-colors group-hover:text-signal md:col-span-5">
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
