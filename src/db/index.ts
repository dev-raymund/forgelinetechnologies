import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * The database client, created on first use rather than at import.
 *
 * This used to throw at module scope when DATABASE_URL was absent, on the
 * reasoning that a missing value should fail the deploy rather than ship a
 * broken data layer. It did not do that. The build succeeded, because nothing
 * rendered at build time touches the database — and then every POST to the
 * contact form returned a 500, because importing the server action was enough
 * to evaluate this file. GET requests were fine, so the site looked healthy
 * while its only conversion path was dead.
 *
 * Creating the client lazily moves that failure inside the try/catch that
 * already wraps the insert, so a misconfigured environment costs the visitor
 * a clear message instead of an error screen — and the enquiry still fails
 * loudly in the logs where it can be found.
 */
let client: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (client) return client;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. In production this is a Vercel environment variable; locally, copy .env.example to .env and add the Neon connection string.",
    );
  }

  client = drizzle(neon(url), { schema });
  return client;
}

export * from "./schema";
