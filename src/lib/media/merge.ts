/**
 * The shape of one library entry, and the ordering rule.
 *
 * Deliberately import-free and separate from library.ts, which is
 * `server-only` and therefore cannot be loaded by a plain Node test.
 */
export type MediaItem = {
  url: string;
  name: string;
  source: "blob" | "static";
  bytes: number;
  uploadedAt?: string;
};

/** Uploads newest-first, then the committed assets by name, de-duplicated by url. */
export function mergeMedia(blobs: MediaItem[], statics: MediaItem[]): MediaItem[] {
  const uploads = [...blobs].sort((a, b) => (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? ""));
  const assets = [...statics].sort((a, b) => a.name.localeCompare(b.name));

  const seen = new Set<string>();
  return [...uploads, ...assets].filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}
