import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, works, posts, type Work, type Post } from "@/db";

/**
 * Neon's serverless tier suspends after inactivity, and the first query against
 * a cold instance can exceed the driver's 10s connect timeout — which surfaces
 * as a 500 on any page that reads the database. Those failures are transient by
 * definition, so retry them with a short backoff rather than rendering an error
 * page to whoever happened to arrive first.
 *
 * Only connection-level failures retry. A genuine query error still throws
 * immediately, because retrying bad SQL just delays the same failure.
 */
const TRANSIENT =
  /fetch failed|ConnectTimeout|UND_ERR_CONNECT_TIMEOUT|ECONNRESET|ETIMEDOUT|socket hang up|terminated/i;

function isTransient(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const cause = (err as { cause?: unknown }).cause;
  const sourceError = (err as { sourceError?: unknown }).sourceError;
  return TRANSIENT.test(
    [err.message, err.name, String(cause ?? ""), String(sourceError ?? "")].join(" "),
  );
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isTransient(err) || i === attempts - 1) throw err;
      // 300ms, then 600ms — enough for a suspended Neon instance to wake.
      await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** i));
    }
  }
  throw last;
}

/* ---------- works ---------- */

export async function getPublishedWorks(): Promise<Work[]> {
  return withRetry(() =>
    db
      .select()
      .from(works)
      .where(eq(works.published, true))
      .orderBy(asc(works.sortOrder), desc(works.createdAt)),
  );
}

export async function getAllWorks(): Promise<Work[]> {
  return withRetry(() =>
    db.select().from(works).orderBy(asc(works.sortOrder), desc(works.createdAt)),
  );
}

export async function getWork(id: number): Promise<Work | undefined> {
  const rows = await withRetry(() =>
    db.select().from(works).where(eq(works.id, id)).limit(1),
  );
  return rows[0];
}

/**
 * Filter counts straight from the database.
 *
 * The public /work page does NOT use this — it already loads every published
 * work to render the grid, so it derives its counts from that array instead of
 * paying for a second round-trip (see countByCategory below). This stays for
 * callers that need counts without the rows.
 */
export async function getWorkCounts(): Promise<Record<string, number>> {
  const rows = await withRetry(() =>
    db
      .select({ category: works.category, n: sql<number>`count(*)::int` })
      .from(works)
      .where(eq(works.published, true))
      .groupBy(works.category),
  );
  return Object.fromEntries(rows.map((r) => [r.category, r.n]));
}

/** Counts derived from rows already in hand — no query, always consistent. */
export function countByCategory(rows: Work[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) out[row.category] = (out[row.category] ?? 0) + 1;
  return out;
}

export async function getWorkBySlug(slug: string): Promise<Work | undefined> {
  const rows = await withRetry(() =>
    db
      .select()
      .from(works)
      .where(and(eq(works.slug, slug), eq(works.published, true)))
      .limit(1),
  );
  return rows[0];
}

/* ---------- posts ---------- */

export async function getPublishedPosts(): Promise<Post[]> {
  return withRetry(() =>
    db
      .select()
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.publishedAt), desc(posts.createdAt)),
  );
}

export async function getAllPosts(): Promise<Post[]> {
  return withRetry(() => db.select().from(posts).orderBy(desc(posts.createdAt)));
}

export async function getPost(id: number): Promise<Post | undefined> {
  const rows = await withRetry(() =>
    db.select().from(posts).where(eq(posts.id, id)).limit(1),
  );
  return rows[0];
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const rows = await withRetry(() =>
    db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, slug), eq(posts.published, true)))
      .limit(1),
  );
  return rows[0];
}
