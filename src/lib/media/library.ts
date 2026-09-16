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
    return { items: mergeMedia(uploads, assets), blobError: null };
  } catch (error) {
    console.error("[media] blob list failed", error);
    return {
      items: mergeMedia([], assets),
      blobError:
        error instanceof Error && error.message.includes("BLOB_READ_WRITE_TOKEN")
          ? "Uploads are unavailable: BLOB_READ_WRITE_TOKEN is not set in this environment."
          : "Uploads are unavailable right now. The assets committed to the repository are still listed.",
    };
  }
}
