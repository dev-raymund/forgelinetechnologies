/**
 * Push rewritten project descriptions from works-seed.json into the database.
 *
 * `db:seed` deliberately skips slugs that already exist, so it can be re-run
 * safely — which also means it will never update copy for a project already in
 * the table. This script does that one job: match on title, update description
 * only, leave every other column alone.
 *
 *   npx tsx --env-file=.env scripts/update-work-copy.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";

const here = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(join(here, "../src/db/works-seed.json"), "utf8"));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run with: npx tsx --env-file=.env scripts/update-work-copy.mjs");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

let updated = 0;
let unchanged = 0;
let missing = 0;

for (const work of seed) {
  const rows = await sql`
    UPDATE works
       SET description = ${work.description}, updated_at = now()
     WHERE title = ${work.title}
       AND description IS DISTINCT FROM ${work.description}
   RETURNING title
  `;
  if (rows.length > 0) {
    updated += 1;
    console.log(`  updated  ${work.title}`);
  } else {
    const exists = await sql`SELECT 1 FROM works WHERE title = ${work.title} LIMIT 1`;
    if (exists.length > 0) {
      unchanged += 1;
    } else {
      missing += 1;
      console.warn(`  MISSING  ${work.title} — not in the works table`);
    }
  }
}

console.log(`\n${updated} updated, ${unchanged} already current, ${missing} not found.`);
if (updated > 0) {
  console.log("Public pages revalidate hourly; save any work row in /admin to refresh immediately.");
}
