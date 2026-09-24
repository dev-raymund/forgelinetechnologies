import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/sections/page-header";
import { PageVisual } from "@/components/sections/page-visual";
import { ClosingCta } from "@/components/sections/cta-band";
import { ProjectCard } from "@/components/work/project-card";
import { Section } from "@/components/ui/section";
import { projectKinds, type ProjectKind } from "@/data/projects";
import { getWorks } from "@/lib/works";
import { marketsSentence } from "@/lib/site";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Selected work",
  description: `Real websites, web applications, e-commerce and custom software delivered for businesses in ${marketsSentence}.`,
  alternates: { canonical: "/work" },
};

/**
 * Work index.
 *
 * Filtering runs on the server through a search param rather than in the
 * browser, so each filter is a real URL that can be linked, shared and
 * returned to. It also means the page needs no JavaScript to work.
 *
 * The canonical URL is always /work, because a filtered view is the same
 * collection in a different order and should not compete with it in search.
 */
export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  const active = projectKinds.find((k) => k === kind) as
    ProjectKind | undefined;
  const projects = await getWorks();
  const shown = active ? projects.filter((p) => p.kind === active) : projects;

  return (
    <>
      <PageHeader
        visual={<PageVisual variant="work" />}
        meta={`${projects.length} projects`}
        title="Problems we were brought in to solve"
        dek={`${projects.length} projects delivered for businesses in ${marketsSentence} — real websites, applications and digital products. Where a client's site is still publicly reachable the link goes to it; a build can outlive the site it produced, and we say so rather than link to a dead domain.`}
      />

      <Section ground="paper" size="lg" labelledBy="work-filter-title">
        <h2 id="work-filter-title" className="sr-only">
          Projects
        </h2>

        <nav aria-label="Filter projects by type" className="mb-10">
          <ul className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <li>
              <Link
                href="/work"
                aria-current={!active ? "true" : undefined}
                className={`inline-block rounded-sm border px-3.5 py-2 text-[0.875rem] transition-colors ${
                  !active
                    ? "border-graphite bg-graphite text-white"
                    : "border-rule-strong text-muted hover:border-graphite hover:text-graphite"
                }`}
              >
                All {projects.length}
              </Link>
            </li>
            {projectKinds.map((k) => {
              const count = projects.filter((p) => p.kind === k).length;
              const on = active === k;
              return (
                <li key={k}>
                  <Link
                    href={`/work?kind=${encodeURIComponent(k)}`}
                    aria-current={on ? "true" : undefined}
                    className={`inline-block rounded-sm border px-3.5 py-2 text-[0.875rem] transition-colors ${
                      on
                        ? "border-graphite bg-graphite text-white"
                        : "border-rule-strong text-muted hover:border-graphite hover:text-graphite"
                    }`}
                  >
                    {k} {count}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <ul className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-y-14">
          {shown.map((project, i) => (
            <li key={project.slug}>
              <Reveal delay={(i % 3) * 60}>
                <ProjectCard project={project} priority={i < 3} />
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <ClosingCta />
    </>
  );
}
