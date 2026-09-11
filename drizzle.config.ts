import type { Config } from "drizzle-kit";

/**
 * drizzle-kit does not load .env itself. Next does for the app, but the CLI
 * runs outside Next — so pass the file explicitly:
 *
 *   node --env-file=.env node_modules/.bin/drizzle-kit push
 *
 * The npm scripts already do this.
 */
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Run via `npm run db:push`, which loads .env.",
  );
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
} satisfies Config;
