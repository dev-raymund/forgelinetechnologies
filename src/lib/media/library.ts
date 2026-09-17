import "server-only";
import { list } from "@vercel/blob";
import manifest from "./static-manifest.json";
import { mergeMedia, type MediaItem } from "./merge";

export type { MediaItem } from "./merge";

function staticItems(): MediaItem[] {
  return (manifest as { path: string; bytes: number }[]).map((entry) => ({
    url: entry.path,
    name: entry.path.split("/").pop() ?? entry.path,
    source: "static" as const,
    bytes: entry.bytes,
  }));
}

/**
 * A Blob outage degrades the library to the committed assets with a reason the
 * reviewer can see. A picker that silently shows half its contents is worse
 * than one that says why.
 */
export async function listMedia(): Promise<{ items: MediaItem[]; blobError: string | null }> {
  const assets = staticItems();
  try {
    const { blobs } = await list({ prefix: "media/", limit: 1000 });
    const uploads: MediaItem[] = blobs.map((b) => ({
      url: b.url,
      name: b.pathname.split("/").pop() ?? b.pathname,
      source: "blob" as const,
      bytes: b.size,
      uploadedAt: new Date(b.uploadedAt).toISOString(),
    }));
    const items = mergeMedia(uploads, assets);

    // list() takes no access mode, so a token pointed at a private store
    // succeeds here and gives no warning — the images just never load on the
    // public site. A private store's blob URLs carry ".private.blob." in the
    // host instead of ".public.blob.", so that's the signal to check for.
    const isPrivateStore = blobs.some((b) => b.url.includes(".private.blob."));
    if (isPrivateStore) {
      return {
        items,
        blobError:
          "This Blob store is private. Uploaded images will not load on the public site — connect a store created with Public access (see docs/environment.md).",
      };
    }

    return { items, blobError: null };
  } catch (error) {
    console.error("[media] blob list failed", error);
    return {
      items: mergeMedia([], assets),
      blobError:
        // The SDK's "No blob credentials found" message names BLOB_READ_WRITE_TOKEN,
        // but on Vercel the missing piece is the OIDC connection, so name neither.
        error instanceof Error && error.message.includes("No blob credentials found")
          ? "Uploads are unavailable: Blob storage is not configured in this environment (see docs/environment.md)."
          : "Uploads are unavailable right now. The assets committed to the repository are still listed.",
    };
  }
}
