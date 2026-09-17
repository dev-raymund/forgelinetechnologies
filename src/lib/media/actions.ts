"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { eq, or } from "drizzle-orm";
import { authorise } from "@/lib/auth/guard";
import { audit } from "@/lib/auth/audit";
import { getDb, posts, projects } from "@/db";
import { withRetry } from "@/lib/queries";

/**
 * Only uploads can be deleted. A static item lives in the repository and is
 * removed by deleting the file and re-running `npm run media:manifest`.
 */

/**
 * A parsed check, not a regex on the raw string. `hostname` is what the URL
 * parser (and therefore what a browser or fetch) actually treats as the
 * host, so `https://x.public.blob.vercel-storage.com@evil.com/y.png` — whose
 * parsed hostname is `evil.com`, the text before the `@` being userinfo, not
 * host — is refused rather than matched by a lookalike prefix. The store id
 * contains upper-case characters, hence the explicit lower-casing.
 */
function isPublicBlobUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return (
    parsed.protocol === "https:" &&
    parsed.hostname.toLowerCase().endsWith(".public.blob.vercel-storage.com")
  );
}

const MAX_NAMED_USAGES = 3;

/** "a", "a and b", or "a, b, and c" — never an Oxford-comma-free "a, b and c". */
function joinNatural(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * What currently points at this URL, worded for the delete confirmation.
 * Read-only, and run before `del()` so an in-use image is never actually
 * removed — deleting one breaks a published post's cover or `og:image`, or a
 * published work's image, with no warning and no recovery.
 */
async function usages(url: string): Promise<string[]> {
  const [postRows, projectRows] = await withRetry(() =>
    Promise.all([
      getDb()
        .select({ title: posts.title })
        .from(posts)
        .where(or(eq(posts.coverUrl, url), eq(posts.ogImage, url))),
      getDb().select({ title: projects.title }).from(projects).where(eq(projects.imageUrl, url)),
    ]),
  );
  return [
    ...postRows.map((p) => `the post “${p.title}”`),
    ...projectRows.map((p) => `the work “${p.title}”`),
  ];
}

export async function deleteMedia(url: string): Promise<{ ok: true } | { error: string }> {
  const authorised = await authorise("media.manage");
  if (!authorised.ok) return { error: authorised.error };

  if (!isPublicBlobUrl(url)) {
    return { error: "Only uploaded files can be deleted." };
  }

  const usedBy = await usages(url);
  if (usedBy.length > 0) {
    const shown = usedBy.slice(0, MAX_NAMED_USAGES);
    const extra = usedBy.length - shown.length;
    const named = extra > 0 ? `${shown.join(", ")}, and ${extra} more` : joinNatural(shown);
    return {
      error: `Used by ${named}. Change ${usedBy.length === 1 ? "that image" : "those images"} first.`,
    };
  }

  try {
    await del(url);
  } catch (error) {
    console.error("[media] delete failed", error);
    return { error: "That file could not be deleted. Try again." };
  }

  await audit({
    action: "media.delete",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "media",
    detail: url.slice(0, 300),
  });

  revalidatePath("/admin/media");
  return { ok: true };
}
