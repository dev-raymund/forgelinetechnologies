import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Fails loudly and immediately when DATABASE_URL is absent.
 *
 * This is deliberate. The variable is read at build time, so a missing value
 * fails the deploy rather than shipping a site whose data layer silently
 * returns nothing.
 */
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and add the Neon connection string.",
  );
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
export * from "./schema";
