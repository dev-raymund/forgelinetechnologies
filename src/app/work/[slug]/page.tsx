import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/sections/page-header";
import { PageVisual } from "@/components/sections/page-visual";
import { ClosingCta } from "@/components/sections/cta-band";
import { ProjectCard } from "@/components/work/project-card";
import { Section } from "@/components/ui/section";
import {
  projects,
  getProject,
  relatedProjects,
  hasCaseStudy,
} from "@/data/projects";
import { site } from "@/lib/site";
import { jsonLd, breadcrumbSchema } from "@/lib/structured-data";

/** All seventeen are known at build time, so all seventeen are static. */
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

/** A slug outside the list is a 404, never a rendered empty page. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: `${project.title} — ${project.kind}`,
    description: project.description,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      title: `${project.title} — ${site.name}`,
      description: project.description,
      images: [{ url: project.image, alt: project.imageAlt }],
      type: "article",
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const related = relatedProjects(slug);
  const trail = [
    { name: "Work", path: "/work" },
    { name: project.title, path: `/work/${project.slug}` },
  ];
  const detailed = hasCaseStudy(project);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: project.title,
            description: project.description,
            url: `${site.url}/work/${project.slug}`,
            image: `${site.url}${project.image}`,
            creator: {
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
        visual={<PageVisual variant="work" />}
        trail={trail}
        meta={`${project.kind} / ${project.sector}`}
        title={project.title}
      >
        <p className="mt-6 max-w-[58ch] text-dek text-on-ink-muted">
          {project.description}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-sm border border-rule-ink px-2.5 py-1 font-mono text-micro text-on-ink-muted"
            >
              {tech}
            </span>
          ))}
        </div>
      </PageHeader>

      <Section ground="paper" size="lg" labelledBy="project-detail">
        <h2 id="project-detail" className="sr-only">
          About this project
        </h2>

        <figure>
          <div className="relative aspect-[16/10] overflow-hidden border border-rule bg-white">
            <Image
              src={project.image}
              alt={project.imageAlt}
              fill
              priority
              sizes="(min-width: 1024px) 76vw, 92vw"
              className="object-cover object-top"
            />
          </div>
          <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[0.875rem] text-muted">
              {project.imageAlt}
            </span>
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                rel="noopener noreferrer"
                target="_blank"
                className="text-[0.9375rem] font-medium text-graphite underline decoration-rule-strong underline-offset-[6px] transition-colors hover:text-graphite hover:decoration-accent"
              >
                Visit the live site
              </a>
            ) : (
              // Stated plainly rather than left as a dead link or an absence
              // the reader has to interpret. The work happened; the site is
              // simply not reachable now.
              <span className="text-[0.9375rem] text-faint">
                Site no longer publicly available
              </span>
            )}
          </figcaption>
        </figure>

        {/* Case-study prose renders only when it has been written. Nothing is
            generated to fill the space, and no placeholder promises a study
            that does not exist. */}
        {detailed ? (
          <div className="mt-14 grid gap-10 md:grid-cols-12">
            <div className="md:col-span-8">
              {project.overview ? (
                <>
                  <h3 className="text-subtitle font-semibold text-graphite">
                    Overview
                  </h3>
                  <p className="mt-3 max-w-[66ch] text-dek leading-relaxed text-muted">
                    {project.overview}
                  </p>
                </>
              ) : null}
              {project.challenge ? (
                <>
                  <h3 className="mt-10 text-subtitle font-semibold text-graphite">
                    The problem
                  </h3>
                  <p className="mt-3 max-w-[66ch] text-dek leading-relaxed text-muted">
                    {project.challenge}
                  </p>
                </>
              ) : null}
              {project.approach ? (
                <>
                  <h3 className="mt-10 text-subtitle font-semibold text-graphite">
                    How it was built
                  </h3>
                  <p className="mt-3 max-w-[66ch] text-dek leading-relaxed text-muted">
                    {project.approach}
                  </p>
                </>
              ) : null}
              {project.outcome ? (
                <>
                  <h3 className="mt-10 text-subtitle font-semibold text-graphite">
                    Result
                  </h3>
                  <p className="mt-3 max-w-[66ch] text-dek leading-relaxed text-muted">
                    {project.outcome}
                  </p>
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <dl className="mt-14 grid gap-x-8 gap-y-8 border-t border-rule pt-8 sm:grid-cols-3">
          <div>
            <dt className="font-mono text-micro text-faint">Type</dt>
            <dd className="mt-2 text-[1.0625rem] text-graphite">
              {project.kind}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-micro text-faint">Sector</dt>
            <dd className="mt-2 text-[1.0625rem] text-graphite">
              {project.sector}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-micro text-faint">Built with</dt>
            <dd className="mt-2 text-[1.0625rem] text-graphite">
              {project.stack.join(", ")}
            </dd>
          </div>
        </dl>
      </Section>

      {related.length ? (
        <Section ground="white" size="md" labelledBy="related-title">
          <div className="mb-10 flex items-end justify-between gap-8">
            <h2
              id="related-title"
              className="text-subtitle font-semibold text-graphite"
            >
              Other work
            </h2>
            <Link
              href="/work"
              className="shrink-0 text-[0.9375rem] font-medium text-graphite underline decoration-rule-strong underline-offset-[6px] transition-colors hover:text-graphite hover:decoration-accent"
            >
              All {projects.length} projects
            </Link>
          </div>
          <ul className="grid gap-x-8 gap-y-12 md:grid-cols-3">
            {related.map((p) => (
              <li key={p.slug}>
                <ProjectCard project={p} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <ClosingCta />
    </>
  );
}
