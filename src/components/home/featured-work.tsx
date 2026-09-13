import Image from "next/image";
import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/section";
import { getWorks } from "@/lib/works";
import { marketsSentence } from "@/lib/site";
import { Reveal } from "@/components/ui/reveal";

/**
 * Featured work.
 *
 * Six of seventeen. The previous site put all seventeen on the homepage as
 * thumbnails with a one-line caption and no link, which is evidence without
 * argument: a buyer could see that work existed but not what was hard about
 * any of it.
 *
 * Images are held to a fixed aspect and a two-column measure. A portfolio
 * where every screenshot is enormous reads as a gallery rather than a case
 * for hiring someone.
 *
 * Kind and sector are two separate elements divided by a rule, not a string
 * joined with middle dots — the divider is structure, the dots were decoration.
 */
export async function FeaturedWork() {
  const projects = await getWorks();
  // Curated on the project itself, so the homepage selection is an admin
  // decision rather than "the first six".
  const featuredProjects = projects.filter((p) => p.featured).slice(0, 6);
  return (
    <Section id="work" ground="paper" size="peak" labelledBy="work-title">
      <SectionHeading
        id="work-title"
        eyebrow="Our work"
        title="Projects we have delivered"
        dek={`Websites, applications, online stores and custom software delivered for businesses in ${marketsSentence}.`}
        aside={
          <Link
            href="/work"
            className="shrink-0 self-start text-[0.9375rem] font-medium text-graphite underline decoration-rule-strong underline-offset-[6px] transition-colors hover:text-graphite hover:decoration-accent md:self-end"
          >
            All {projects.length} projects
          </Link>
        }
      />

      <ul className="grid gap-x-8 gap-y-12 md:grid-cols-2 md:gap-y-16">
        {featuredProjects.map((project, i) => (
          <li key={project.slug}>
            <Reveal delay={(i % 2) * 70}>
              <Link
                href={`/work/${project.slug}`}
                className="media-card group block"
              >
                <div className="media-frame relative aspect-[16/10] overflow-hidden border border-rule bg-white">
                  <Image
                    src={project.image}
                    alt={project.imageAlt}
                    fill
                    sizes="(min-width: 768px) 45vw, 92vw"
                    className="media-zoom object-cover object-top"
                  />
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <span className="font-mono text-micro text-graphite">
                    {project.kind}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-3 w-px bg-rule-strong"
                  />
                  <span className="font-mono text-micro text-faint">
                    {project.sector}
                  </span>
                </div>

                <h3 className="mt-2.5 text-subtitle font-semibold text-graphite transition-colors group-hover:underline group-hover:decoration-accent group-hover:underline-offset-4">
                  {project.title}
                </h3>
                <p className="mt-2.5 max-w-[54ch] text-[0.9375rem] leading-relaxed text-muted">
                  {project.description}
                </p>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
