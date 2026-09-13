import "server-only";
import { desc, sql } from "drizzle-orm";
import { getDb, inquiries, posts, projects, reviews, users } from "@/db";
import { withRetry } from "@/lib/queries";

/**
 * Dashboard figures.
 *
 * Every number is a real count from the database. Nothing is estimated,
 * extrapolated or charted — a dashboard that shows invented movement is worse
 * than one that shows nothing at all.
 *
 * One round trip: eight counts as scalar sub-selects in a single row rather
 * than eight queries, because Neon sits on the other side of an HTTP call and
 * the latency, not the counting, is the cost.
 */
export type DashboardStats = {
  inquiriesNew: number;
  inquiriesTotal: number;
  postsPublished: number;
  postsDraft: number;
  reviewsPending: number;
  reviewsPublished: number;
  worksTotal: number;
  usersActive: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const rows = await withRetry(() =>
    getDb()
      .select({
        inquiriesNew: sql<number>`(select count(*)::int from ${inquiries} where ${inquiries.status} = 'new')`,
        inquiriesTotal: sql<number>`(select count(*)::int from ${inquiries})`,
        postsPublished: sql<number>`(select count(*)::int from ${posts} where ${posts.status} = 'published')`,
        postsDraft: sql<number>`(select count(*)::int from ${posts} where ${posts.status} = 'draft')`,
        reviewsPending: sql<number>`(select count(*)::int from ${reviews} where ${reviews.status} = 'pending')`,
        reviewsPublished: sql<number>`(select count(*)::int from ${reviews} where ${reviews.status} = 'published')`,
        worksTotal: sql<number>`(select count(*)::int from ${projects})`,
        usersActive: sql<number>`(select count(*)::int from ${users} where ${users.active} = true)`,
      })
      .from(sql`(select 1) as _`),
  );
  return rows[0]!;
}

export async function getRecentInquiries(limit = 5) {
  return withRetry(() =>
    getDb()
      .select({
        id: inquiries.id,
        name: inquiries.name,
        company: inquiries.company,
        projectType: inquiries.projectType,
        status: inquiries.status,
        createdAt: inquiries.createdAt,
      })
      .from(inquiries)
      .orderBy(desc(inquiries.createdAt))
      .limit(limit),
  );
}

export async function getRecentReviews(limit = 5) {
  return withRetry(() =>
    getDb()
      .select({
        id: reviews.id,
        name: reviews.name,
        company: reviews.company,
        rating: reviews.rating,
        status: reviews.status,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .orderBy(desc(reviews.createdAt))
      .limit(limit),
  );
}

export async function getRecentPosts(limit = 5) {
  return withRetry(() =>
    getDb()
      .select({
        id: posts.id,
        title: posts.title,
        status: posts.status,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .orderBy(desc(posts.updatedAt))
      .limit(limit),
  );
}
