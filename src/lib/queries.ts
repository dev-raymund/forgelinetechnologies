import "server-only";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { getDb, projects, posts, inquiries, type Project, type Post } from "@/db";
import { withRetry } from "@/lib/retry";

/**
 * `withRetry` lives in `@/lib/retry` so the plain-Node CLIs can import it.
 * It is re-exported here because every page already imports it from this
 * module.
 */
export { withRetry };

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
