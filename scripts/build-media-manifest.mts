/**
 * Regenerates the static half of the media library.
 *
 *   npm run media:manifest
 *
 * The images in public/assets are committed to the repository and served by the
 * CDN, so they cannot be listed at runtime — a serverless bundle does not
 * reliably contain public/. Reading the directory here, at author time, and
 * committing the result keeps the picker honest in production.
 *
 * Re-run it whenever you add or remove a file under public/assets.
 */
import { readdir, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = "public/assets";
const OUT = "src/lib/media/static-manifest.json";
const IMAGE = /\.(?:png|jpe?g|webp|avif|gif|svg)$/i;

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const found: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(full)));
    else if (IMAGE.test(entry.name)) found.push(full);
  }
  return found;
}

const files = await walk(ROOT);
const manifest = await Promise.all(
  files.sort().map(async (file) => ({
    path: `/assets/${relative(ROOT, file).split("\\").join("/")}`,
    bytes: (await stat(file)).size,
  })),
);

await writeFile(OUT, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${manifest.length} entries to ${OUT}`);
