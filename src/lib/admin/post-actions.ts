"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, posts } from "@/db";
import { authorise } from "@/lib/auth/guard";
import { audit } from "@/lib/auth/audit";

/**
 * Blog mutations.
 *
 * `publishedAt` is set once, the first time a post is published, and kept
 * afterwards. Unpublishing and republishing should not move a post to the top
 * of the list as though it were new — the date a thing was first published is
 * a fact about it, not a function of its current status.
 */

export type PostResult = { ok: boolean; error?: string; id?: number };

const STATUSES = ["draft", "published", "archived"] as const;

const postSchema = z.object({
  title: z.string().trim().min(2, "A title is required.").max(250),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "A slug is required.")
    .max(250)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only."),
  excerpt: z.string().trim().max(400).default(""),
  body: z.string().max(120_000).default(""),
  coverUrl: z.string().trim().max(500).default(""),
  seoTitle: z.string().trim().max(250).default(""),
  seoDescription: z.string().trim().max(400).default(""),
  ogImage: z.string().trim().max(500).default(""),
  status: z.enum(STATUSES),
});

function read(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "");
  return {
    title: get("title"),
    slug: get("slug"),
    excerpt: get("excerpt"),
    body: get("body"),
    coverUrl: get("coverUrl"),
    seoTitle: get("seoTitle"),
    seoDescription: get("seoDescription"),
    ogImage: get("ogImage"),
    status: get("status"),
  };
}

function refresh(slug: string) {
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blog");
  revalidatePath("/admin");
}

export async function savePost(
  id: number | null,
  formData: FormData,
): Promise<PostResult> {
  const auth = await authorise("posts.manage");
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = postSchema.safeParse(read(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }
  const d = parsed.data;

  const [clash] = await getDb()
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.slug, d.slug))
    .limit(1);
  if (clash && clash.id !== id) {
    return { ok: false, error: `Another post already uses the slug "${d.slug}".` };
  }

  if (id) {
    const [before] = await getDb()
      .select({ slug: posts.slug, status: posts.status, publishedAt: posts.publishedAt })
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);
    if (!before) return { ok: false, error: "That post no longer exists." };

    const firstPublish = d.status === "published" && !before.publishedAt;
    await getDb()
      .update(posts)
      .set({
        ...d,
        ...(firstPublish ? { publishedAt: new Date() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id));

    if (before.slug !== d.slug) refresh(before.slug);
    await audit({
      action:
        before.status !== "published" && d.status === "published"
          ? "post.publish"
          : before.status === "published" && d.status !== "published"
            ? "post.unpublish"
            : "post.update",
      userId: auth.user.id,
      actorEmail: auth.user.email,
      entity: "post",
      entityId: id,
      detail: d.title,
    });
    refresh(d.slug);
    return { ok: true, id };
  }

  const [created] = await getDb()
    .insert(posts)
    .values({
      ...d,
      authorId: auth.user.id,
      publishedAt: d.status === "published" ? new Date() : null,
    })
    .returning({ id: posts.id });

  await audit({
    action: "post.create",
    userId: auth.user.id,
    actorEmail: auth.user.email,
    entity: "post",
    entityId: created!.id,
    detail: d.title,
  });
  refresh(d.slug);
  return { ok: true, id: created!.id };
}

export async function setPostStatus(formData: FormData): Promise<PostResult> {
  const auth = await authorise("posts.manage");
  if (!auth.ok) return { ok: false, error: auth.error };

  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  if (!id.success) return { ok: false, error: "Unknown post." };
  if (!(STATUSES as readonly string[]).includes(status))
    return { ok: false, error: "Unknown status." };

  const [row] = await getDb()
    .select({ slug: posts.slug, title: posts.title, publishedAt: posts.publishedAt })
    .from(posts)
    .where(eq(posts.id, id.data))
    .limit(1);
  if (!row) return { ok: false, error: "That post no longer exists." };

  await getDb()
    .update(posts)
    .set({
      status,
      ...(status === "published" && !row.publishedAt ? { publishedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id.data));

  await audit({
    action: status === "published" ? "post.publish" : "post.unpublish",
    userId: auth.user.id,
    actorEmail: auth.user.email,
    entity: "post",
    entityId: id.data,
    detail: `${row.title} → ${status}`,
  });

  refresh(row.slug);
  return { ok: true };
}

/** Deleting a post is admin-only, and the UI confirms first. */
export async function deletePost(formData: FormData): Promise<PostResult> {
  const auth = await authorise("users.manage");
  if (!auth.ok) return { ok: false, error: auth.error };

  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Unknown post." };

  const [row] = await getDb()
    .select({ slug: posts.slug, title: posts.title })
    .from(posts)
    .where(eq(posts.id, id.data))
    .limit(1);

  await getDb().delete(posts).where(eq(posts.id, id.data));
  await audit({
    action: "post.delete",
    userId: auth.user.id,
    actorEmail: auth.user.email,
    entity: "post",
    entityId: id.data,
    detail: row?.title ?? "",
  });

  if (row) refresh(row.slug);
  return { ok: true };
}
