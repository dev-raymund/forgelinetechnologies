import assert from "node:assert/strict";
import test from "node:test";
import { mergeMedia, type MediaItem } from "../src/lib/media/merge.ts";

const blob = (name: string, uploadedAt: string): MediaItem => ({
  url: `https://x.public.blob.vercel-storage.com/media/2026/03/${name}`,
  name,
  source: "blob",
  bytes: 100,
  uploadedAt,
});

const still = (name: string): MediaItem => ({
  url: `/assets/${name}`,
  name,
  source: "static",
  bytes: 200,
});

test("uploads come first, newest first, then static assets by name", () => {
  const merged = mergeMedia(
    [blob("b.png", "2026-03-01T00:00:00Z"), blob("a.png", "2026-03-05T00:00:00Z")],
    [still("zebra.jpg"), still("apple.jpg")],
  );
  assert.deepEqual(merged.map((m) => m.name), ["a.png", "b.png", "apple.jpg", "zebra.jpg"]);
});

test("the same url is never listed twice", () => {
  const one = blob("a.png", "2026-03-01T00:00:00Z");
  const merged = mergeMedia([one, { ...one }], [still("apple.jpg")]);
  assert.equal(merged.length, 2);
});

test("an empty library merges to an empty list", () => {
  assert.deepEqual(mergeMedia([], []), []);
});
