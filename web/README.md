# Forgeline CMS

The company site, rebuilt as a database-backed Next.js app. Projects and blog
posts are managed at `/admin` — no code edits, no redeploys.

```
web/
  src/
    app/
      page.tsx              homepage (static shell + DB-driven work grid)
      blog/                 blog index + post pages
      admin/
        login/              sign in
        (dash)/             dashboard, work CRUD, post CRUD
        actions.ts          all server actions (every mutation checks auth)
    components/
      static-top.tsx        AUTO-GENERATED from the old site/index.html
      static-bottom.tsx     AUTO-GENERATED from the old site/index.html
      work-section.tsx      the work grid + filters (from the DB)
      blog-teaser.tsx       3 latest posts on the homepage
      site-scripts.tsx      the old inline <script>, typed
    db/schema.ts            works + posts tables
    lib/                    auth, queries, markdown, slugs
  scripts/
    extract-works.mjs       one-time: pulled 17 projects out of the old HTML
    verify-db.mjs           schema + CRUD checks against PGlite
```

## Setup (about 10 minutes, all free)

**1. Database.** Create a free project at <https://neon.tech>, copy the *pooled*
connection string.

**2. Environment.**

```bash
cd web
cp .env.example .env
```

Fill in `DATABASE_URL`, then generate the two secrets:

```bash
npm run hash -- "the-password-you-want"   # -> ADMIN_PASSWORD_HASH
openssl rand -base64 32                   # -> SESSION_SECRET
```

Set `ADMIN_EMAIL` to the address you'll sign in with.

**3. Create the tables and load the existing work.**

```bash
npm install
npm run db:push      # creates the tables from src/db/schema.ts
npm run db:seed      # loads the 17 projects from the old site + a starter draft
```

`db:seed` skips slugs that already exist, so re-running it never clobbers edits.

**4. Run it.**

```bash
npm run dev          # http://localhost:3000  ·  admin at /admin
```

## Deploying

`vercel.json` at the repo root already points Vercel at this app. Add the same
four variables (`DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`,
`SESSION_SECRET`) in **Vercel → Project → Settings → Environment Variables**,
then deploy.

The build talks to the database, so `DATABASE_URL` must be set in Vercel or the
deploy fails — deliberately. An empty portfolio should never ship silently.

## How content flows

Saving in the admin calls `revalidatePath()`, so the public page updates on the
next request — no rebuild, no redeploy.

Filter counts on the homepage are **derived** from the projects in the database.
They can't drift out of sync with what's shown, which is what happened when they
were hand-written in HTML.

## Images

Both the work thumbnail and the post cover take either a local path
(`/assets/projects/x.jpg`, served from `public/`) or a full `https://` URL.
There is no upload widget yet — drop files in `web/public/assets/` and reference
them by path, or paste a URL from any host.

## Users & auth

Accounts live in the `users` table and are managed at **/admin/users**.

| Role | Can do |
|---|---|
| `admin` | Everything, including adding, editing and deleting users |
| `editor` | Work and posts only — user management is hidden *and* blocked |

**Three layers guard the admin**, deliberately not relying on each other:

1. `src/middleware.ts` verifies the session cookie before any `/admin/*` page renders
2. Every page and every server action calls `requireUser()` / `requireAdminRole()`
   from `src/lib/guards.ts` — hiding a nav link is never the only protection
3. `getCurrentUser()` re-reads the user from the database on every request, so
   deactivating an account or changing a role takes effect on the *next request*
   rather than whenever their 7-day cookie happens to expire

Passwords are scrypt hashes (`salt:key`); the password itself is never stored.
Login burns the same CPU on an unknown email as on a wrong password, so response
timing doesn't reveal which accounts exist.

**Lockout protection:** you can't delete your own account, and you can't delete,
demote, or deactivate the last active admin. The UI disables those controls and
the server actions reject them independently.

**Locked out anyway?** There's a CLI way back in:

```bash
npm run user:add -- "you@example.com" "a-long-password" admin
```

Re-running it for an existing email resets that password and re-activates the
account.

`ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` in `.env` are **bootstrap only** — used
once by `npm run db:seed` to create the first admin, then ignored.

## The two homepage components

`static-top.tsx` and `static-bottom.tsx` hold the homepage sections. They began
life as a one-time port of `site/index.html`, but the port scripts have been
removed and both files are now maintained directly — edit them, not the legacy
HTML.

`site/` at the repo root is no longer read by the application. It is kept only
because `scripts/extract-works.mjs` still parses it to regenerate the project
seed.

## Checks

```bash
npm run typecheck            # tsc
npx tsx scripts/verify-db.mjs  # schema + CRUD against PGlite, no DB needed
```
