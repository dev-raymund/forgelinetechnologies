import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb, reviews, projects } from "@/db";
import { withRetry } from "@/lib/queries";

/**
 * Published reviews, for the public site.
 *
 * Filters on status "published" and nothing else. "approved" is not public —
 * reading a review and deciding to run it are two separate acts, and only the
 * second one belongs here.
 */
export type PublicReview = {
  id: number;
  name: string;
  company: string;
  rating: number;
  body: string;
  projectTitle: string | null;
  projectSlug: string | null;
  publishedAt: Date | null;
};

export async function getPublishedReviews(limit = 6): Promise<PublicReview[]> {
  return withRetry(() =>
    getDb()
      .select({
        id: reviews.id,
        name: reviews.name,
        company: reviews.company,
        rating: reviews.rating,
        body: reviews.body,
        projectTitle: projects.title,
        projectSlug: projects.slug,
        publishedAt: reviews.publishedAt,
      })
      .from(reviews)
      .leftJoin(projects, eq(reviews.projectId, projects.id))
      .where(eq(reviews.status, "published"))
      .orderBy(desc(reviews.publishedAt), desc(reviews.createdAt))
      .limit(limit),
  );
}
