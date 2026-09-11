# ForgeLine Technologies

Web Development & Digital Solutions — the studio site.

A single Next.js application at the repository root. Technical foundation
only: no marketing pages, no design system, no content yet.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Neon Postgres +
Drizzle · Resend · Zod · plain CSS

## Getting started

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL at minimum
npm run dev               # http://localhost:3000
```

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Validation tests via `node --test` |
| `npm run db:push` | Apply `src/db/schema.ts` to Neon |
| `npm run db:studio` | Drizzle Studio |

## Routes

`/` · `/robots.txt` · `/sitemap.xml` · 404

## Documentation

| Document | Covers |
|---|---|
| `docs/new-architecture.md` | Structure and why the app is at the root |
| `docs/database-setup.md` | Tables, indexes, applying and verifying the schema |
| `docs/environment.md` | Every variable, where it is read, what breaks |
| `docs/resend-setup.md` | Email configuration and failure behaviour |
| `docs/vercel-setup.md` | Exact deployment settings |
| `docs/REBUILD-COMPLETE.md` | Current status and outstanding manual steps |

`docs/legacy/` documents the previous application, removed on 2026-09-11 and
recoverable at commit `28f6bfa`.
