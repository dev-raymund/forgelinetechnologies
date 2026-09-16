# Environment variables

Six variables. `.env.example` lists the names with no values; copy it to
`.env` locally and set the same names in the Vercel project for production.

`.env` is gitignored. `.env.example` is committed.

| Variable | Read by | When | Missing |
|---|---|---|---|
| `DATABASE_URL` | `src/db/index.ts` | **Build and runtime** | **Build fails** |
| `SESSION_SECRET` | *(reserved)* | — | Nothing yet |
| `RESEND_API_KEY` | `src/lib/email.ts` | Runtime | Both emails skipped |
| `CONTACT_EMAIL` | `src/lib/email.ts` | Runtime | Notification skipped |
| `RESEND_FROM` | `src/lib/email.ts` | Runtime | Both emails skipped |
| `BLOB_READ_WRITE_TOKEN` | `src/lib/media/library.ts` and the upload route (`src/app/api/media/upload/route.ts`) | Runtime | Uploads unavailable; committed assets still list |

## DATABASE_URL

Neon **pooled** connection string. `src/db/index.ts` throws at import when it
is absent — deliberately, so a missing value fails the deploy instead of
shipping a site whose data layer silently returns nothing.

Today no page imports the database, so the build succeeds without it. That
changes the moment the first data-backed page is added, which is why it must
be set in Vercel before then.

## SESSION_SECRET

Reserved for authentication, which is not implemented. Nothing reads it. It
is in the template so the environment does not need restructuring later.

Generate with `openssl rand -base64 32`.

## The Resend three

`src/lib/email.ts` reads all three **lazily, inside the functions** — never at
module scope, so importing the module can never fail a build.

The guards are asymmetric and worth knowing:

- Notification needs `RESEND_API_KEY`, `CONTACT_EMAIL` **and** `RESEND_FROM`.
- Confirmation needs `RESEND_API_KEY` and `RESEND_FROM`.

Setting the key without `CONTACT_EMAIL` gives the worst outcome: the prospect
is confirmed while nobody is told the enquiry exists. Set them together.

## BLOB_READ_WRITE_TOKEN

Read/write token for the Vercel Blob store, generated from the Blob store in
the Vercel dashboard. `src/lib/media/library.ts` uses it to list uploaded
media, and the upload route (`src/app/api/media/upload/route.ts`) uses it —
via `@vercel/blob/client`'s `handleUpload` — to authorise and accept uploads.

**The store must be created with Public access.** Access is fixed at
creation and cannot be changed afterwards — there is no "make this store
public" toggle later. A private store still issues a token and still lists,
so nothing looks wrong until the first upload, which fails with "Cannot use
public access on a private store": the admin picker calls
`upload(pathname, file, { access: "public", ... })`, and a private store
refuses that access level outright. If a store already exists as private,
create a new one with Public access and point `BLOB_READ_WRITE_TOKEN` at it —
there is no in-place conversion.

Set it locally in `.env`, and in Vercel's **Production** and **Preview**
environments — not just Production, since Preview deployments exercise the
admin too. Without it, `listMedia()` degrades: the images committed under
`public/assets` still list, and the library reports that uploads are
unavailable rather than failing silently.

Uploads go directly from the browser to Blob storage (`@vercel/blob/client`'s
`upload()` against `handleUploadUrl: "/api/media/upload"`), not through a
server action's request body. That is what lets an 8 MB image upload at all:
a Next.js server action's default body limit is 1 MB, and the upload route
only ever handles the small token-exchange and webhook requests, never the
file bytes themselves.

Two things worth knowing that are easy to hit by accident:

- In `@vercel/blob` 2.8.0, `list()` and `del()` prefer OIDC credentials when
  running on Vercel and use `BLOB_STORE_ID` if it is set, while uploads
  (`handleUpload`/`upload()`) always use `BLOB_READ_WRITE_TOKEN`. A stale
  `BLOB_STORE_ID` left over from an earlier store can silently split reads
  and writes across two different stores — uploads land in one, the library
  lists another.
- On a preview deployment behind Vercel's Deployment Protection, Vercel's own
  upload-completed callback (`onUploadCompleted`, which writes the
  `media.upload` audit entry) can itself be rejected by that protection. The
  upload still succeeds; the audit entry may simply not appear there.

## Never set in production

**`NEXT_PUBLIC_BASE_PATH`** does not exist in this codebase and must not be
introduced in Vercel. In the previous app it moved every route under a path
prefix; a green build would still 404 the homepage.
