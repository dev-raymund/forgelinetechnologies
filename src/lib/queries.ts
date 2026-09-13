import "server-only";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { getDb, projects, posts, inquiries, type Project, type Post } from "@/db";

/**
 * Neon's serverless tier suspends after inactivity, and the first query
 * against a cold instance can exceed the driver's connect timeout — which
 * otherwise surfaces to a visitor as a 500. Those failures are transient, so
 * retry them briefly.
 *
 * Only connection-level failures retry. A genuine SQL error throws
 * immediately, because retrying bad SQL just delays the same failure.
 */
const TRANSIENT =
  /fetch failed|ConnectTimeout|UND_ERR_CONNECT_TIMEOUT|ECONNRESET|ETIMEDOUT|socket hang up|terminated/i;

function isTransient(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const cause = (err as { cause?: unknown }).cause;
  const source = (err as { sourceError?: unknown }).sourceError;
  return TRANSIENT.test(
    [err.message, err.name, String(cause ?? ""), String(source ?? "")].join(
      " ",
    ),
  );
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isTransient(err) || i === attempts - 1) throw err;
      // 300ms, then 600ms — enough for a suspended instance to wake.
      await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** i));
    }
  }
  throw last;
}

/* ---------------------------------------------------------------- projects */

export async function getPublishedProjects(): Promise<Project[]> {
  return withRetry(() =>
    getDb()
      .select()
      .from(projects)
      .where(eq(projects.status, "published"))
      .orderBy(asc(projects.sortOrder), desc(projects.createdAt)),
  );
}

export async function getProjectBySlug(
  slug: string,
): Promise<Project | undefined> {
  const rows = await withRetry(() =>
    getDb()
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), eq(projects.status, "published")))
      .limit(1),
  );
  return rows[0];
}

/* ------------------------------------------------------------------- posts */

export async function getPublishedPosts(): Promise<Post[]> {
  return withRetry(() =>
    getDb()
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt), desc(posts.createdAt)),
  );
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const rows = await withRetry(() =>
    getDb()
      .select()
      .from(posts)
      .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
      .limit(1),
  );
  return rows[0];
}

/* --------------------------------------------------------------- inquiries */

/** Enquiries from one IP within the window — the rate-limit check. */
export async function countRecentInquiriesByIp(
  ip: string,
  windowMs: number,
): Promise<number> {
  const since = new Date(Date.now() - windowMs);
  const rows = await withRetry(() =>
    getDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(inquiries)
      .where(and(eq(inquiries.sourceIp, ip), gte(inquiries.createdAt, since))),
  );
  return rows[0]?.n ?? 0;
}
