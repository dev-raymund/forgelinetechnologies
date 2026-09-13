/**
 * Seeds the 17 real projects from src/data/projects.ts into the database.
 *
 *   npm run seed:works
 *
 * Idempotent, and keyed on slug. Slugs are live URLs with search history
 * behind them, so they are the identity here: re-running updates a row in
 * place and never inserts a duplicate or renames anything.
 *
 * Rows that exist in the database but not in the file are left alone — once
 * the admin can create projects, the file stops being the whole truth and
 * deleting "extras" would delete real work.
 */
import { eq } from "drizzle-orm";
import { getDb } from "../src/db/index.ts";
import { projects as projectsTable } from "../src/db/schema.ts";
import { projects as source } from "../src/data/projects.ts";

const db = getDb();

/** "Web App" -> "web-app". The column predates the file and indexes on it. */
const categoryOf = (kind: string) => kind.toLowerCase().replace(/\s+/g, "-");

let inserted = 0;
let updated = 0;

for (const [i, p] of source.entries()) {
  const row = {
    title: p.title,
    slug: p.slug,
    category: categoryOf(p.kind),
    kind: p.kind,
    sector: p.sector,
    summary: "",
    description: p.description,
    imageUrl: p.image,
    imageAlt: p.imageAlt,
    // Empty means "no reachable live site", which is a real state — see
    // fast-track-home-loans. It must never become a dead URL.
    liveUrl: p.liveUrl ?? "",
    stack: p.stack,
    overview: p.overview ?? "",
    challenge: p.challenge ?? "",
    approach: p.approach ?? "",
    outcome: p.outcome ?? "",
    gallery: p.gallery ?? [],
    featured: p.featured ?? false,
    sortOrder: i,
    status: "published" as const,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(eq(projectsTable.slug, p.slug))
    .limit(1);

  if (existing) {
    await db.update(projectsTable).set(row).where(eq(projectsTable.id, existing.id));
    updated++;
  } else {
    await db.insert(projectsTable).values(row);
    inserted++;
  }
}

const all = await db.select({ slug: projectsTable.slug }).from(projectsTable);
const sourceSlugs = new Set(source.map((p) => p.slug));
const extra = all.filter((r) => !sourceSlugs.has(r.slug)).map((r) => r.slug);

console.log(`\n  ${inserted} inserted, ${updated} updated, ${all.length} total`);
console.log(`  every source slug present: ${source.every((p) => all.some((r) => r.slug === p.slug))}`);
if (extra.length) console.log(`  in database but not in the file (left alone): ${extra.join(", ")}`);
