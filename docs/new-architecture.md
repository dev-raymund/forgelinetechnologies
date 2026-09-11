# Architecture

One Next.js application at the repository root. No monorepo, no nested app,
no build-command overrides.

```
company/
├── src/
│   ├── app/            layout.tsx · page.tsx · not-found.tsx
│   │                   robots.ts · sitemap.ts · globals.css
│   ├── db/             schema.ts · index.ts
│   └── lib/            site.ts · queries.ts · validation.ts · email.ts · inquiry.ts
├── public/assets/      38 files carried over from the previous app
├── tests/              validation.test.ts
├── docs/               current documentation (legacy/ holds the old system's)
├── tools/              site-audit CLI — unrelated, preserved
├── backups/            database export, gitignored
├── package.json · tsconfig.json · next.config.ts · drizzle.config.ts
├── eslint.config.mjs · .env.example · .gitignore · README.md
```

## Why the root, not a subdirectory

The previous layout put the app in `web/` while Vercel's Root Directory also
pointed at `web/` and a build command did `cd web`. The path resolved to
`web/web` and every deploy failed. An app at the root removes the class of
error entirely: Root Directory stays empty and every Vercel default is
correct as-is.

**There is no `vercel.json`.** It is not needed, and the previous one is what
broke the build.

## Layers

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.3.4, App Router | React 19.2.8, TypeScript strict |
| Database | Neon Postgres + Drizzle 0.45.2 | HTTP driver, serverless-friendly |
| Email | Resend | Abstracted behind `src/lib/email.ts` |
| Validation | Zod 4 | Single schema shared by server action and tests |
| Tests | `node --test` | No test framework dependency |
| Styling | Plain CSS | No Tailwind, no UI library |

`drizzle-orm` was upgraded from the scaffold's 0.44.7 to 0.45.2: 0.44.x
carries a high-severity SQL-injection advisory for improperly escaped
identifiers.

## What was removed

`web/`, `site/`, the root digital-twin project (`src/`, `package.json`,
`tsconfig.json`, `install.sh`), `vercel.json`, and the old root `README.md`.

Preserved: `docs/`, `tools/`, `backups/`, `CLAUDE.md`, `WEBSITE-AUDIT.md`,
and `public/assets/` — copied out of `web/public/assets/` and verified
byte-for-byte with `diff -r` before anything was deleted.

The digital-twin `.env` was renamed to `.env.digital-twin.bak` rather than
deleted, because it holds a real API key. It is gitignored.

All of it is recoverable at commit `28f6bfa` on `origin/main`.

## Deliberately not built

Authentication, admin UI, contact page, design system, service pages, case
studies, blog content, analytics. The `users` and `posts` tables exist so
those can be added without a migration; nothing reads them yet.
