"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, inquiries, inquiryNotes } from "@/db";
import { authorise } from "@/lib/auth/guard";
import { audit } from "@/lib/auth/audit";
import { isInquiryStatus } from "@/lib/admin/inquiry-statuses";

/**
 * Enquiry mutations.
 *
 * Every one calls `authorise` first. These are reachable as HTTP endpoints
 * whether or not a button exists for them, so the check belongs here and not
 * in the component that renders the form.
 */

export type ActionResult = { ok: boolean; error?: string };

const idSchema = z.coerce.number().int().positive();

export async function setInquiryStatus(
  formData: FormData,
): Promise<ActionResult> {
  const auth = await authorise("inquiries.manage");
  if (!auth.ok) return { ok: false, error: auth.error };

  const id = idSchema.safeParse(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  if (!id.success) return { ok: false, error: "Unknown enquiry." };
  if (!isInquiryStatus(status)) return { ok: false, error: "Unknown status." };

  await getDb()
    .update(inquiries)
    .set({ status, updatedAt: new Date() })
    .where(eq(inquiries.id, id.data));

  await audit({
    action: "inquiry.status",
    userId: auth.user.id,
    actorEmail: auth.user.email,
    entity: "inquiry",
    entityId: id.data,
    detail: `→ ${status}`,
  });

  revalidatePath(`/admin/inquiries/${id.data}`);
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
  return { ok: true };
}

const noteSchema = z.string().trim().min(1, "Write something first.").max(4000);

export async function addInquiryNote(
  formData: FormData,
): Promise<ActionResult> {
  const auth = await authorise("inquiries.manage");
  if (!auth.ok) return { ok: false, error: auth.error };

  const id = idSchema.safeParse(formData.get("id"));
  const body = noteSchema.safeParse(formData.get("body"));
  if (!id.success) return { ok: false, error: "Unknown enquiry." };
  if (!body.success)
    return { ok: false, error: body.error.issues[0]?.message ?? "Invalid note." };

  await getDb().insert(inquiryNotes).values({
    inquiryId: id.data,
    authorId: auth.user.id,
    body: body.data,
  });

  await audit({
    action: "inquiry.note",
    userId: auth.user.id,
    actorEmail: auth.user.email,
    entity: "inquiry",
    entityId: id.data,
  });

  revalidatePath(`/admin/inquiries/${id.data}`);
  return { ok: true };
}

/**
 * Deletion is real, not a flag.
 *
 * An enquiry has no published state to hide it from, so an "archived" one
 * would just be a row nobody looks at. The confirmation lives in the UI; this
 * is admin-only because losing a lead is not an editor's mistake to make.
 */
export async function deleteInquiry(formData: FormData): Promise<ActionResult> {
  const auth = await authorise("users.manage");
  if (!auth.ok) return { ok: false, error: auth.error };

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Unknown enquiry." };

  const [row] = await getDb()
    .select({ name: inquiries.name, email: inquiries.email })
    .from(inquiries)
    .where(eq(inquiries.id, id.data))
    .limit(1);

  await getDb().delete(inquiries).where(eq(inquiries.id, id.data));

  await audit({
    action: "inquiry.delete",
    userId: auth.user.id,
    actorEmail: auth.user.email,
    entity: "inquiry",
    entityId: id.data,
    detail: row ? `${row.name} <${row.email}>` : "",
  });

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
  return { ok: true };
}
