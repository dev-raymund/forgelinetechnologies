"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, projects } from "@/db";
import { authorise } from "@/lib/auth/guard";
import { audit } from "@/lib/auth/audit";

/**
 * Portfolio mutations.
 *
 * Slugs are the contract. They are live URLs with search history behind them,
 * so the form allows editing one but the action treats a change as significant
 * and the UI warns about it — there is no redirect table, and a silent rename
 * is a 404 for everyone who had the old address.
 */

export type WorkResult = { ok: boolean; error?: string; id?: number };

const KINDS = ["Website", "Web App", "E-commerce", "Custom Build"] as const;
const STATUSES = ["draft", "published", "archived"] as const;

const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "A slug is required.")
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only.");

const workSchema = z.object({
  title: z.string().trim().min(2, "A title is required.").max(200),
  slug: slugField,
  kind: z.enum(KINDS),
  sector: z.string().trim().max(80).default(""),
  description: z.string().trim().max(4000).default(""),
  imageUrl: z.string().trim().max(500).default(""),
  imageAlt: z.string().trim().max(250).default(""),
  // Empty is meaningful: it is how "no reachable live site" is recorded.
  liveUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Enter a full URL, or leave it empty.")
    .default(""),
  stack: z.string().trim().max(500).default(""),
  overview: z.string().trim().max(8000).default(""),
  challenge: z.string().trim().max(8000).default(""),
  approach: z.string().trim().max(8000).default(""),
  outcome: z.string().trim().max(8000).default(""),
  status: z.enum(STATUSES),
  featured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

function read(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "");
  return {
    title: get("title"),
    slug: get("slug"),
    kind: get("kind"),
    sector: get("sector"),
    description: get("description"),
    imageUrl: get("imageUrl"),
    imageAlt: get("imageAlt"),
    liveUrl: get("liveUrl"),
    stack: get("stack"),
    overview: get("overview"),
    challenge: get("challenge"),
    approach: get("approach"),
    outcome: get("outcome"),
    status: get("status"),
    featured: formData.get("featured") === "on",
    sortOrder: get("sortOrder") || "0",
  };
}

/** "React, Next.js, PostgreSQL" -> ["React","Next.js","PostgreSQL"] */
const toStack = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 30);

function refresh(slug: string) {
  revalidatePath("/work");
  revalidatePath(`/work/${slug}`);
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/works");
  revalidatePath("/admin");
}

export async function saveWork(
  id: number | null,
  formData: FormData,
): Promise<WorkResult> {
  const auth = await authorise("works.manage");
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = workSchema.safeParse(read(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }
  const d = parsed.data;

  // A slug collision is a data error, not a crash. Check before writing so the
  // form can say which field is wrong.
  const [clash] = await getDb()
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, d.slug))
    .limit(1);
  if (clash && clash.id !== id) {
    return { ok: false, error: `Another project already uses the slug "${d.slug}".` };
  }

  const row = {
    title: d.title,
    slug: d.slug,
    category: d.kind.toLowerCase().replace(/\s+/g, "-"),
    kind: d.kind,
    sector: d.sector,
    description: d.description,
    imageUrl: d.imageUrl,
    imageAlt: d.imageAlt,
    liveUrl: d.liveUrl,
    stack: toStack(d.stack),
    overview: d.overview,
    challenge: d.challenge,
    approach: d.approach,
    outcome: d.outcome,
    status: d.status,
    featured: d.featured,
    sortOrder: d.sortOrder,
    updatedAt: new Date(),
  };

  let savedId = id;
  if (id) {
    const [before] = await getDb()
      .select({ slug: projects.slug, status: projects.status })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    if (!before) return { ok: false, error: "That project no longer exists." };

    await getDb().update(projects).set(row).where(eq(projects.id, id));
    if (before.slug !== d.slug) refresh(before.slug);
    await audit({
      action: before.status !== d.status && d.status === "published" ? "work.publish" : "work.update",
      userId: auth.user.id,
      actorEmail: auth.user.email,
      entity: "work",
      entityId: id,
      detail: before.slug !== d.slug ? `slug ${before.slug} → ${d.slug}` : d.title,
    });
  } else {
    const [created] = await getDb().insert(projects).values(row).returning({ id: projects.id });
    savedId = created!.id;
    await audit({
      action: "work.create",
      userId: auth.user.id,
      actorEmail: auth.user.email,
      entity: "work",
      entityId: savedId,
      detail: d.title,
    });
  }

  refresh(d.slug);
  return { ok: true, id: savedId ?? undefined };
}

export async function setWorkStatus(formData: FormData): Promise<WorkResult> {
  const auth = await authorise("works.manage");
  if (!auth.ok) return { ok: false, error: auth.error };

  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  if (!id.success) return { ok: false, error: "Unknown project." };
  if (!(STATUSES as readonly string[]).includes(status))
    return { ok: false, error: "Unknown status." };

  const [row] = await getDb()
    .select({ slug: projects.slug, title: projects.title })
    .from(projects)
    .where(eq(projects.id, id.data))
    .limit(1);
  if (!row) return { ok: false, error: "That project no longer exists." };

  await getDb()
    .update(projects)
    .set({ status, updatedAt: new Date() })
    .where(eq(projects.id, id.data));

  await audit({
    action: status === "published" ? "work.publish" : "work.unpublish",
    userId: auth.user.id,
    actorEmail: auth.user.email,
    entity: "work",
    entityId: id.data,
    detail: `${row.title} → ${status}`,
  });

  refresh(row.slug);
  return { ok: true };
}

/**
 * Archive, not delete.
 *
 * A portfolio row is the only record that a piece of work happened. Taking it
 * off the site is a status change; destroying it is not something a single
 * button should do, so there is no delete action here at all.
 */
export async function archiveWork(formData: FormData): Promise<WorkResult> {
  const fd = new FormData();
  fd.set("id", String(formData.get("id") ?? ""));
  fd.set("status", "archived");
  return setWorkStatus(fd);
}
