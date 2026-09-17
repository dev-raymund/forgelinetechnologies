# Environment variables

`.env.example` lists every name with no values; copy it to
`.env` locally and set the same names in the Vercel project for production.

`.env` is gitignored. `.env.example` is committed.

| Variable | Read by | When | Missing |
|---|---|---|---|
| `DATABASE_URL` | `src/db/index.ts` | **Build and runtime** | **Build fails** |
| `SESSION_SECRET` | *(reserved)* | — | Nothing yet |
| `RESEND_API_KEY` | `src/lib/email.ts` | Runtime | Both emails skipped |
| `CONTACT_EMAIL` | `src/lib/email.ts` | Runtime | Notification skipped |
| `RESEND_FROM` | `src/lib/email.ts` | Runtime | Both emails skipped |
| `BLOB_STORE_ID` + `BLOB_WEBHOOK_PUBLIC_KEY` | `@vercel/blob` via OIDC, for listing, deleting and uploading media | Runtime | Uploads and uploaded media unavailable; committed assets still list |
| `BLOB_READ_WRITE_TOKEN` | `@vercel/blob`, only as a fallback when no OIDC token is available (local development) | Runtime | Nothing on Vercel; locally, no Blob access without `vercel env pull` |

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

## Vercel Blob: media uploads

Uploaded images live in the Vercel Blob store **`ft-blob-public`**
(`store_oGAQjTOQEdAMuk2m`), which is connected to this project through **OIDC**.
Connecting it added `BLOB_STORE_ID` and `BLOB_WEBHOOK_PUBLIC_KEY` to Production and
Preview, and Vercel supplies a short-lived OIDC token to every deployment at runtime.

**How the SDK chooses credentials.** In `@vercel/blob` 2.8.0, every Blob API call
resolves credentials in this order: an explicit token, then the OIDC token together
with `BLOB_STORE_ID`, and only then `BLOB_READ_WRITE_TOKEN`. So on Vercel, OIDC wins
even when a read-write token is also set.

**Uploads use OIDC too.** The upload route (`src/app/api/media/upload/route.ts`) uses
`handleUploadPresigned` and `issueSignedToken`, which go through the same resolver as
`list` and `del`. The browser calls `uploadPresigned()` and sends the bytes straight to
Blob, never through a server action (whose default body limit is 1 MB).

This replaced `handleUpload`, which signs upload tokens with `BLOB_READ_WRITE_TOKEN`
**only**, with no OIDC fallback. A read-write token left over from an earlier private
store therefore sent every upload to that store while the library listed
`ft-blob-public`. Blob answered `forbidden`, which the SDK reports as the unhelpful
"Access denied, please provide a valid token for this resource."

**The store must be created with Public access.** Access is chosen at creation, and
Vercel documents no way to change it afterwards, so treat it as fixed. A private store
still connects and still lists, so nothing looks wrong until the first upload.

**`handleUploadPresigned` requires `BLOB_WEBHOOK_PUBLIC_KEY`.** It throws
"Missing webhook public key" on every request without it, before authorisation even
runs. It also uses that key to verify the Ed25519 signature on Vercel's
upload-completed callback, which is what writes the `media.upload` audit entry.

**Local development.** There is no OIDC token on a laptop by default. Run
`vercel env pull .env.local` to get `VERCEL_OIDC_TOKEN` (valid for about 12 hours),
`BLOB_STORE_ID` and `BLOB_WEBHOOK_PUBLIC_KEY`. Without them, local uploads fail and the
library still lists the committed assets. Vercel cannot reach `localhost`, so the
`media.upload` audit entry never appears locally.

**Images on work pages.** Works render through `next/image`, so `next.config.ts`
allows exactly `ogaqjtoqedamuk2m.public.blob.vercel-storage.com` under `/media/**`.
Never widen it to a wildcard: `/_next/image` is public and its `url` parameter is
caller-supplied, so a wildcard turns it into an open image proxy for every Vercel Blob
store. If the store is ever replaced, update that host before choosing a new-store
image for a work. Blog covers use a plain `<img>` and are unaffected.

**Preview deployments.** Behind Vercel's Deployment Protection, the upload-completed
callback can itself be rejected. The upload still succeeds; the audit entry may not
appear there.

## Never set in production

**`NEXT_PUBLIC_BASE_PATH`** does not exist in this codebase and must not be
introduced in Vercel. In the previous app it moved every route under a path
prefix; a green build would still 404 the homepage.
