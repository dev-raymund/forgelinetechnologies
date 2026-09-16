/**
 * Naming and validation for uploaded media.
 *
 * Pure and dependency-free so the same rules can run in the browser for fast
 * feedback and on the server as the actual guarantee. The upload route is a
 * public endpoint, so nothing the client computes may be trusted.
 */

export const ALLOWED_UPLOAD_TYPES: readonly string[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

/**
 * SVG is absent on purpose. It is executable markup, so an uploaded one is an
 * XSS vector the moment anything inlines it. The logos in public/assets are
 * SVGs, but they are committed to the repository and therefore trusted.
 */

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  png: "png",
  jpg: "jpg",
  jpeg: "jpeg",
  webp: "webp",
  avif: "avif",
  gif: "gif",
};

const PATHNAME = /^media\/\d{4}\/\d{2}\/[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f]{8}\.(?:png|jpg|jpeg|webp|avif|gif)$/;

function slug(value: string): string {
  const normalized = value.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const cleaned = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
  return cleaned || "image";
}

function randomSuffix(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * The stored path. Every component is derived, never taken from the caller: the
 * basename is slugged to `[a-z0-9-]`, so a crafted filename carrying `../` or a
 * directory cannot reach outside the dated `media/` prefix.
 */
export function blobPathname(
  filename: string,
  now: Date = new Date(),
  random: () => string = randomSuffix,
): string {
  const base = filename.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0) throw new Error("A media file needs an image extension.");

  const extension = EXTENSIONS[base.slice(dot + 1).toLowerCase()];
  if (!extension) throw new Error("That file type cannot be uploaded.");

  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `media/${year}/${month}/${slug(base.slice(0, dot))}-${random()}.${extension}`;
}

/** The server's check that a client-supplied pathname is one we would have made. */
export function isSafeBlobPathname(pathname: string): boolean {
  return PATHNAME.test(pathname);
}

export function isAllowedUpload(contentType: string, bytes: number): boolean {
  if (bytes <= 0 || bytes > MAX_UPLOAD_BYTES) return false;
  return ALLOWED_UPLOAD_TYPES.includes(contentType);
}
