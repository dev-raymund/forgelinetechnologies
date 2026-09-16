import assert from "node:assert/strict";
import test from "node:test";
import { site, absoluteUrl } from "../src/lib/site.ts";

// site.ts imports nothing (no "server-only", no Next APIs), so it is one of
// the few modules under src/ that a plain `node:test` run can load directly.

test("absoluteUrl prefixes a repository-relative path with the site origin", () => {
  assert.equal(absoluteUrl("/assets/projects/mhc.jpg"), `${site.url}/assets/projects/mhc.jpg`);
});

test("absoluteUrl leaves an already-absolute Blob URL untouched", () => {
  const blobUrl = "https://abc.public.blob.vercel-storage.com/media/2026/09/x-1a2b3c4d.png";
  assert.equal(absoluteUrl(blobUrl), blobUrl);
});

test("absoluteUrl never produces the mangled double-origin string a naive concatenation would", () => {
  const blobUrl = "https://abc.public.blob.vercel-storage.com/media/2026/09/x-1a2b3c4d.png";
  assert.ok(!absoluteUrl(blobUrl).startsWith(site.url));
});
