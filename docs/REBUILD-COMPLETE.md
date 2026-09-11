# Forgeline rebuild — status

**The site is built.** Every page, the design system, the contact pipeline,
SEO and the accessibility pass are done and verified locally.

**It is not live, and nothing is backed up.** Both are outside the codebase
and only you can resolve them. See *Outstanding* below.

---

## 1. What exists

| Area | State |
|---|---|
| Next.js 16.3.4 · React 19.2.8 · TypeScript strict · App Router | done |
| Tailwind v4 design system, tokens in `globals.css` | done |
| Homepage, 11 sections | done |
| `/work` + 17 project pages | done |
| `/services` + 6 service pages | done |
| `/pricing`, `/process`, `/about`, `/contact` | done |
| Contact pipeline: validate → honeypot → rate limit → Neon → Resend | done, verified end to end |
| Neon Postgres + Drizzle, schema applied and verified | done |
| SEO: metadata, canonicals, Open Graph, sitemap, robots, structured data | done |
| Accessibility and responsive passes | done, verified |

**38 static pages.** The previous site had **2 real URLs**; the sitemap now
lists **30**.

## 2. Design system

Palette derives from the logo gradient (`#016ecc` → `#19d2fe`). The dark
ground is a deep blue-slate (`#0a121a`) rather than a tinted black, so the
brand sits in the darkness itself.

Archivo for all text; JetBrains Mono only for genuine data — stack names,
figures, indices. The structural device is a left rail with a hairline spine
and a node per section, which collapses below `48rem`.

Tokens live in `src/app/globals.css` under `@theme`. Change a colour there and
it changes everywhere; no component hardcodes one.

## 3. Content sources

Nothing on the site is invented.

- **17 projects** — transcribed from `backups/2026-09-11/works.json` into
  `src/data/projects.ts`, descriptions verbatim.
- **Pricing** — carried unchanged from the previous site, recoverable at commit
  `28f6bfa` in `web/src/components/static-top.tsx`. Currency is unstated there
  and is deliberately not asserted here.
- **Figures** — 6+ years, 17 projects, 4 countries, 100% code ownership. These
  render as server-side text; the previous site animated them up from a literal
  `0` in the HTML, so crawlers saw a studio claiming six years of nothing.

There are **no testimonials and no case studies**, because none exist. The
case-study fields on `Project` are present and empty so real ones can be added
without a schema change. Do not fill them with plausible-sounding narrative.

## 4. Verification

Measured, not assumed:

```
lint            clean
typecheck       clean
tests           15/15
build           38 static pages
contrast        0 failures across 10 routes, measured from painted pixels
overflow        0 failures across 90 viewport checks (9 widths x 10 routes)
structure       1 h1/page, no heading skips, 0 missing alt, 0 nameless links
keyboard        skip link first, FAQ opens on Enter, menu closes on Escape
reduced motion  honoured; content arrives finished
contact         stored in Neon with every field; honeypot stored 0 rows
```

Test enquiries were deleted afterwards; `inquiries` is back to 0 rows.

## 5. Outstanding — only you can do these

### a. Nothing is backed up

`git ls-remote origin` returns **nothing**. The GitHub repo
`dev-raymund/forgelinetechnologies` is empty, and the local `origin/main`
refs are stale caches of a remote that was wiped — so `git status` reports
"up to date" and is wrong.

Every commit exists only on this machine. Verify remote state with
`git ls-remote origin`, never `git status`.

### b. The site returns 404

Not a code problem. The Vercel project's Root Directory still points at a
`web/` folder that no longer exists, the domain is unattached, and the repo it
deploys from has no commits. The Vercel connector returns 403 on project
detail, domains and env vars, so this has to be done in the dashboard:

1. Clear Root Directory (currently `web`) — every other default is correct.
2. Attach `forgelinetechnologies.com` and `www.forgelinetechnologies.com`.
3. Push the repository.

### c. Email is half-configured

`RESEND_API_KEY` is set. `CONTACT_EMAIL` and `RESEND_FROM` are **empty**, so
both emails skip — enquiries are still stored, and the success screen
correctly does not claim a confirmation was sent. Set both, and verify a
sending domain in Resend, to turn emails on.

A verified domain would also let the published contact address move off
`@gmail.com`, which undercuts the positioning everywhere it appears.

### d. Social proof

The conversation audit's largest finding, and still open: 17 real, live,
verifiable projects and not one of them speaks. Two or three real testimonials
would outrank every design decision in this rebuild. The slot is built; the
quotes have to be asked for.

### e. `.env.digital-twin.bak`

Holds a real Anthropic API key from a deleted project. Gitignored, so not
exposed. Delete it once you are sure the key is dead.
