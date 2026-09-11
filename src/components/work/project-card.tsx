import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/projects";

/**
 * Project card, shared by the work index and the service detail pages.
 *
 * Kind and sector are separate elements split by a rule rather than a string
 * joined with middle dots. `priority` is passed only for images above the
 * fold on the work index — everything else lazy-loads.
 */
export function ProjectCard({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  return (
    <Link href={`/work/${project.slug}`} className="group block">
      <div className="relative aspect-[16/10] overflow-hidden border border-rule bg-white">
        <Image
          src={project.image}
          alt={project.imageAlt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 92vw"
          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="font-mono text-micro text-signal">{project.kind}</span>
        <span aria-hidden="true" className="h-3 w-px bg-rule-strong" />
        <span className="font-mono text-micro text-faint">{project.sector}</span>
      </div>
      <h3 className="mt-2 text-[1.25rem] font-semibold text-graphite transition-colors group-hover:text-signal">
        {project.title}
      </h3>
      <p className="mt-2 max-w-[52ch] text-[0.9375rem] leading-relaxed text-muted">
        {project.description}
      </p>
    </Link>
  );
}
