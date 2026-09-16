# Admin Media Library and Password Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the admin a reveal toggle on every password input, and a media library that uploads images by drag-and-drop and inserts their URLs into the blog and works forms.

**Architecture:** Uploads go to Vercel Blob by client-side direct upload, because Vercel's runtime filesystem is read-only and Next server actions cap request bodies at 1 MB. A route handler authorises and issues a scoped token; the browser then uploads straight to Blob. The picker lists Blob contents merged with a committed build-time manifest of `public/assets`, so the 44 existing images stay reusable.

**Tech Stack:** Next.js 16 App Router, TypeScript, `@vercel/blob`, `node:test` with `--experimental-strip-types`.

**Spec:** [`docs/superpowers/specs/2026-09-16-admin-media-library-design.md`](../specs/2026-09-16-admin-media-library-design.md)

## Global Constraints

- **Exactly one new runtime dependency: `@vercel/blob`.** Nothing else. This project ships eight dependencies deliberately and hand-rolls its admin UI — no component library, no dropzone library, no icon package.
- **No SVG uploads.** `image/svg+xml` must never appear in an allow-list. An SVG is executable markup; a user-uploaded one is an XSS vector. The existing SVG logos stay in the repo.
- **The upload token route is a public HTTP endpoint.** It authorises `media.manage` *before* issuing a token and re-validates content type, size and pathname server-side. Client-side checks are advisory only.
- **Imports:** files under `src/app/` and `src/components/` use the `@/` alias **without** file extensions. Files in `src/lib/` use the same `@/` alias where the existing file does — match whatever the file you are editing already does. `scripts/*.mts` import `../src/...` with explicit `.ts` extensions.
- **Tests:** `node:test` + `node:assert/strict`, in `tests/`, no network and no database. Run one file with `node --test --experimental-strip-types tests/<name>.test.ts`; everything with `npm test`.
- **Never fabricate.** No invented URLs, no placeholder images, no guessed file sizes.
- **Commit style:** plain imperative sentence case, NO conventional-commit prefix (matching `git log`). End every commit message with:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- **Capability:** every new route, page and action requires `media.manage`.
- **Verification for UI work:** this project has no React test harness. Components are verified by `npx tsc --noEmit`, `npm run lint`, `npm run build`, and explicit reasoning recorded in the report — the same standard the rest of this admin is held to.

---

### Task 1: Password reveal toggle

**Files:**
- Create: `src/components/admin/password-field.tsx`
- Modify: `src/components/admin/login-form.tsx:63-72`
- Modify: `src/components/admin/user-manager.tsx:112`
- Modify: `src/components/admin/user-manager.tsx:230-237`

**Interfaces:**
- Consumes: nothing.
- Produces: `PasswordField` — a client component taking `{ id, name, className, required?, minLength?, placeholder?, autoComplete?, defaultValue? }` and rendering an input with a reveal toggle.

- [ ] **Step 1: Write the component**

Create `src/components/admin/password-field.tsx`:

```tsx
"use client";

import { useId, useState } from "react";

/**
 * A password input with a reveal toggle.
 *
 * The two account-management fields used to be `type="text"`, so a password
 * being set for someone else sat readable on screen. Masking by default and
 * revealing on a deliberate click is the safer default; the toggle keeps it
 * possible to check what was typed.
 */
export function PasswordField({
  id,
  name,
  className,
  required,
  minLength,
  placeholder,
  autoComplete,
  defaultValue,
}: {
  id: string;
  name: string;
  className: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  autoComplete?: string;
  defaultValue?: string;
}) {
  const [shown, setShown] = useState(false);
  const describedBy = useId();

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={shown ? "text" : "password"}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-describedby={describedBy}
        className={`${className} pr-20`}
      />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-pressed={shown}
        aria-label={shown ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 px-3 text-[0.8125rem] font-medium text-muted transition-colors hover:text-graphite focus:text-graphite focus:outline-none"
      >
        {shown ? "Hide" : "Show"}
      </button>
      <span id={describedBy} className="sr-only">
        {shown ? "Password is visible" : "Password is hidden"}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Use it in the login form**

In `src/components/admin/login-form.tsx`, add the import at the top:

```tsx
import { PasswordField } from "@/components/admin/password-field";
```

Replace the `<input id="admin-password" …>` element with:

```tsx
        <PasswordField
          id="admin-password"
          name="password"
          required
          autoComplete="current-password"
          className="mt-2 w-full rounded-sm border border-rule-strong bg-white px-3 py-2.5 text-[0.9375rem] text-graphite focus:border-ink focus:outline-none"
        />
```

- [ ] **Step 3: Use it in both user-manager fields**

In `src/components/admin/user-manager.tsx`, add the same import.

Replace the new-user input (currently `<input id="new-password" name="password" type="text" autoComplete="off" className={field} />`) with:

```tsx
                <PasswordField id="new-password" name="password" autoComplete="off" className={field} />
```

Replace the reset input (currently `<input id={`pw-${u.id}`} … type="text" …>`) with:

```tsx
                          <PasswordField
                            id={`pw-${u.id}`}
                            name="password"
                            autoComplete="new-password"
                            minLength={12}
                            placeholder="Type a password, or leave empty to generate one"
                            className={field}
                          />
```

Leave the one-time generated-password readout (the `{issued.password}` paragraph) exactly as it is — it must stay visible so it can be copied.

- [ ] **Step 4: Verify**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all clean, 31 tests still passing.

In the report, state explicitly: which three inputs now use the component, that the generated-password readout was not changed, and that the toggle is `type="button"` so it cannot submit either form.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/password-field.tsx src/components/admin/login-form.tsx src/components/admin/user-manager.tsx
git commit -m "$(cat <<'EOF'
Mask passwords by default and let the admin reveal them

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Pure media helpers

**Files:**
- Create: `src/lib/media/paths.ts`
- Test: `tests/media-paths.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ALLOWED_UPLOAD_TYPES: readonly string[]`
  - `MAX_UPLOAD_BYTES: number`
  - `blobPathname(filename: string, now?: Date, random?: () => string): string`
  - `isSafeBlobPathname(pathname: string): boolean`
  - `isAllowedUpload(contentType: string, bytes: number): boolean`

- [ ] **Step 1: Write the failing test**

Create `tests/media-paths.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/media-paths.test.ts`
Expected: FAIL — `Cannot find module '../src/lib/media/paths.ts'`

- [ ] **Step 3: Write the implementation**

Create `src/lib/media/paths.ts`:

```ts
/**
 * Naming and validation for uploaded media.
 *
 * Pure and dependency-free so the same rules can run in the browser for fast
 * feedback and on the server as the actual guarantee. The upload route is a
 * public endpoint, so nothing the client computes may be trusted.
 */

export const ALLOWED_UPLOAD_TYPES = [
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
  const normalized = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
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
  return (ALLOWED_UPLOAD_TYPES as readonly string[]).includes(contentType);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/media-paths.test.ts`
Expected: PASS — 7 tests

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: 38 tests pass, exit 0

- [ ] **Step 6: Commit**

```bash
git add src/lib/media/paths.ts tests/media-paths.test.ts
git commit -m "$(cat <<'EOF'
Name and validate uploaded media without trusting the client

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Capability, audit actions, and the static manifest

**Files:**
- Modify: `src/lib/auth/capabilities.ts:13-20`
- Modify: `src/lib/auth/audit.ts` (the `AuditAction` union)
- Modify: `tests/capabilities.test.ts`
- Create: `scripts/build-media-manifest.mts`
- Create: `src/lib/media/static-manifest.json`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: nothing.
- Produces: capability `"media.manage"`; audit actions `"media.upload"` and `"media.delete"`; `src/lib/media/static-manifest.json` as `{ path: string; bytes: number }[]`; npm script `media:manifest`.

- [ ] **Step 1: Add the capability and audit actions**

In `src/lib/auth/capabilities.ts`, add to the `CAPABILITIES` object after `"inquiries.manage"`:

```ts
  "media.manage": ["admin", "editor"],
```

In `src/lib/auth/audit.ts`, extend the `AuditAction` union by adding to its final line:

```ts
  | "media.upload" | "media.delete";
```

(That is, the line currently ending `| "user.create" | "user.update" | "user.deactivate" | "user.delete";` becomes the same list without its semicolon, followed by the new line above.)

- [ ] **Step 2: Extend the capability test**

In `tests/capabilities.test.ts`, add:

```ts
test("media is managed by admins and editors, like posts and works", () => {
  assert.equal(roleHas("admin", "media.manage"), true);
  assert.equal(roleHas("editor", "media.manage"), true);
  assert.equal(roleHas("unknown", "media.manage"), false);
});
```

Import `roleHas` the same way the file already does; do not change existing tests.

- [ ] **Step 3: Write the manifest generator**

Create `scripts/build-media-manifest.mts`:

```ts
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
```

- [ ] **Step 4: Register the script and generate the manifest**

In `package.json`, add to `scripts`:

```json
    "media:manifest": "node ./node_modules/tsx/dist/cli.mjs scripts/build-media-manifest.mts",
```

Then run it:

Run: `npm run media:manifest`
Expected: `Wrote 44 entries to src/lib/media/static-manifest.json` (the count must match `find public/assets -type f | wc -l`; if it differs, say so in your report rather than adjusting the number).

- [ ] **Step 5: Verify**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: 39 tests pass, exit 0. If `resolveJsonModule` is not already enabled in `tsconfig.json`, importing the JSON will fail typecheck — it IS enabled, so this should pass; report it if not.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth/capabilities.ts src/lib/auth/audit.ts tests/capabilities.test.ts scripts/build-media-manifest.mts src/lib/media/static-manifest.json package.json
git commit -m "$(cat <<'EOF'
Add a media capability and a manifest of the committed assets

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Blob wiring — dependency, listing, deletion, upload token

**Files:**
- Modify: `package.json`, `package-lock.json` (add `@vercel/blob`)
- Create: `src/lib/media/library.ts`
- Create: `src/lib/media/actions.ts`
- Create: `src/app/api/media/upload/route.ts`
- Modify: `next.config.ts`
- Test: `tests/media-merge.test.ts`

**Interfaces:**
- Consumes: `ALLOWED_UPLOAD_TYPES`, `MAX_UPLOAD_BYTES`, `isAllowedUpload`, `isSafeBlobPathname` (Task 2); `media.manage` and the audit actions (Task 3).
- Produces:
  - `type MediaItem = { url: string; name: string; source: "blob" | "static"; bytes: number; uploadedAt?: string }`
  - `mergeMedia(blobs: MediaItem[], statics: MediaItem[]): MediaItem[]`
  - `listMedia(): Promise<{ items: MediaItem[]; blobError: string | null }>`
  - `deleteMedia(url: string): Promise<{ ok: true } | { error: string }>`
  - `POST /api/media/upload`

- [ ] **Step 1: Install the dependency**

Run: `npm install @vercel/blob`
Expected: exits 0, `@vercel/blob` appears in `dependencies`.

- [ ] **Step 2: Write the failing merge test**

Create `tests/media-merge.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { mergeMedia, type MediaItem } from "../src/lib/media/library.ts";

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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/media-merge.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Write the library module**

Create `src/lib/media/library.ts`:

```ts
import "server-only";
import { list } from "@vercel/blob";
import manifest from "./static-manifest.json";

export type MediaItem = {
  url: string;
  name: string;
  source: "blob" | "static";
  bytes: number;
  uploadedAt?: string;
};

/** Pure: uploads newest-first, then the committed assets by name, de-duplicated by url. */
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
```

- [ ] **Step 5: Run the merge test to verify it passes**

Run: `node --test --experimental-strip-types tests/media-merge.test.ts`
Expected: PASS — 3 tests

- [ ] **Step 6: Write the delete action**

Create `src/lib/media/actions.ts`:

```ts
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
```

- [ ] **Step 7: Write the upload token route**

Create `src/app/api/media/upload/route.ts`:

```ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { authorise } from "@/lib/auth/guard";
import { audit } from "@/lib/auth/audit";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  isSafeBlobPathname,
} from "@/lib/media/paths";

/**
 * Issues a scoped upload token so the browser can send bytes straight to Blob.
 *
 * This is a public HTTP endpoint. It authorises before issuing anything, and
 * re-checks the pathname and the type and size limits here rather than trusting
 * the client that computed them.
 */
export async function POST(request: Request): Promise<Response> {
  const authorised = await authorise("media.manage");
  if (!authorised.ok) {
    return Response.json({ error: "Not authorised." }, { status: 403 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!isSafeBlobPathname(pathname)) {
          throw new Error("That file name is not allowed.");
        }
        return {
          allowedContentTypes: [...ALLOWED_UPLOAD_TYPES],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({
            userId: authorised.user.id,
            email: authorised.user.email,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const actor = tokenPayload ? (JSON.parse(tokenPayload) as { userId: number; email: string }) : null;
        await audit({
          action: "media.upload",
          userId: actor?.userId ?? null,
          actorEmail: actor?.email ?? "",
          entity: "media",
          detail: blob.pathname.slice(0, 300),
        });
      },
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
```

- [ ] **Step 8: Allow the blob host through next/image**

In `next.config.ts`, add an `images` key to the exported config object (alongside the existing keys — do not remove anything):

```ts
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
```

- [ ] **Step 9: Verify**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: 42 tests pass, all clean, `/api/media/upload` present in the route list.

Do NOT attempt an actual upload in this task — there is no UI yet, and the end-to-end pass happens in Task 6.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json src/lib/media/library.ts src/lib/media/actions.ts src/app/api/media/upload next.config.ts tests/media-merge.test.ts
git commit -m "$(cat <<'EOF'
Store uploaded media in Vercel Blob behind an authorised token

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: The media library UI and its page

**Files:**
- Create: `src/components/admin/media/media-library.tsx`
- Create: `src/app/admin/media/page.tsx`
- Modify: `src/components/admin/icons.tsx`
- Modify: `src/components/admin/nav.tsx:27-34`
- Modify: `src/components/admin/shell.tsx:26-33`

**Interfaces:**
- Consumes: `MediaItem`, `listMedia` (Task 4); `deleteMedia` (Task 4); `blobPathname`, `isAllowedUpload`, `ALLOWED_UPLOAD_TYPES`, `MAX_UPLOAD_BYTES` (Task 2).
- Produces: `MediaLibrary` — a client component taking `{ items, blobError, onSelect? }`. When `onSelect` is absent it renders in manage mode.

- [ ] **Step 1: Add an image icon**

In `src/components/admin/icons.tsx`, add alongside the other icons (they all use the local `Svg` wrapper and an `IconProps` type on a 16×16 viewBox):

```tsx
/** Media — a picture frame with a hill and a sun. */
export function ImageIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="1.8" y="2.8" width="12.4" height="10.4" rx="1.2" />
      <circle cx="5.8" cy="6.4" r="1.1" />
      <path d="M2.4 11.6l3.4-3.2 3 2.6 2-1.8 2.8 2.4" />
    </Svg>
  );
}
```

In `src/components/admin/nav.tsx`, add `ImageIcon` to the existing import list from `./icons`, and add to the `ICONS` map:

```ts
  image: ImageIcon,
```

- [ ] **Step 2: Build the library component**

Create `src/components/admin/media/media-library.tsx` as a `"use client"` component.

Required behaviour, all of it:

- **Props:** `{ items: MediaItem[]; blobError: string | null; onSelect?: (url: string) => void }`.
- **Dropzone:** a bordered region that accepts both a drop and a click. On click it opens a hidden `<input type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" multiple>`. Handle `onDragOver`/`onDragEnter` with `preventDefault()` and a visible hover state, `onDragLeave` to clear it, and `onDrop` reading `event.dataTransfer.files`.
- **Per-file validation before upload:** call `isAllowedUpload(file.type, file.size)`; on failure push a per-file error naming the file and why (type not allowed, or over the 8 MB cap) and skip it. This is fast feedback only — the route re-checks.
- **Upload:** for each accepted file call `upload(blobPathname(file.name), file, { access: "public", handleUploadUrl: "/api/media/upload", contentType: file.type })`, importing `upload` from `@vercel/blob/client`. Track per-file progress with `onUploadProgress` and show it. Upload files sequentially, not in parallel, so a large batch cannot open many connections at once.
- **After all uploads settle:** call `router.refresh()` from `next/navigation` so the server re-lists.
- **Grid:** each item as a thumbnail using a plain `<img>` with `loading="lazy"` and `alt=""` (these are chrome, not content; the real alt text lives on the published page). Show the name and a human size. Tag static items visibly as living in the repository.
- **Search:** a text input filtering on `name`, case-insensitive.
- **Select:** when `onSelect` is provided, clicking an item calls `onSelect(item.url)`. When it is absent, clicking copies the URL to the clipboard and shows a brief confirmation.
- **Delete:** a button on Blob items only, calling `deleteMedia(item.url)` through `useTransition`, then `router.refresh()`. Static items show a disabled control with the title "Committed to the repository — delete the file and re-run npm run media:manifest".
- **blobError:** when non-null, render it at the top in the same `role="alert"` bordered style the other admin forms use, and disable the dropzone, since uploading cannot work.
- **Empty state:** use the shared `Empty` primitive from `@/components/admin/ui`.

Match the visual language of `src/components/admin/prospecting/audit-form.tsx` — the same rounded-sm borders, `border-rule`, text sizes and accent button styling.

- [ ] **Step 3: Build the page**

Create `src/app/admin/media/page.tsx`:

```tsx
import { requireCapability } from "@/lib/auth/guard";
import { listMedia } from "@/lib/media/library";
import { PageTitle } from "@/components/admin/ui";
import { MediaLibrary } from "@/components/admin/media/media-library";

export const metadata = { title: "Media" };

export default async function MediaPage() {
  await requireCapability("media.manage", "/admin/media");
  const { items, blobError } = await listMedia();

  return (
    <>
      <PageTitle
        title="Media"
        count={`${items.length} ${items.length === 1 ? "image" : "images"}`}
      />
      <MediaLibrary items={items} blobError={blobError} />
    </>
  );
}
```

- [ ] **Step 4: Add the navigation link**

In `src/components/admin/shell.tsx`, add to the `LINKS` array after the Works entry:

```ts
  { href: "/admin/media", label: "Media", capability: "media.manage", icon: "image" },
```

- [ ] **Step 5: Verify**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: 42 tests pass, all clean, `/admin/media` in the route list.

In the report, state how you verified the dropzone handlers, since there is no test harness: name each event handler and what it does.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/media src/app/admin/media src/components/admin/icons.tsx src/components/admin/nav.tsx src/components/admin/shell.tsx
git commit -m "$(cat <<'EOF'
Add a media library with drag and drop uploads

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: The inline picker, the three form fields, and documentation

**Files:**
- Create: `src/components/admin/media/media-picker.tsx`
- Modify: `src/components/admin/post-form.tsx:185` and `:201`
- Modify: `src/components/admin/work-form.tsx:109` and its `Text` helper at `:161-178`
- Modify: `docs/environment.md`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `MediaLibrary` (Task 5), `listMedia` (Task 4).
- Produces: `MediaPicker` — `{ targetId: string }`, a button plus modal that writes the chosen URL into the input with that id.

- [ ] **Step 1: Build the picker**

Create `src/components/admin/media/media-picker.tsx` as a `"use client"` component.

Required behaviour:

- **Props:** `{ targetId: string; items: MediaItem[]; blobError: string | null }`.
- Renders a `<button type="button">Choose image</button>` styled as a secondary control (match the "Re-run audit" button styling in `src/components/admin/prospecting/rerun-button.tsx`).
- Clicking opens a modal: a fixed overlay with `role="dialog"` and `aria-modal="true"`, closing on Escape, on a click of the backdrop, and via an explicit Close button. Restore focus to the trigger on close.
- Inside the modal renders `<MediaLibrary items={items} blobError={blobError} onSelect={…} />`.
- `onSelect(url)` writes into the target input **imperatively**, because these are uncontrolled inputs with `defaultValue`:

```ts
const input = document.getElementById(targetId) as HTMLInputElement | null;
if (input) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, url);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
```

Using the native setter and dispatching `input` means React's own change tracking observes the new value, which a plain `input.value = url` does not. Then close the modal.

- [ ] **Step 2: Give the work-form Text helper a slot**

In `src/components/admin/work-form.tsx`, extend the private `Text` helper to accept an optional trailing action:

```tsx
function Text({
  name,
  label,
  defaultValue,
  required,
  action,
}: {
  name: string;
  label: string;
  defaultValue: string;
  required?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-start gap-2">
        <input id={name} name={name} defaultValue={defaultValue} required={required} className={`${field} flex-1`} />
        {action}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire the three fields**

Both forms are client components, so they cannot call `listMedia` themselves. Their parent pages must load the library and pass it down.

For each of `src/app/admin/blog/new/page.tsx`, `src/app/admin/blog/[id]/edit/page.tsx`, `src/app/admin/works/new/page.tsx` and `src/app/admin/works/[id]/edit/page.tsx`: call `listMedia()` alongside the existing data load and pass `mediaItems` and `mediaError` into the form component.

In `src/components/admin/post-form.tsx`, accept those two new props and render beside each field:

```tsx
<MediaPicker targetId="coverUrl" items={mediaItems} blobError={mediaError} />
```

and

```tsx
<MediaPicker targetId="ogImage" items={mediaItems} blobError={mediaError} />
```

In `src/components/admin/work-form.tsx`, accept the same two props and pass the picker through the new slot:

```tsx
<Text
  name="imageUrl"
  label="Image path"
  defaultValue={initial.imageUrl}
  action={<MediaPicker targetId="imageUrl" items={mediaItems} blobError={mediaError} />}
/>
```

- [ ] **Step 4: Document the environment variable**

In `.env.example`, add at the end:

```
# --- Media library -----------------------------------------------------------
# Vercel Blob read/write token, from the Blob store in the Vercel dashboard.
# Required for image uploads. Without it the library still lists the images
# committed under public/assets, and uploading reports that it is unavailable.
BLOB_READ_WRITE_TOKEN=
```

In `docs/environment.md`, add `BLOB_READ_WRITE_TOKEN` to the variable table (read by `src/lib/media/library.ts` and the upload route, needed at runtime, and when missing uploads are unavailable while committed assets still list), and add a short section explaining that it must be set in Vercel's Production and Preview environments as well as locally, and that uploads bypass the 1 MB server-action body limit by going browser-to-Blob.

- [ ] **Step 5: Verify**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: 42 tests pass, all clean.

- [ ] **Step 6: End-to-end check against the real Blob store**

Run `npm run dev`, sign in, and:

1. Open `/admin/media`. Confirm the 44 committed assets list and no error banner appears.
2. Drag a PNG under 8 MB onto the dropzone. Confirm it uploads, appears at the top of the grid, and that `audit_logs` gains a `media.upload` row.
3. Try to upload an `.svg`. Confirm it is refused with a readable message and nothing reaches the store.
4. Open `/admin/blog/new`, click "Choose image" beside Cover image, pick the uploaded file, and confirm the field fills with the blob URL.
5. Delete the uploaded file from `/admin/media`. Confirm it disappears and `audit_logs` gains a `media.delete` row.
6. Confirm a static asset's delete control is disabled.

Record what actually happened for each of the six, including anything that did not work.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/media/media-picker.tsx src/components/admin/post-form.tsx src/components/admin/work-form.tsx src/app/admin/blog src/app/admin/works docs/environment.md .env.example
git commit -m "$(cat <<'EOF'
Pick an image from the library instead of typing its path

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-review notes

**Spec coverage:** password component and all three inputs (Task 1); blob naming, the allow-list, the size cap, SVG exclusion and path-escape safety (Task 2); `media.manage`, the audit actions and the static manifest (Task 3); `@vercel/blob`, `listMedia` with graceful degradation, `deleteMedia`, the authorised token route and `remotePatterns` (Task 4); the library UI, the `/admin/media` page and navigation (Task 5); the inline picker, all three form fields and the environment documentation (Task 6).

**Type consistency checked:** `MediaItem`, `mergeMedia`, `listMedia`, `deleteMedia`, `blobPathname`, `isSafeBlobPathname`, `isAllowedUpload`, `ALLOWED_UPLOAD_TYPES` and `MAX_UPLOAD_BYTES` are each defined once and referenced under the same names throughout. `MediaLibrary` takes `onSelect?`; `MediaPicker` supplies it.

**Known risk for Task 4:** `@vercel/blob`'s `handleUpload` must be imported from `@vercel/blob/client`, not the package root, and `access: "public"` is required on the client `upload()` call. If the installed version's types disagree with the code above, follow the installed types and say so in the report — do not weaken the authorisation or the validation to make it compile.

**Deliberate ordering:** Task 5 builds the library UI before Task 6 wires it into the forms, so the standalone page is verifiable on its own before the pickers multiply the surface.

**No end-to-end before Task 6:** Tasks 1-5 touch no real Blob store. The single live pass happens once, at the end, where a failure is attributable.
