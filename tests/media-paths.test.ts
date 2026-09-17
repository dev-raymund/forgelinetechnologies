import assert from "node:assert/strict";
import test from "node:test";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  blobPathname,
  isAllowedUpload,
  isSafeBlobPathname,
} from "../src/lib/media/paths.ts";

const at = new Date("2026-03-07T00:00:00.000Z");
const fixed = () => "a1b2c3d4";

test("blobPathname builds a dated, slugged, collision-proof path", () => {
  assert.equal(blobPathname("Hero Image.PNG", at, fixed), "media/2026/03/hero-image-a1b2c3d4.png");
  assert.equal(blobPathname("photo.jpeg", at, fixed), "media/2026/03/photo-a1b2c3d4.jpeg");
  assert.equal(blobPathname("Ünïcödé näme.webp", at, fixed), "media/2026/03/unicode-name-a1b2c3d4.webp");
  assert.equal(blobPathname("lots   of---spaces.gif", at, fixed), "media/2026/03/lots-of-spaces-a1b2c3d4.gif");
});

test("blobPathname cannot be made to escape the media prefix", () => {
  for (const evil of [
    "../../etc/passwd.png",
    "..\\..\\windows\\thing.png",
    "/absolute/path.png",
    "nested/dir/file.png",
    "....//....//x.png",
  ]) {
    const result = blobPathname(evil, at, fixed);
    assert.ok(result.startsWith("media/2026/03/"), `${evil} -> ${result}`);
    assert.ok(!result.includes(".."), `${evil} -> ${result}`);
    assert.equal(result.split("/").length, 4, `${evil} -> ${result}`);
  }
});

test("blobPathname falls back to a name when there is nothing usable", () => {
  const result = blobPathname("???.png", at, fixed);
  assert.equal(result, "media/2026/03/image-a1b2c3d4.png");
});

test("blobPathname rejects an extension that is not an allowed image", () => {
  assert.throws(() => blobPathname("script.svg", at, fixed));
  assert.throws(() => blobPathname("archive.zip", at, fixed));
  assert.throws(() => blobPathname("noextension", at, fixed));
});

test("isSafeBlobPathname accepts only what blobPathname produces", () => {
  assert.equal(isSafeBlobPathname("media/2026/03/hero-image-a1b2c3d4.png"), true);
  assert.equal(isSafeBlobPathname("media/2026/03/x-a1b2c3d4.webp"), true);

  assert.equal(isSafeBlobPathname("media/2026/03/../../../evil.png"), false);
  assert.equal(isSafeBlobPathname("other/2026/03/hero-a1b2c3d4.png"), false);
  assert.equal(isSafeBlobPathname("media/2026/03/hero-a1b2c3d4.svg"), false);
  assert.equal(isSafeBlobPathname("media/26/3/hero-a1b2c3d4.png"), false);
  assert.equal(isSafeBlobPathname("media/2026/03/HERO-a1b2c3d4.png"), false);
  assert.equal(isSafeBlobPathname("media/2026/03/hero-xyz.png"), false);
  assert.equal(isSafeBlobPathname(""), false);
});

test("isAllowedUpload enforces the type allow-list and the size cap", () => {
  assert.equal(isAllowedUpload("image/png", 1_000), true);
  assert.equal(isAllowedUpload("image/jpeg", MAX_UPLOAD_BYTES), true);

  assert.equal(isAllowedUpload("image/png", MAX_UPLOAD_BYTES + 1), false);
  assert.equal(isAllowedUpload("image/png", 0), false);
  assert.equal(isAllowedUpload("application/pdf", 1_000), false);
  assert.equal(isAllowedUpload("text/html", 1_000), false);
});

test("SVG is deliberately not uploadable", () => {
  assert.equal(ALLOWED_UPLOAD_TYPES.includes("image/svg+xml"), false);
  assert.equal(isAllowedUpload("image/svg+xml", 1_000), false);
});
