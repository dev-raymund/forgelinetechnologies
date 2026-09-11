# FORGELINE REBUILD STATUS:

## BLOCKED

The codebase is finished, verified and committed, and the database is live.
**Two Vercel steps remain** and only you can do them: clearing the Root
Directory (still `web`) and attaching the domain. Until then the site cannot
serve, so this is not COMPLETE.

Nothing in the code is outstanding.

| Blocker | Status |
|---|---|
| Neon database created and schema applied | **done** — 2026-09-11 |
| Vercel Root Directory cleared | **outstanding** |
| Domain attached to the project | **outstanding** |

---

## 1. New project structure

```
company/
├── src/
│   ├── app/      layout · page · not-found · robots · sitemap · globals.css
│   ├── db/       schema.ts · index.ts
│   └── lib/      site · queries · validation · email · inquiry
├── public/assets/  38 files carried across and byte-verified
├── tests/        validation.test.ts
├── docs/         current docs; legacy/ holds the removed system's
├── tools/        site-audit CLI, untouched
├── backups/      database export, gitignored
└── package.json · tsconfig.json · next.config.ts · drizzle.config.ts
    eslint.config.mjs · .env.example · .gitignore · README.md
```

One application, at the root. **No `vercel.json`.**

## 2. Next.js setup

Next 16.3.4 · React 19.2.8 · TypeScript strict · App Router · ESLint 9 ·
plain CSS. No Tailwind, no UI library, no animation library.

Four routes: `/`, 404, `/robots.txt`, `/sitemap.xml`. The homepage is a
placeholder reading "ForgeLine Technologies" and "Web Development & Digital
Solutions".

## 3. Database setup

**Applied and verified** against the live database on 2026-09-11.

`src/db/schema.ts` defines four tables — `users`, `projects`, `posts`,
`inquiries` — with 14 indexes including the composite
`(source_ip, created_at)` that serves the rate-limit query.

`src/db/index.ts` throws when `DATABASE_URL` is absent, deliberately.
`src/lib/queries.ts` wraps reads in a retry for Neon cold starts.

Applied with `npm run db:push` and verified against `information_schema`
and `pg_indexes` rather than the CLI's own report:

```
TABLES 4: inquiries, posts, projects, users
  inquiries 12 cols · posts 10 · projects 13 · users 8
INDEXES 14  (4 primary keys, 3 unique, 7 declared)
  including inquiries_ip_created_idx on (source_ip, created_at)
```

## 4. Neon status

**Live.** A new Neon project was provisioned through the Vercel–Neon
integration (Neon's own "New project" button is disabled for
integration-managed accounts).

Host `ep-green-night-b3xhc0n4-pooler` in `ap-southeast-1` — Singapore, the
same region Vercel serves from, so queries do not cross regions. Confirmed
empty before the push, so nothing was overwritten.

The integration injects `DATABASE_URL` into the connected Vercel project
automatically, which removes that variable from the manual list.

The previous database is untouched and still holds the old data. A verified
export sits in `backups/2026-09-11/` (gitignored).

## 5. Resend status

**Implemented, not configured.** `src/lib/email.ts` provides
`sendInquiryNotification` and `sendInquiryConfirmation`.

Neither ever throws; both return `{ ok, skipped?, error? }` and skip cleanly
when unconfigured. Environment is read lazily inside the functions so
importing the module can never fail a build. All interpolated values are
HTML-escaped. No test email has been sent.

Note: until a sending domain is verified in Resend, confirmations to
prospects will not be delivered — an unverified account only reaches its own
address.

## 6. Contact backend status

Complete as a backend. **No UI** — the contact page is a later phase.

`src/lib/inquiry.ts` runs: validate → honeypot → rate limit → insert →
notify → confirm.

- Honeypot parses successfully and is dropped afterwards, returning ordinary
  success. A validation error would tell a bot it had been detected.
- Rate limit is 5/hour per IP, counted in the database because serverless
  instances share no memory.
- Storage happens before either email, and email results are logged but
  cannot change what the visitor is told.

## 7. Git status

Working tree **clean**. Committed as `61cbe87` —
*chore: rebuild ForgeLine technical foundation*. 250 files: 25 added,
174 deleted, 6 modified, 45 renamed.

**Not pushed.** Pushing now would trigger a Vercel build against a Root
Directory of `web`, which no longer exists, and fail. Push after step 2.

The removed application is recoverable at `28f6bfa` on `origin/main`.

## 8. Local production build status

All green, verified against a clean `.next` and a real production server:

```
npm run lint        clean
npm run typecheck   clean
npm test            14 passed, 0 failed
npm run build       6/6 static pages, 4 routes
next start          / 200 · /robots.txt 200 · /sitemap.xml 200 · unknown 404
```

Obsolete-reference sweep: zero hits for `port-homepage`, `html-to-jsx`,
`formspree`, `NEXT_PUBLIC_BASE_PATH`, `_archive-redesign`, `cd web`,
`outputDirectory`, `basePath`, or any `web/` path.

Full detail in `docs/local-production-verification.md`.

## 9. Vercel readiness

The repository is ready. The project is not.

| Setting | Required | Currently |
|---|---|---|
| Framework | Next.js | Next.js |
| Root Directory | **empty** | **`web`** — must be cleared |
| Build / Output / Install | defaults | defaults |
| Node | 24.x | 24.x |

## 10. Environment variables required

| Variable | Needed | Consequence if missing |
|---|---|---|
| `DATABASE_URL` | **Yes** | Injected automatically by the Neon integration |
| `SESSION_SECRET` | Recommended | Nothing yet — reserved for auth |
| `RESEND_API_KEY` | Optional | Both emails skipped |
| `CONTACT_EMAIL` | Optional | Notification skipped |
| `RESEND_FROM` | Optional | Both emails skipped |

**Never set `NEXT_PUBLIC_BASE_PATH`** in production. It does not exist in
this codebase and would move every route under a prefix.

## 11. Manual dashboard actions still required

1. ~~**Neon** — create the project and apply the schema.~~ **Done.**
2. **Vercel** — clear Root Directory (currently `web`); add `SESSION_SECRET`
   to Production (`DATABASE_URL` is injected by the Neon integration);
   attach both `forgelinetechnologies.com` (primary) and
   `www.forgelinetechnologies.com`.
3. **Push** — only after step 2, or the build fails on the stale path.
4. **Resend** *(optional now)* — API key, `CONTACT_EMAIL`, and a verified
   sending domain.

Step 2 is the remaining hard blocker.

## 12. Unresolved issues

**Four moderate npm advisories**, all in `drizzle-kit`'s transitive esbuild
chain. Dev-only — drizzle-kit is a CLI and never ships in the bundle. npm's
suggested fix downgrades drizzle-kit 0.31 → 0.18, a major regression, so it
was not taken.

**The live domain still returns 404** (`DEPLOYMENT_NOT_FOUND`). Unchanged by
this rebuild, because it was never a code problem: two Vercel projects were
deleted and the domain went with them. Resolved by step 2.

**Vercel settings remain unverifiable from here.** The connector returns 403
on project detail, domains, environment variables and deployments. Root
Directory, attached domains and production env vars all have to be confirmed
by you in the dashboard.

**`.env.digital-twin.bak`** sits in the working tree, gitignored. It holds a
real Anthropic API key from the deleted digital-twin project. Delete it once
you are sure the key is not needed.

---

Foundation only. No pages, design, content, SEO, analytics or CRM were built,
and the next development phase has not been started.
