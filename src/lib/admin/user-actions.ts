"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb, users } from "@/db";
import { authorise } from "@/lib/auth/guard";
import { audit } from "@/lib/auth/audit";
import { hashPassword } from "@/lib/auth/password";
import {
  currentSessionId,
  destroyOtherSessions,
  destroyUserSessions,
} from "@/lib/auth/session";

/**
 * User administration.
 *
 * Two failure modes matter more than anything else here, and both end with
 * nobody being able to get in:
 *
 *   1. Removing the last admin. There is no recovery path through the UI —
 *      it would need shell access and the setup script.
 *   2. Locking yourself out by editing your own account.
 *
 * So every destructive path counts the remaining active admins first, and no
 * action lets you change your own role or deactivate yourself. Those are not
 * conveniences; they are the difference between a mistake and an outage.
 */

export type UserResult = { ok: boolean; error?: string; password?: string };

const ROLES = ["admin", "editor"] as const;

const baseSchema = z.object({
  name: z.string().trim().max(150).default(""),
  email: z.string().trim().toLowerCase().max(255).pipe(z.email("Enter a valid email address.")),
  role: z.enum(ROLES),
});

const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(200, "That password is too long.");

const idSchema = z.coerce.number().int().positive();

/** Active admins other than the one given. The lockout guard. */
async function otherActiveAdmins(exceptId: number): Promise<number> {
  const rows = await getDb()
    .select({ n: count() })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.active, true), ne(users.id, exceptId)));
  return rows[0]?.n ?? 0;
}

function refresh() {
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function createUser(formData: FormData): Promise<UserResult> {
  const auth = await authorise("users.manage");
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = baseSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }

  const supplied = String(formData.get("password") ?? "");
  if (supplied) {
    const pw = passwordSchema.safeParse(supplied);
    if (!pw.success) return { ok: false, error: pw.error.issues[0]!.message };
  }
  // base64url of 18 bytes: 24 characters, no shell-quoting ambiguity.
  const password = supplied || randomBytes(18).toString("base64url");

  const [existing] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (existing) {
    return { ok: false, error: "An account already uses that address." };
  }

  const [created] = await getDb()
    .insert(users)
    .values({
      email: parsed.data.email,
      name: parsed.data.name || parsed.data.email.split("@")[0]!,
      role: parsed.data.role,
      passwordHash: await hashPassword(password),
      active: true,
    })
    .returning({ id: users.id });

  await audit({
    action: "user.create",
    userId: auth.user.id,
    actorEmail: auth.user.email,
    entity: "user",
    entityId: created!.id,
    detail: `${parsed.data.email} as ${parsed.data.role}`,
  });

  refresh();
  // Returned once, for the admin to pass on. Never stored in the clear.
  return { ok: true, password: supplied ? undefined : password };
}

export async function updateUser(formData: FormData): Promise<UserResult> {
  const auth = await authorise("users.manage");
  if (!auth.ok) return { ok: false, error: auth.error };

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Unknown account." };

  const parsed = baseSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }

  const [target] = await getDb().select().from(users).where(eq(users.id, id.data)).limit(1);
  if (!target) return { ok: false, error: "That account no longer exists." };

  const isSelf = target.id === auth.user.id;
  if (isSelf && parsed.data.role !== target.role) {
    return {
      ok: false,
      error: "You cannot change your own role. Ask another admin to do it.",
    };
  }
  if (
    !isSelf &&
    target.role === "admin" &&
    parsed.data.role !== "admin" &&
    (await otherActiveAdmins(target.id)) === 0
  ) {
    return { ok: false, error: "That is the last admin. Promote someone else first." };
  }

  const [clash] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (clash && clash.id !== target.id) {
    return { ok: false, error: "Another account already uses that address." };
  }

  await getDb()
    .update(users)
    .set({
      name: parsed.data.name || target.name,
      email: parsed.data.email,
      role: parsed.data.role,
      updatedAt: new Date(),
    })
    .where(eq(users.id, target.id));

  // A demotion must take effect now, not whenever they next sign in.
  if (parsed.data.role !== target.role) await destroyUserSessions(target.id);

  await audit({
    action: "user.update",
    userId: auth.user.id,
    actorEmail: auth.user.email,
    entity: "user",
    entityId: target.id,
    detail:
      parsed.data.role !== target.role
        ? `${target.email}: ${target.role} → ${parsed.data.role}`
        : target.email,
  });

  refresh();
  return { ok: true };
}

export async function setUserActive(formData: FormData): Promise<UserResult> {
  const auth = await authorise("users.manage");
  if (!auth.ok) return { ok: false, error: auth.error };

  const id = idSchema.safeParse(formData.get("id"));
  const active = formData.get("active") === "true";
  if (!id.success) return { ok: false, error: "Unknown account." };

  const [target] = await getDb().select().from(users).where(eq(users.id, id.data)).limit(1);
  if (!target) return { ok: false, error: "That account no longer exists." };

  if (target.id === auth.user.id && !active) {
    return { ok: false, error: "You cannot deactivate your own account." };
  }
  if (!active && target.role === "admin" && (await otherActiveAdmins(target.id)) === 0) {
    return { ok: false, error: "That is the last active admin. Promote someone else first." };
  }

  await getDb()
    .update(users)
    .set({ active, updatedAt: new Date() })
    .where(eq(users.id, target.id));

  // Deactivation ends every session immediately — that is the whole reason
  // sessions live in the database rather than in a token.
  if (!active) await destroyUserSessions(target.id);

  await audit({
    action: "user.deactivate",
    userId: auth.user.id,
    actorEmail: auth.user.email,
    entity: "user",
    entityId: target.id,
    detail: `${target.email} → ${active ? "active" : "inactive"}`,
  });

  refresh();
  return { ok: true };
}

export async function resetUserPassword(formData: FormData): Promise<UserResult> {
  const auth = await authorise("users.manage");
  if (!auth.ok) return { ok: false, error: auth.error };

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Unknown account." };

  const [target] = await getDb().select().from(users).where(eq(users.id, id.data)).limit(1);
  if (!target) return { ok: false, error: "That account no longer exists." };

  const supplied = String(formData.get("password") ?? "");
  if (supplied) {
    const pw = passwordSchema.safeParse(supplied);
    if (!pw.success) return { ok: false, error: pw.error.issues[0]!.message };
  }
  const password = supplied || randomBytes(18).toString("base64url");

  await getDb()
    .update(users)
    .set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
    .where(eq(users.id, target.id));

  /*
   * Whose sessions end depends on whose password this is.
   *
   * Someone else's: all of them, immediately. A reset that leaves the old
   * sessions working has not taken anything away from whoever prompted it.
   *
   * Your own: every session except this one. This request just proved it holds
   * a valid session and performed the reset, so ending it achieves nothing
   * except signing you out mid-task — and the new password is on screen at
   * that moment, so the redirect took it away before it could be read. That
   * was a real way to lock yourself out of your own dashboard.
   */
  if (target.id === auth.user.id) {
    await destroyOtherSessions(target.id, await currentSessionId());
  } else {
    await destroyUserSessions(target.id);
  }

  await audit({
    action: "user.update",
    userId: auth.user.id,
    actorEmail: auth.user.email,
    entity: "user",
    entityId: target.id,
    detail: `password reset for ${target.email}`,
  });

  refresh();
  return { ok: true, password: supplied ? undefined : password };
}

/**
 * Deleting an account is deliberately not offered.
 *
 * Accounts are referenced by posts they wrote and notes they left. Deactivating
 * revokes access completely and keeps that attribution intact; deleting would
 * blank an author on published work to achieve nothing more.
 */
