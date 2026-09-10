/**
 * Seeds the DB from the original static site. Safe to re-run: skips slugs
 * that already exist, so it never clobbers edits made in the admin.
 *   npm run db:seed
 */
import { readFileSync } from "node:fs";
import { db, works, posts } from "./index";
import { users } from "./schema";
import { slugify, uniqueSlug } from "../lib/slug";

type SeedWork = {
  category: string;
  imageUrl: string;
  imageAlt: string;
  badge: string;
  title: string;
  description: string;
  liveUrl: string;
};

const seedWorks: SeedWork[] = JSON.parse(
  readFileSync(new URL("./works-seed.json", import.meta.url), "utf8"),
);

async function main() {
  // Bootstrap the first admin from the env vars the old single-user auth used.
  // Runs once: after this, accounts are managed at /admin/users.
  const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
  if (existingUsers.length === 0) {
    const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
    const passwordHash = (process.env.ADMIN_PASSWORD_HASH ?? "").trim();
    if (email && passwordHash) {
      await db.insert(users).values({ email, name: "", passwordHash, role: "admin", active: true });
      console.log(`created first admin: ${email}`);
    } else {
      console.warn(
        "no users yet and ADMIN_EMAIL / ADMIN_PASSWORD_HASH are not set — " +
          'create one with: npm run user:add -- "email" "password" admin',
      );
    }
  }

  const existing = await db.select({ slug: works.slug }).from(works);
  const taken = new Set(existing.map((r) => r.slug));

  // Check the BASE slug against what is already stored before minting a
  // unique one — otherwise an existing "foo" turns into a new "foo-2" and
  // every re-run inserts the whole seed again.
  const rows: (SeedWork & { slug: string; sortOrder: number; published: boolean })[] = [];
  seedWorks.forEach((w, i) => {
    const base = slugify(w.title);
    if (taken.has(base)) return; // already seeded
    const slug = uniqueSlug(base, taken);
    taken.add(slug);
    rows.push({
      ...w,
      slug,
      // Leading slash so it resolves from /public regardless of route depth.
      imageUrl: w.imageUrl.startsWith("http") ? w.imageUrl : `/${w.imageUrl}`,
      sortOrder: i,
      published: true,
    });
  });

  if (rows.length) {
    await db.insert(works).values(rows);
    console.log(`inserted ${rows.length} works`);
  } else {
    console.log("works already seeded — nothing to do");
  }

  const postCount = await db.select({ slug: posts.slug }).from(posts);
  if (postCount.length === 0) {
    await db.insert(posts).values({
      title: "Hello — this site now runs on its own CMS",
      slug: "hello-this-site-runs-on-its-own-cms",
      excerpt:
        "The portfolio and blog are database-backed now. Here is what changed and why.",
      body: [
        "This site used to be a single hand-edited `index.html`. Adding a project meant",
        "editing markup and bumping three filter counts by hand.",
        "",
        "## What changed",
        "",
        "Projects and posts now live in Postgres and render from there. The filter counts",
        "are derived from the data, so they can't drift out of sync again.",
        "",
        "Delete this post once you've written a real one.",
      ].join("\n"),
      tags: "meta",
      published: false,
    });
    console.log("inserted 1 starter post (draft)");
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
