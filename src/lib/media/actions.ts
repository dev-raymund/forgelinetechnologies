"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { authorise } from "@/lib/auth/guard";
import { audit } from "@/lib/auth/audit";

/**
 * Only uploads can be deleted. A static item lives in the repository and is
 * removed by deleting the file and re-running `npm run media:manifest`.
 */
export async function deleteMedia(url: string): Promise<{ ok: true } | { error: string }> {
  const authorised = await authorise("media.manage");
  if (!authorised.ok) return { error: authorised.error };

  if (!/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(url)) {
    return { error: "Only uploaded files can be deleted." };
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
