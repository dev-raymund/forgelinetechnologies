# Environment variables

`.env.example` lists the names with no values; copy it to
`.env` locally and set the same names in the Vercel project for production.

`.env` is gitignored. `.env.example` is committed.

| Variable | Read by | When | Missing |
|---|---|---|---|
| `DATABASE_URL` | `src/db/index.ts` | **Build and runtime** | **Build fails** |
| `SESSION_SECRET` | *(reserved)* | — | Nothing yet |
| `RESEND_API_KEY` | `src/lib/email.ts` | Runtime | Both emails skipped |
| `CONTACT_EMAIL` | `src/lib/email.ts` | Runtime | Notification skipped |
| `RESEND_FROM` | `src/lib/email.ts` | Runtime | Both emails skipped |

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

## Prospecting audit jobs

Prospecting audits run in the same process as the request that starts them,
using the Next.js `after` API. The work is bounded — one homepage, robots.txt,
sitemap.xml and at most twelve link probes, each capped at ten seconds — so it
finishes well inside the `maxDuration = 60` declared on the two
`/admin/prospecting` page segments that host the actions.

They need no queue service, no background worker, and no environment variables
of their own: `npm run dev` is the whole local setup.

## Never set in production

**`NEXT_PUBLIC_BASE_PATH`** does not exist in this codebase and must not be
introduced in Vercel. In the previous app it moved every route under a path
prefix; a green build would still 404 the homepage.
