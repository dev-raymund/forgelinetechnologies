/**
 * Verifies the schema + CRUD against real Postgres (PGlite = Postgres in WASM),
 * so none of this depends on having Neon set up first.
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq, asc, desc, sql } from "drizzle-orm";
import { readFileSync } from "node:fs";
import { works, posts } from "../src/db/schema.ts";
import { slugify, uniqueSlug } from "../src/lib/slug.ts";

const client = new PGlite();
const db = drizzle(client);

// Mirror of the drizzle schema, as drizzle-kit would emit it.
await client.exec(`
  CREATE TABLE works (
    id serial PRIMARY KEY,
    title varchar(200) NOT NULL,
    slug varchar(200) NOT NULL UNIQUE,
    category varchar(32) NOT NULL,
    badge varchar(120) NOT NULL DEFAULT '',
    description text NOT NULL DEFAULT '',
    image_url text NOT NULL DEFAULT '',
    image_alt varchar(250) NOT NULL DEFAULT '',
    live_url text NOT NULL DEFAULT '',
    sort_order integer NOT NULL DEFAULT 0,
    published boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE posts (
    id serial PRIMARY KEY,
    title varchar(250) NOT NULL,
    slug varchar(250) NOT NULL UNIQUE,
    excerpt text NOT NULL DEFAULT '',
    body text NOT NULL DEFAULT '',
    cover_url text NOT NULL DEFAULT '',
    cover_alt varchar(250) NOT NULL DEFAULT '',
    tags varchar(300) NOT NULL DEFAULT '',
    published boolean NOT NULL DEFAULT false,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
`);

const ok = (label, cond, extra = "") => {
  console.log(`${cond ? "  ok  " : "  FAIL"} ${label}${extra ? " — " + extra : ""}`);
  if (!cond) process.exitCode = 1;
};

/* ---- seed the real extracted data ---- */
const seed = JSON.parse(readFileSync(new URL("../src/db/works-seed.json", import.meta.url), "utf8"));
const taken = new Set();
await db.insert(works).values(
  seed.map((w, i) => {
    const slug = uniqueSlug(slugify(w.title), taken);
    taken.add(slug);
    return { ...w, slug, imageUrl: `/${w.imageUrl}`, sortOrder: i, published: true };
  }),
);

const all = await db.select().from(works).orderBy(asc(works.sortOrder));
ok("seeded all 17 projects", all.length === 17, `${all.length}`);
ok("sort order preserved", all[0].title === "Talk Global Study", all[0].title);
ok("slugs generated", all[0].slug === "talk-global-study", all[0].slug);
ok("image path rooted", all[0].imageUrl.startsWith("/assets/"), all[0].imageUrl);

/* ---- derived filter counts (the thing that used to drift) ---- */
const counts = Object.fromEntries(
  (await db.select({ c: works.category, n: sql`count(*)::int` }).from(works)
    .where(eq(works.published, true)).groupBy(works.category)).map((r) => [r.c, Number(r.n)]),
);
ok("counts match the old hand-written filters", 
  counts.apps === 2 && counts.ecommerce === 6 && counts.sites === 9, JSON.stringify(counts));

/* ---- CREATE / UPDATE / DELETE ---- */
const [made] = await db.insert(works).values({
  title: "Test Project", slug: "test-project", category: "sites", badge: "Website · Test",
}).returning();
ok("create", made.id > 0 && made.published === true);

await db.update(works).set({ title: "Renamed", published: false }).where(eq(works.id, made.id));
const [edited] = await db.select().from(works).where(eq(works.id, made.id));
ok("update", edited.title === "Renamed" && edited.published === false);

const hidden = await db.select().from(works).where(eq(works.published, true));
ok("unpublished row hidden from public query", hidden.length === 17, `${hidden.length}`);

await db.delete(works).where(eq(works.id, made.id));
ok("delete", (await db.select().from(works)).length === 17);

/* ---- unique slug collision handling ---- */
const existing = new Set((await db.select({ slug: works.slug }).from(works)).map((r) => r.slug));
ok("collision -> -2 suffix", uniqueSlug(slugify("Talk Global Study"), existing) === "talk-global-study-2");

/* ---- posts: draft vs published ---- */
await db.insert(posts).values([
  { title: "A draft", slug: "a-draft", published: false },
  { title: "Live one", slug: "live-one", published: true, publishedAt: new Date() },
]);
const live = await db.select().from(posts).where(eq(posts.published, true)).orderBy(desc(posts.publishedAt));
ok("only published posts are public", live.length === 1 && live[0].slug === "live-one");

console.log(process.exitCode ? "\nFAILURES ABOVE" : "\nall checks passed");
