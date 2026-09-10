"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne, sql } from "drizzle-orm";
import { db, works, posts } from "@/db";
import { users, type User } from "@/db/schema";
import {
  getCurrentUser,
  createSession,
  destroySession,
  verifyPassword,
  hashPassword,
  dummyVerify,
  isAdmin,
} from "@/lib/auth";
import { requireUser, requireAdminRole } from "@/lib/guards";
import { slugify, uniqueSlug } from "@/lib/slug";

export type ActionState = { error?: string; ok?: boolean };

/* ---------------- auth ---------------- */

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.active, true)))
    .limit(1);

  // Burn the same CPU on an unknown email as on a wrong password, so the
  // response time doesn't reveal which accounts exist.
  if (!user) {
    await dummyVerify();
    return { error: "Incorrect email or password." };
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return { error: "Incorrect email or password." };
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createSession(user.id);
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

/* ---------------- users ---------------- */

/** How many active admins would remain if `excludeId` were removed or demoted. */
async function otherActiveAdmins(excludeId: number): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.active, true), ne(users.id, excludeId)));
  return row?.n ?? 0;
}

export async function saveUser(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireAdminRole();
  const idRaw = fd.get("id");
  const id = idRaw ? Number(idRaw) : null;

  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const name = String(fd.get("name") ?? "").trim();
  const role = String(fd.get("role") ?? "editor").trim();
  const active = fd.get("active") === "on";
  const password = String(fd.get("password") ?? "");

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (!["admin", "editor"].includes(role)) return { error: "Pick a valid role." };
  if (!id && password.length < 10) {
    return { error: "Set a password of at least 10 characters." };
  }
  if (password && password.length < 10) {
    return { error: "The new password must be at least 10 characters." };
  }

  // Email is unique in the DB; check first so the user gets a readable message.
  const [clash] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (clash && clash.id !== id) return { error: "Another user already has that email." };

  if (id) {
    // Never let the last way back in disappear.
    const losingAdmin = role !== "admin" || !active;
    if (losingAdmin && (await otherActiveAdmins(id)) === 0) {
      return { error: "This is the only active admin — promote someone else first." };
    }
    if (id === me.id && !active) {
      return { error: "You can't deactivate your own account." };
    }

    await db
      .update(users)
      .set({
        email,
        name,
        role,
        active,
        updatedAt: new Date(),
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      })
      .where(eq(users.id, id));
  } else {
    await db.insert(users).values({
      email,
      name,
      role,
      active,
      passwordHash: await hashPassword(password),
    });
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteUser(fd: FormData): Promise<void> {
  const me = await requireAdminRole();
  const id = Number(fd.get("id"));
  if (!id) return;
  // Both of these would lock somebody out; the UI hides them, this enforces it.
  if (id === me.id) return;
  if ((await otherActiveAdmins(id)) === 0) return;

  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin/users");
}

/* ---------------- works ---------------- */

function workFromForm(fd: FormData) {
  return {
    title: String(fd.get("title") ?? "").trim(),
    category: String(fd.get("category") ?? "sites").trim(),
    badge: String(fd.get("badge") ?? "").trim(),
    description: String(fd.get("description") ?? "").trim(),
    imageUrl: String(fd.get("imageUrl") ?? "").trim(),
    imageAlt: String(fd.get("imageAlt") ?? "").trim(),
    liveUrl: String(fd.get("liveUrl") ?? "").trim(),
    sortOrder: Number(fd.get("sortOrder") ?? 0) || 0,
    published: fd.get("published") === "on",
  };
}

export async function saveWork(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const idRaw = fd.get("id");
  const id = idRaw ? Number(idRaw) : null;
  const data = workFromForm(fd);

  if (!data.title) return { error: "Title is required." };
  if (!["apps", "ecommerce", "sites"].includes(data.category)) {
    return { error: "Pick a valid category." };
  }

  // Slug must stay unique; exclude the row being edited from the taken set.
  const rows = await db.select({ id: works.id, slug: works.slug }).from(works);
  const taken = new Set(rows.filter((r) => r.id !== id).map((r) => r.slug));
  const slug = uniqueSlug(slugify(data.title), taken);

  if (id) {
    await db.update(works).set({ ...data, slug, updatedAt: new Date() }).where(eq(works.id, id));
  } else {
    await db.insert(works).values({ ...data, slug });
  }

  revalidatePath("/");
  revalidatePath("/admin/works");
  redirect("/admin/works");
}

export async function deleteWork(fd: FormData): Promise<void> {
  await requireUser();
  const id = Number(fd.get("id"));
  if (!id) return;
  await db.delete(works).where(eq(works.id, id));
  revalidatePath("/");
  revalidatePath("/admin/works");
}

/* ---------------- posts ---------------- */

function postFromForm(fd: FormData) {
  return {
    title: String(fd.get("title") ?? "").trim(),
    excerpt: String(fd.get("excerpt") ?? "").trim(),
    body: String(fd.get("body") ?? ""),
    coverUrl: String(fd.get("coverUrl") ?? "").trim(),
    coverAlt: String(fd.get("coverAlt") ?? "").trim(),
    tags: String(fd.get("tags") ?? "").trim(),
    published: fd.get("published") === "on",
  };
}

export async function savePost(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const idRaw = fd.get("id");
  const id = idRaw ? Number(idRaw) : null;
  const data = postFromForm(fd);

  if (!data.title) return { error: "Title is required." };

  const rows = await db.select({ id: posts.id, slug: posts.slug }).from(posts);
  const taken = new Set(rows.filter((r) => r.id !== id).map((r) => r.slug));

  // Keep a published post's slug stable so live URLs don't break on edit.
  let slug: string;
  const existing = id ? await db.select().from(posts).where(eq(posts.id, id)).limit(1) : [];
  const prevRow = existing[0];
  if (prevRow?.published) {
    slug = prevRow.slug;
  } else {
    slug = uniqueSlug(slugify(data.title), taken);
  }

  // publishedAt is set once, on first publish, then frozen.
  const publishedAt =
    data.published && !prevRow?.publishedAt ? new Date() : (prevRow?.publishedAt ?? null);

  if (id) {
    await db
      .update(posts)
      .set({ ...data, slug, publishedAt, updatedAt: new Date() })
      .where(eq(posts.id, id));
  } else {
    await db.insert(posts).values({ ...data, slug, publishedAt });
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}

export async function deletePost(fd: FormData): Promise<void> {
  await requireUser();
  const id = Number(fd.get("id"));
  if (!id) return;
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  await db.delete(posts).where(eq(posts.id, id));
  revalidatePath("/blog");
  if (row) revalidatePath(`/blog/${row.slug}`);
  revalidatePath("/admin/posts");
}

/** Quick publish/unpublish straight from the list view. */
export async function togglePostPublished(fd: FormData): Promise<void> {
  await requireUser();
  const id = Number(fd.get("id"));
  if (!id) return;
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!row) return;
  const next = !row.published;
  await db
    .update(posts)
    .set({
      published: next,
      publishedAt: next && !row.publishedAt ? new Date() : row.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id));
  revalidatePath("/blog");
  revalidatePath(`/blog/${row.slug}`);
  revalidatePath("/admin/posts");
}
