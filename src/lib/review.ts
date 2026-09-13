"use server";

import { headers } from "next/headers";
import { and, eq, gte, sql } from "drizzle-orm";
import { getDb, reviews, projects } from "@/db";
import { withRetry } from "@/lib/queries";
import {
  reviewSchema,
  formatReviewIssues,
  type ReviewFieldErrors,
} from "@/lib/review-validation";
import { sendReviewNotification } from "@/lib/email";

/**
 * Review submission pipeline.
 *
 *   validate -> honeypot -> rate limit -> insert as pending -> notify
 *
 * The same order as the enquiry pipeline, and load-bearing for the same
 * reason: storage happens before email, so an email outage costs the
 * notification and never the review.
 *
 * Nothing here can publish. Every row is written with status "pending" and
 * only the admin moderation action moves it on — there is deliberately no
 * code path from this file to a published review.
 */

const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const SUCCESS = "Thank you for your feedback.";

export type ReviewState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      errors?: ReviewFieldErrors;
      values?: Record<string, string>;
    }
  | { status: "success"; message: string };

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim().slice(0, 64);
  return h.get("x-real-ip")?.slice(0, 64) ?? "";
}

async function countRecentByIp(ip: string, windowMs: number): Promise<number> {
  if (!ip) return 0;
  const since = new Date(Date.now() - windowMs);
  const rows = await withRetry(() =>
    getDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(reviews)
      .where(and(eq(reviews.sourceIp, ip), gte(reviews.createdAt, since))),
  );
  return rows[0]?.n ?? 0;
}

export async function submitReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const field = (k: string) => String(formData.get(k) ?? "");

  // Kept as typed, so any failure below hands the form back intact.
  const values = {
    name: field("name"),
    company: field("company"),
    email: field("email"),
    rating: field("rating"),
    body: field("body"),
    projectId: field("projectId"),
  };

  // 1. validate
  const parsed = reviewSchema.safeParse({
    ...values,
    permissionToPublish: formData.get("permissionToPublish") === "on",
    website: field("website"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      errors: formatReviewIssues(parsed.error),
      values,
    };
  }
  const data = parsed.data;

  // 2. honeypot — report ordinary success and write nothing. A validation
  //    error here would tell a bot it had been detected.
  if (data.website) {
    return { status: "success", message: SUCCESS };
  }

  const ip = await clientIp();

  // 3. rate limit. Three in an hour from one address is already generous for
  //    something a client does once.
  if (ip) {
    try {
      if ((await countRecentByIp(ip, RATE_WINDOW_MS)) >= RATE_LIMIT) {
        return {
          status: "error",
          message: "That is a few reviews in a short time. Try again a little later.",
          values,
        };
      }
    } catch (err) {
      // A failing rate-limit check must not block a genuine review.
      console.error("[review] rate-limit check failed", err);
    }
  }

  // 4. store, as pending, before any email is attempted
  let id: number;
  try {
    const [created] = await getDb()
      .insert(reviews)
      .values({
        name: data.name,
        company: data.company,
        email: data.email,
        rating: data.rating,
        body: data.body,
        projectId: data.projectId,
        permissionToPublish: data.permissionToPublish,
        status: "pending",
        sourceIp: ip,
      })
      .returning({ id: reviews.id });
    id = created!.id;
  } catch (err) {
    console.error("[review] database write failed", err);
    return {
      status: "error",
      message:
        "Something went wrong saving your review. Please try again in a moment — the fault is ours, and it is already in our logs.",
      values,
    };
  }

  // 5. notify. Cannot fail the request now that the row is safely stored.
  let projectTitle: string | undefined;
  if (data.projectId) {
    const [p] = await getDb()
      .select({ title: projects.title })
      .from(projects)
      .where(eq(projects.id, data.projectId))
      .limit(1);
    projectTitle = p?.title;
  }

  const notification = await sendReviewNotification(data, { id, projectTitle });
  if (!notification.ok) {
    console.error("[review] notification not sent:", notification.error);
  }

  return { status: "success", message: SUCCESS };
}
