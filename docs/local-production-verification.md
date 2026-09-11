# Local production verification

**Date:** 2026-09-11
**Result: all checks pass.** Verified against a clean `.next` and a real
production server, not the dev server.

## Toolchain

Node v24.13.1 · npm 11.8.0 · Next 16.3.4 · React 19.2.8

Node matches the Vercel project's 24.x setting. No `engines` field and no
`.nvmrc`, so nothing can override it.

## Results

```
npm install    up to date, audited 370 packages, 4 moderate vulnerabilities
npm run lint   clean, exit 0
npm run typecheck   clean
npm test       tests 14 · pass 14 · fail 0 · 118ms
npm run build  ✓ compiled in 1888ms · 6/6 static pages
```

### Build output

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /robots.txt
└ ○ /sitemap.xml
○  (Static)  prerendered as static content
```

Four routes and nothing else, all static. The build succeeds **without**
`DATABASE_URL` because no page imports the database yet — that changes with
the first data-backed page, at which point the variable becomes a hard build
requirement.

### Runtime

`next start`, real production server:

| Route | Status |
|---|---|
| `/` | 200 |
| `/robots.txt` | 200 |
| `/sitemap.xml` | 200 |
| unknown path | 404 |

Homepage contains both required strings — "ForgeLine Technologies" and
"Web Development & Digital Solutions" — and the title resolves to
`ForgeLine Technologies — Web Development & Digital Solutions`.

`robots.txt` allows all and points at the sitemap on the apex host.
`sitemap.xml` lists the homepage only.

## Obsolete references — all clear

Searched `src`, `tests`, `public` and every config file:

| Pattern | Result |
|---|---|
| `port-homepage` | none |
| `html-to-jsx` | none |
| `formspree` | none |
| `NEXT_PUBLIC_BASE_PATH` | none |
| `_archive-redesign` | none |
| `cd web` | none |
| `outputDirectory` | none |
| `basePath` | none |
| any `web/` path reference | none |

`vercel.json` is absent, which is correct for an app at the repository root.

## Two issues found and fixed during verification

**High-severity SQL injection in the ORM.** The scaffold resolved
`drizzle-orm` to 0.44.7, which carries an advisory for improperly escaped SQL
identifiers. Upgraded to 0.45.2. Building a database layer on a known SQLi
was not acceptable.

**`.env.example` was being ignored.** Next's generated `.gitignore` contains
`.env*`, which swallowed the template that must be committed. Added an
explicit `!.env.example` negation and confirmed with `git check-ignore`:
`.env` ignored, `.env.example` tracked.

## Remaining advisories

4 moderate, all in `drizzle-kit`'s transitive esbuild chain
(`@esbuild-kit/core-utils`, `@esbuild-kit/esm-loader`, `esbuild`). They are
**dev-only** — drizzle-kit is a CLI that never ships in the bundle. npm's
suggested fix is downgrading drizzle-kit 0.31 → 0.18, a major regression that
would trade a dev-server advisory for a much older migration tool. Not taken.
