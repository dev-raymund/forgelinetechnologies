# Admin Media Library and Password Visibility (design)

**Date:** 2026-09-16
**Status:** implemented
**Branch:** `admin-media-library`, branched from `main` (`cd7c3c5`)
**Ships to production:** yes — this branch alone. The prospecting work stays unmerged on its own branches.

## Objective

Two admin quality-of-life changes that ship together:

1. A reveal toggle on every password input.
2. A media library: drag an image in, browse what exists, click to insert — replacing the current workflow of putting a file in `public/assets/` by hand and typing its URL into a form.

## Approved decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Scope and branch | Fresh branch off `main`; only this work ships | Smallest blast radius. Production gets one reviewed feature rather than 30 commits of an unexercised prospecting engine. |
| Upload storage | Vercel Blob | Vercel's runtime filesystem is read-only. An upload into `public/assets/` works locally and silently fails once deployed. |
| Upload transport | Client-side direct upload | Next server actions cap request bodies at 1 MB by default — a limit this project already hit during the prospecting import. Most photographs exceed it. Direct upload sends bytes browser→Blob and never through a function. |
| Picker contents | Blob uploads **and** a build-time manifest of `public/assets` | The 44 committed images stay reusable instead of needing re-upload. |
| Surface | `/admin/media` page **and** an inline picker modal in the forms | |
| SVG uploads | Not permitted | An SVG is executable markup; a user-uploaded one is an XSS vector the moment anything inlines it. Existing SVG logos stay in the repo, where they are trusted. |

## Verified prerequisites

`BLOB_READ_WRITE_TOKEN` is present in the local `.env` and was checked against the live API before this design was written: `GET https://blob.vercel-storage.com?limit=5` returned **HTTP 200** with **0 blobs**. The store exists and the token is valid.

The store must be created with **Public access** — access is fixed at creation and cannot be changed afterwards. A private store still issues a token and still lists, so nothing looks wrong until the first upload, which fails with "Cannot use public access on a private store" (the admin picker calls `upload()` with `access: "public"`).

**Outstanding, and required before this works in production:** the same variable must exist in the Vercel project's **Production and Preview** environments. A local-only token means the feature works on a laptop and fails on the deployed site.

---

## Part 1 — Password visibility

### Current state

`type="password"` appears exactly once, in the admin login. The two password inputs in the user manager are `type="text"`, so a password being set for another account is rendered in plain sight on screen.

| File | Field | Today |
| --- | --- | --- |
| `src/components/admin/login-form.tsx` | own password | masked |
| `src/components/admin/user-manager.tsx` | new user's password | plain text |
| `src/components/admin/user-manager.tsx` | reset a user's password | plain text |

### Design

One client component, `src/components/admin/password-field.tsx`, used in all three places. Masked by default with a reveal toggle.

For the login this is a convenience. For the two user-manager fields it is a **security improvement**: a password stops being readable over a shoulder by default, and becomes visible only on a deliberate click.

Requirements:

- Toggles the input's `type` between `password` and `text`; the value and cursor position survive the toggle.
- The toggle is a real `<button type="button">` so it never submits the form, carries `aria-pressed` and an `aria-label` that changes with state ("Show password" / "Hide password"), and is reachable by keyboard.
- `autoComplete` stays whatever each call site already passes (`current-password`, `new-password`, `off`) — revealing must not change autofill behaviour.
- Accepts and forwards `id`, `name`, `required`, `minLength`, `placeholder`, `className`, so the three call sites keep their existing attributes exactly.

Unchanged: the one-time readout after creating a user, which prints the generated password so it can be copied. That is deliberate and stays plainly visible.

---

## Part 2 — Media library

### Storage and naming

One dependency: `@vercel/blob`. One environment variable: `BLOB_READ_WRITE_TOKEN`.

Blob pathname: `media/<yyyy>/<mm>/<slug>-<8 hex>.<ext>`

The date segments keep the store browsable; the slug keeps names human; the random suffix makes collisions impossible without a lookup. The slug is derived from the original filename, lowercased, non-alphanumerics collapsed to hyphens, truncated, with any path separators or dot segments stripped so an uploaded name can never escape the `media/` prefix.

### Upload flow

1. The reviewer drops a file on the library (or clicks to choose one).
2. The client checks type and size immediately — fast feedback only, never the guarantee.
3. `upload()` from `@vercel/blob/client` requests a token from `POST /api/media/upload`.
4. That route **authorises `media.manage` first**, then re-validates the content type and size through `handleUpload`'s `allowedContentTypes` and `maximumSizeInBytes`, and only then issues a scoped token. This is the authoritative check — the route is a public HTTP endpoint and must assume the client is hostile.
5. The browser uploads directly to Blob.
6. The library refreshes.

### Allow-list

`image/png`, `image/jpeg`, `image/webp`, `image/avif`, `image/gif`. Maximum 8 MB.

`image/svg+xml` is deliberately absent — see the decisions table.

### The static manifest

`scripts/build-media-manifest.mts` walks `public/assets`, and writes `src/lib/media/static-manifest.json` as a list of `{ path, bytes }`. Registered as `npm run media:manifest` and committed to the repo.

Regenerate it when repo assets change. It is not read at runtime from disk deliberately: a serverless bundle does not reliably contain `public/`, so a runtime directory read would work locally and return nothing in production — the same class of trap as uploading into `public/`.

### Reading the library

`listMedia()` returns `MediaItem[]`:

```ts
type MediaItem = {
  url: string;
  name: string;
  source: "blob" | "static";
  bytes: number;
  uploadedAt?: string;   // blob only
};
```

Blob items come from `list()`, static items from the manifest. Sorted newest-first, then by name. If the Blob call fails, the library degrades to static-only **with a visible notice** rather than an error page — a picker that silently shows half its contents is worse than one that says why.

### Deleting

`deleteMedia(url)` — a server action, authorised on `media.manage`, audit-logged.

Blob items only. Static items render with delete disabled and an explanation that they live in the repository. There is no automatic cleanup of orphaned blobs in this version; deletion is manual and deliberate.

### Capability

A new `media.manage`, granted to `admin` and `editor` — the same reach as `posts.manage` and `works.manage`, since the library serves both. New `AuditAction` values: `media.upload`, `media.delete`.

### UI

| Component | Role |
| --- | --- |
| `src/components/admin/media/media-library.tsx` | The library itself: dropzone, thumbnail grid, search filter, select, delete. Client component. |
| `src/components/admin/media/media-picker.tsx` | Modal wrapper plus a "Choose image" button. Selecting an item writes the chosen URL into the field it is bound to. |

The picker attaches to **three** fields, not two:

| File | Field | Label | Shape |
| --- | --- | --- | --- |
| `src/components/admin/post-form.tsx:185` | `coverUrl` | Cover image | bare `<input>` |
| `src/components/admin/post-form.tsx:201` | `ogImage` | Social image | bare `<input>` |
| `src/components/admin/work-form.tsx:109` | `imageUrl` | Image path | via the file-local `Text` helper |

`work-form.tsx` renders its field through a private `Text({ name, label, defaultValue, required })` helper. Rather than inlining a bare input there and breaking the file's own consistency, give `Text` an optional `action?: React.ReactNode` prop rendered beside the input. The other two call sites place the picker button directly.

Because these are uncontrolled inputs with `defaultValue`, the picker sets the value imperatively through a ref and dispatches an `input` event, so React and any future validation both observe the change.

Navigation gains a "Media" link gated on `media.manage`.

`next.config.ts` gains an `images.remotePatterns` entry for the Blob public host, because the site renders these through `next/image`.

### Testing

Pure functions, unit-tested with `node:test`, no network:

- `blobPathname(filename)` — slugging, extension handling, uniqueness, and that `../` or a nested path in the original name cannot escape the `media/` prefix.
- `isAllowedUpload(contentType, bytes)` — the allow-list, the size cap, and SVG rejected explicitly.
- `mergeMedia(blobs, manifest)` — shape, ordering, and de-duplication.

The route handler, the server action and the UI are covered by typecheck, lint, build and a manual pass, as with the rest of this admin.

## Out of scope

Renaming, folders, bulk operations, image transformation, alt-text management, and migrating the existing 44 static assets into Blob. They keep working exactly as they do now.

## Risks

| Risk | Handling |
| --- | --- |
| The token route is a public endpoint | It authorises `media.manage` before issuing a token, and re-validates type and size server-side. |
| An uploaded SVG becomes an XSS vector | Excluded from the allow-list. |
| Blob unavailable | Listing degrades to static-only with a visible notice. |
| `BLOB_READ_WRITE_TOKEN` missing in production | Documented here and in `docs/environment.md`. The failure is loud at upload time, not silent. |
| A crafted filename escaping the prefix | Path separators and dot segments stripped in `blobPathname`, with a covering test. |
| Orphaned blobs accumulating | Manual delete in the UI. No automatic collection in this version. |
