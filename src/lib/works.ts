import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { getDb, projects as table } from "@/db";
import { withRetry } from "@/lib/queries";
import type { Project, ProjectKind } from "@/data/projects";

/**
 * Published portfolio work, in the shape the public components already use.
 *
 * The mapping exists so the switch from a TypeScript file to the database
 * changed no component: /work, /work/[slug], the homepage grid and the sitemap
 * all still receive a `Project`. src/data/projects.ts remains the seed source
 * and the type's home.
 *
 * `liveUrl` stays optional through the mapping. The column cannot be null, so
 * an empty string is how "no reachable live site" is stored, and it becomes
 * `undefined` here — which is what the page checks before rendering a link.
 */

const KINDS: ProjectKind[] = ["Website", "Web App", "E-commerce", "Custom Build"];

function toProject(row: typeof table.$inferSelect): Project {
  return {
    title: row.title,
    slug: row.slug,
    // Defensive: `kind` is a varchar, so a bad admin edit should degrade to a
    // sensible label rather than break the filter that renders from it.
    kind: KINDS.includes(row.kind as ProjectKind) ? (row.kind as ProjectKind) : "Website",
    sector: row.sector,
    description: row.description,
    image: row.imageUrl,
    imageAlt: row.imageAlt,
    liveUrl: row.liveUrl || undefined,
    stack: row.stack ?? [],
    featured: row.featured,
    overview: row.overview || undefined,
    challenge: row.challenge || undefined,
    approach: row.approach || undefined,
    outcome: row.outcome || undefined,
    gallery: row.gallery?.length ? row.gallery : undefined,
  };
}

export async function getWorks(): Promise<Project[]> {
  const rows = await withRetry(() =>
    getDb()
      .select()
      .from(table)
      .where(eq(table.status, "published"))
      .orderBy(asc(table.sortOrder), desc(table.createdAt)),
  );
  return rows.map(toProject);
}

export async function getWork(slug: string): Promise<Project | undefined> {
  const rows = await withRetry(() =>
    getDb()
      .select()
      .from(table)
      .where(eq(table.slug, slug))
      .limit(1),
  );
  const row = rows[0];
  if (!row || row.status !== "published") return undefined;
  return toProject(row);
}

/** Slugs only — for generateStaticParams and the sitemap. */
export async function getWorkSlugs(): Promise<string[]> {
  const rows = await withRetry(() =>
    getDb()
      .select({ slug: table.slug })
      .from(table)
      .where(eq(table.status, "published"))
      .orderBy(asc(table.sortOrder)),
  );
  return rows.map((r) => r.slug);
}
