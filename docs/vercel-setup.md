# Vercel setup

One project, one repository, app at the root. **No `vercel.json`** — every
Next.js default is already correct, and the previous file is what broke the
last deploy.

## Project settings

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Root Directory | **empty (repository root)** |
| Build Command | default — `next build` |
| Output Directory | default — `.next` |
| Install Command | default — `npm install` |
| Node.js | 24.x |

### Root Directory is the one that matters

The existing `forgelinetechnologies` project has Root Directory set to
**`web`**. After this rebuild that directory does not exist. **It must be
cleared**, or the build fails exactly as it did before.

Leave Build and Install on defaults. A `cd web` override is what produced
`sh: line 1: cd: web: No such file or directory` previously; `package.json`'s
`build` script is already exactly `next build`.

## Environment variables — Production

| Variable | Required |
|---|---|
| `DATABASE_URL` | Yes — read at build time, missing fails the deploy |
| `SESSION_SECRET` | Recommended — reserved for auth |
| `RESEND_API_KEY` | Optional — enquiry email only |
| `CONTACT_EMAIL` | Optional |
| `RESEND_FROM` | Optional |

**Do not set `NEXT_PUBLIC_BASE_PATH`.** It belonged to a staging experiment
in the previous app, does not exist in this codebase, and would move every
route under a prefix — a green build that still 404s the homepage.

## Domains

Attach **both**:

- `forgelinetechnologies.com` — set as **primary**
- `www.forgelinetechnologies.com`

Vercel then creates the `www → apex` redirect automatically. Do not also add
a `redirects()` rule in `next.config.ts`; two mechanisms doing the same job
is how redirect loops happen.

DNS is already correct and needs no registrar change:

| Host | Record | Value |
|---|---|---|
| apex | A | `216.198.79.1` |
| www | CNAME | → apex |

The apex is canonical because DNS already treats it that way, and
`src/lib/site.ts` asserts the same host for metadata, robots and sitemap. If
Vercel is ever set to serve www as primary, change `src/lib/site.ts` — one
place, everything follows.

## Why the domain currently 404s

`x-vercel-error: DEPLOYMENT_NOT_FOUND` on both hosts. Two projects
(`forgeline`, `forgeline-85f6`) were deleted and the domain went with them;
the replacement project has no successful production deployment. DNS is fine
— there is simply nothing behind the hostname.

Attaching the domain to a project that has a green deployment resolves it.

## Deploy checklist

1. Clear Root Directory (currently `web`)
2. Add `DATABASE_URL` and `SESSION_SECRET` to Production
3. Attach both domains, apex primary
4. Push — or Redeploy
5. Verify:

```
curl -sI https://forgelinetechnologies.com/       → 200
curl -sI https://www.forgelinetechnologies.com/   → 308 → apex
curl -s  https://forgelinetechnologies.com/robots.txt
curl -s  https://forgelinetechnologies.com/sitemap.xml
```
