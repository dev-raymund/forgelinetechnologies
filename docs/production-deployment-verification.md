# Production Deployment Verification

**Date:** 2026-09-11
**Verdict: the site is down and must not be used for outreach.**
Both hostnames return HTTP 404 from Vercel.

No application code, DNS record or Vercel setting was changed by this
inspection. Every change below requires you to make it in the dashboard.

---

## 1. Deployment status

**No production deployment exists.**

```
https://forgelinetechnologies.com       → HTTP 404  x-vercel-error: DEPLOYMENT_NOT_FOUND
https://www.forgelinetechnologies.com   → HTTP 404  x-vercel-error: DEPLOYMENT_NOT_FOUND
```

`DEPLOYMENT_NOT_FOUND` is specific and useful: it means the request reached
Vercel and Vercel recognised the hostname, but there is no deployment behind
it. That is different from a DNS failure, an unconfigured domain, or a failed
build (which would keep serving the previous deployment).

### Why — the projects were replaced

The Vercel account previously held **two** projects on this repository:

| Project | Status now |
|---|---|
| `forgeline` | **gone** |
| `forgeline-85f6` | **gone** |
| `forgelinetechnologies` — `prj_49CwPaeVGbSF5AfxYD95ovsizD01` | created 2026-09-11 00:07 |

The domain was serving from one of the two deleted projects. Deleting it took
the deployment with it, and the replacement project has not produced a
successful production deployment. Hence: domain known, nothing to serve.

Consolidating to one project was the right move — two projects auto-deploying
from the same repo meant every push raced. The outage is a side effect of the
switchover, not of the decision.

---

## 2. Domain status

**DNS is correct and is not the problem.**

| Host | Record | Value |
|---|---|---|
| `forgelinetechnologies.com` | A | `216.198.79.1` (Vercel anycast) |
| `www.forgelinetechnologies.com` | CNAME | → `forgelinetechnologies.com` |

This is the standard Vercel layout: apex on an A record, www as a CNAME
pointing at the apex. Both resolve. Both reach Vercel. Nothing needs changing
at the registrar.

**Not verifiable from here:** whether either hostname is currently *attached*
to the `forgelinetechnologies` project. The Vercel connector can list projects
but returns `403 Forbidden` on project detail, domains and deployments — it
needs re-authentication to the `devraymunds-projects` scope. Confirm in
**Settings → Domains**.

Given the 404 is `DEPLOYMENT_NOT_FOUND` rather than a domain-misconfiguration
page, the likeliest state is that the domain is still registered to the Vercel
account but orphaned by the project deletion.

---

## 3. Recommended canonical host

**Apex — `https://forgelinetechnologies.com`.** Three reasons, in order:

1. **DNS already assumes it.** `www` is a CNAME *to* the apex. The apex is the
   origin of record; making www canonical would invert the existing setup for
   no benefit.
2. **The codebase already asserts it** in three places — `metadataBase` in
   `layout.tsx`, `BASE` in `sitemap.ts`, `BASE` in `robots.ts`. They agree.
3. **Nothing contradicts it.** No live redirect exists to establish the
   opposite convention, so there is no legacy behaviour to preserve.

One loose end: `src/lib/content.ts` still carries a `www` URL. Nothing imports
it, so it has no effect — but it should be corrected before anything starts
reading that module, or the two will diverge silently.

---

## 4. Redirect recommendation

**No redirect exists today** — neither host serves, so neither can redirect.

**Recommended: `www` → apex, 308 permanent.**

You do not need to hand-write this. In Vercel, attach both hostnames to the
project and mark the apex as primary; Vercel creates the redirect
automatically. Do not add a `redirects()` rule in `next.config.ts` as well —
two mechanisms doing the same job is how redirect loops happen.

Both hosts must be attached. If only the apex is, `www` visitors get an error
instead of a redirect.

---

## 5. Environment variables

**Cannot be read from here** — the connector 403s on project settings. What
follows is what the application requires, and the local state. Names only; no
values appear in this document.

| Variable | When needed | Consequence if missing | Local |
|---|---|---|---|
| `DATABASE_URL` | **Build time** | **Build fails** — deliberate, so an empty portfolio cannot ship silently | set |
| `SESSION_SECRET` | Runtime | `/admin` renders but login cannot work | set |
| `ADMIN_EMAIL` | Bootstrap only | None — the admin account already exists in Neon | set |
| `ADMIN_PASSWORD_HASH` | Bootstrap only | None — same | set |
| `RESEND_API_KEY` | Runtime | Enquiries stored, **nobody notified** | **not set** |
| `CONTACT_EMAIL` | Runtime | Notification skipped; prospect still confirmed | **not set** |
| `RESEND_FROM` | Runtime | Falls back to a sender that only delivers to your own address | **not set** |
| `NEXT_PUBLIC_BASE_PATH` | Staging only | — | not set |

**Two things to get right:**

- `DATABASE_URL` is the only one that can fail the build. If the new project's
  deployment failed rather than never running, this is the first thing to check.
- **`NEXT_PUBLIC_BASE_PATH` must NOT be set in production.** It exists for the
  `/staging` path deployment. Setting it in production would move the entire
  site under `/staging` and 404 the homepage.

---

## 6. Does production contain the latest code?

**No — on two counts.**

1. There is no production deployment at all.
2. Even if one existed, it would be behind. `origin/main` is at `f457946`.
   Phase 1 Tasks 6, 7 and 8 are **committed nowhere** — they exist only in the
   working tree:

```
M  web/src/app/layout.tsx              metadata, OG, twitter
M  web/src/app/page.tsx                absolute title, canonical, blog gate
M  web/src/app/blog/page.tsx           canonical, openGraph
M  web/src/app/blog/[slug]/page.tsx    canonical, article OG
M  web/src/app/sitemap.ts              blog gated out
M  web/src/app/not-found.tsx           self-contained styling
M  web/src/components/static-top.tsx   server-rendered stats, nav blog link removed
M  web/src/components/site-scripts.tsx no-zero-flash counter guard
?? web/src/lib/metadata.ts             openGraph helper
?? web/src/lib/blog.ts                 blog visibility threshold
?? web/src/app/opengraph-image.tsx     generated 1200×630 card
?? web/src/app/blog/opengraph-image.tsx
?? web/src/app/blog/[slug]/opengraph-image.tsx
```

`vercel.json` on `origin/main` is `{ framework: "nextjs" }` — correct for a
project whose Root Directory is `web`, with no overrides to double-apply the
path.

---

## 7. Is the site safe for client outreach?

**No. Do not send anyone a link.**

Every URL returns a Vercel 404 error page. A prospect clicking a link from an
email, a proposal or a LinkedIn message sees "The deployment could not be
found on Vercel" — worse than a slow site or a plain 404, because it reads as
a broken business.

This also blocks the Phase 1 work from mattering: the metadata, OG cards,
server-rendered stats and enquiry pipeline are all correct in code and all
unreachable.

Safe to resume outreach once section 8 is done **and** the checks in section 9
pass.

---

## 8. Exact next actions — yours, in the Vercel dashboard

I cannot do these: the connector is read-only on this scope and returns 403 on
every settings endpoint.

**Project:** `forgelinetechnologies` (`prj_49CwPaeVGbSF5AfxYD95ovsizD01`)

1. **Settings → Build & Deployment**
   Confirm **Root Directory** is `web`. If it is empty, the build runs at the
   repo root, finds no Next.js app, and fails.
   Leave Build Command and Install Command on the framework defaults — do not
   re-add a `cd web` override.

2. **Settings → Environment Variables → Production**
   Add `DATABASE_URL` and `SESSION_SECRET`, copied from `web/.env`.
   Do **not** add `NEXT_PUBLIC_BASE_PATH`.
   Optionally add `RESEND_API_KEY`, `CONTACT_EMAIL`, `RESEND_FROM` — enquiries
   are stored without them, but nobody is notified.

3. **Settings → Domains**
   Attach both `forgelinetechnologies.com` and `www.forgelinetechnologies.com`.
   Set the **apex as primary**. Vercel then creates the www → apex redirect.

4. **Deployments → Redeploy** (or push, once step 5 is done)

5. **Tell me, and I will commit and push Phase 1 Tasks 6–8** so the deployment
   contains the current code. Right now a deploy would ship `f457946`, which
   predates all of it.

---

## 9. Verification checklist once it is live

Run these before treating the site as usable:

```
curl -sI https://forgelinetechnologies.com/          → 200
curl -sI https://www.forgelinetechnologies.com/      → 308 → apex
curl -s  https://forgelinetechnologies.com/ | grep '<strong data-to'   → 6+ 17 4 100%
curl -sI https://forgelinetechnologies.com/opengraph-image  → 200 image/png
curl -sI https://forgelinetechnologies.com/admin/login      → 200
curl -s  https://forgelinetechnologies.com/robots.txt
curl -s  https://forgelinetechnologies.com/sitemap.xml
```

Then confirm the canonical assumption held: if Vercel ended up serving **www**
as primary instead of the apex, `layout.tsx`, `sitemap.ts` and `robots.ts` must
all change together, or they will contradict each other and the redirect.

---

## 10. What could not be verified, and why

| Item | Status | Blocker |
|---|---|---|
| Domains attached to the project | unknown | connector 403 |
| Production env vars present | unknown | connector 403 |
| Deployment history / build logs | unknown | connector 403 |
| Root Directory setting | unknown | connector 403 |
| Which host Vercel treats as primary | unknown | no deployment to observe |

Re-authenticating the Vercel connector to the `devraymunds-projects` scope
would let me read all five directly and confirm the fix rather than handing
you a checklist.
