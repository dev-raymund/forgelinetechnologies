"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, reviews } from "@/db";
import { authorise } from "@/lib/auth/guard";
import { audit } from "@/lib/auth/audit";

/**
 * Review moderation.
 *
 * Four states, and only one of them is public:
 *
 *   pending   -> just arrived, seen by nobody outside the dashboard
 *   approved  -> read and judged fine, still not on the site
 *   published -> live
 *   rejected  -> will not be used
 *
 * "approved" exists separately from "published" so reading a review and
 * deciding to run it are two different acts. Approving in a hurry should not
 * put someone's words on the marketing site by itself.
 *
 * Publishing is refused outright without `permissionToPublish`. That is not a
 * UI nicety — it is the reviewer's consent, and no admin click substitutes for
 * it.
 */

export type ReviewResult = { ok: boolean; error?: string };

const STATUSES = ["pending", "approved", "published", "rejected"] as const;
const idSchema = z.coerce.number().int().positive();

function refresh() {
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/about");
  revalidatePath("/");
}

export async function setReviewStatus(formData: FormData): Promise<ReviewResult> {
  const auth = await authorise("reviews.manage");
  if (!auth.ok) return { ok: false, error: auth.error };

  const id = idSchema.safeParse(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  if (!id.success) return { ok: false, error: "Unknown review." };
  if (!(STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: "Unknown status." };
  }

  const [row] = await getDb()
    .select()
    .from(reviews)
    .where(eq(reviews.id, id.data))
    .limit(1);
  if (!row) return { ok: false, error: "That review no longer exists." };

  if (status === "published" && !row.permissionToPublish) {
    return {
      ok: false,
      error:
        "This reviewer did not give permission to publish. Ask them first — it cannot be overridden here.",
    };
  }

  await getDb()
    .update(reviews)
    .set({
      status,
      // Set once, the first time it goes live, and kept afterwards.
      ...(status === "published" && !row.publishedAt ? { publishedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(reviews.id, id.data));

  await audit({
    action:
      status === "published"
        ? "review.publish"
        : status === "approved"
          ? "review.approve"
          : status === "rejected"
            ? "review.reject"
            : "review.unpublish",
    userId: auth.user.id,
    actorEmail: auth.user.email,
    entity: "review",
    entityId: id.data,
    detail: `${row.name} → ${status}`,
  });

  if (row.projectId) revalidatePath("/work", "layout");
  refresh();
  return { ok: true };
}

/**
 * Light editing only: a typo, a name spelled properly, a trailing sentence
 * that identifies a third party. The rating is not editable — changing
 * someone's score is putting words in their mouth, and the whole value of a
 * review is that we did not write it.
 */
const editSchema = z.object({
  name: z.string().trim().min(2, "A name is required.").max(150),
  company: z.string().trim().max(200).default(""),
  body: z.string().trim().min(10, "The review is too short.").max(4000),
});

export async function editReview(formData: FormData): Promise<ReviewResult> {
  const auth = await authorise("reviews.manage");
  if (!auth.ok) return { ok: false, error: auth.error };

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Unknown review." };

  const parsed = editSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    company: String(formData.get("company") ?? ""),
    body: String(formData.get("body") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }

  await getDb()
    .update(reviews)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(reviews.id, id.data));

  await audit({
    action: "review.approve",
    userId: auth.user.id,
    actorEmail: auth.user.email,
    entity: "review",
    entityId: id.data,
    detail: `edited ${parsed.data.name}`,
  });

  refresh();
  return { ok: true };
}

/** Admin only, and the UI confirms first. Rejecting is the usual answer. */
export async function deleteReview(formData: FormData): Promise<ReviewResult> {
  const auth = await authorise("users.manage");
  if (!auth.ok) return { ok: false, error: auth.error };

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Unknown review." };

  const [row] = await getDb()
    .select({ name: reviews.name })
    .from(reviews)
    .where(eq(reviews.id, id.data))
    .limit(1);

  await getDb().delete(reviews).where(eq(reviews.id, id.data));
  await audit({
    action: "review.delete",
    userId: auth.user.id,
    actorEmail: auth.user.email,
    entity: "review",
    entityId: id.data,
    detail: row?.name ?? "",
  });

  refresh();
  return { ok: true };
}
