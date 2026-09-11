# Rebuild — Phase 0 Backup Record

**Date:** 2026-09-11
**Preservation commit:** `28f6bfa380789733bb49f3dfc67dcc56b0beb5ea`
**Status: backup complete and verified. Nothing destructive has been done.**

Phase 0 instructs a stop before irreversible work. This document is that
stop. See section 8 for a finding that should be read before Phase 1 begins.

---

## 1. Current repository structure

Git root: `/Users/raymundhermoso/projects/company` — branch `main`, clean.

| Path | Files | Size | What it is |
|---|---|---|---|
| `web/` | 161 | 655 MB† | **The ForgeLine Next.js application** |
| `tools/` | 80 | 316 MB† | site-audit CLI — unrelated to the app |
| `site/` | 41 | 3.2 MB | Original static site, pre-Next.js |
| `src/` | 14 | 64 KB | Paused digital-twin project (root-level) |
| `docs/` | 6 | 76 KB | Verification records from Phase 1 |
| `data/` | 0 | — | Empty |
| `package.json`, `package-lock.json`, `tsconfig.json` | 3 | — | **Belong to the root digital-twin project, not the app** |
| `vercel.json` | 1 | — | `{ framework: "nextjs" }` |
| `install.sh`, `README.md`, `CLAUDE.md`, `WEBSITE-AUDIT.md` | 4 | — | Root docs and installer |

† Both sizes are dominated by `node_modules`, which is gitignored.

---

## 2. Current application location

`web/` — a Next.js 15 App Router application, TypeScript strict, 150 tracked
files. It is **not** at the repository root, and the root `package.json` /
`src/` / `tsconfig.json` belong to a different project entirely.

Composition:

```
web/src/app/          routes: / · /blog · /blog/[slug] · /admin/* · /econtent/*
                      plus robots.ts, sitemap.ts, 3 opengraph-image routes
web/src/components/   static-top, static-bottom, work-section, blog-teaser,
                      site-scripts, forms/lead-form, admin-icons
web/src/lib/          queries, auth, guards, markdown, slug, email, validation,
                      metadata, blog, env
web/src/db/           schema.ts, index.ts, seed.ts, works-seed.json
web/scripts/          add-user, extract-works, update-work-copy, verify-db
web/public/assets/    38 files — 17 project images, founder photo, logos
web/_archive-redesign/  31 files, excluded from tsconfig
```

---

## 3. Database — tables and record counts

Neon PostgreSQL, `public` schema. Counts at time of backup:

| Table | Rows | Notes |
|---|---|---|
| `works` | **17** | Real client projects — the portfolio |
| `posts` | **1** | Seed starter post, published |
| `project_inquiries` | **1** | `John Doe`, a manual browser test from `::1` |
| `users` | **2** | 1 admin (active), 1 editor (active) |

Structure: 47 columns, 13 indexes, 52 constraints across the four tables.

---

## 4. Backup location and contents

**`backups/2026-09-11/`** — local only, and **gitignored**. The repository is
public and `users.json` contains email addresses, so committing it would
publish them.

| File | Size | Contents |
|---|---|---|
| `schema.json` | 21 KB | All columns, indexes and constraints from `information_schema` / `pg_indexes` |
| `works.json` | 10 KB | All 17 project records, complete |
| `posts.json` | 828 B | The 1 post, complete |
| `project_inquiries.json` | 374 B | The 1 test enquiry |
| `users.json` | 505 B | 2 accounts — **`password_hash` deliberately excluded** |

### Verification

Not assumed — checked by reading the files back:

```
works                17 rows  (live 17)  ✓
posts                 1 rows  (live 1)   ✓
project_inquiries     1 rows  (live 1)   ✓
users                 2 rows  (live 2)   ✓
schema.json          47 columns, 13 indexes, 52 constraints
spot check           works[0] = 'Talk Global Study', slug='talk-global-study'
credentials excluded True

BACKUP VERIFIED
```

**This backup is on local disk only.** Copy it somewhere durable before any
destructive step — a disk failure now would lose it.

---

## 5. Files being replaced (if Phase 1 proceeds)

Everything under `web/`, plus the root `vercel.json`.

**Recoverable from git.** The application is committed and pushed:

| Commit | Contents |
|---|---|
| `2f099ed` | Application baseline — 152 files, 16,556 insertions |
| `c743606` | Server-rendered stats, blog delinked, sharing metadata |
| `c3afca4` | Phase 1 verification documents |
| `28f6bfa` | This preservation commit |

All are on `origin/main`. Deleting `web/` is reversible with
`git checkout 28f6bfa -- web/`.

---

## 6. Files being preserved

| Path | Why |
|---|---|
| `backups/2026-09-11/` | The backup itself |
| `tools/site-audit/` | Unrelated tooling |
| `docs/` | Verification records — history of what was measured |
| `CLAUDE.md` | Project rules and positioning |
| `WEBSITE-AUDIT.md` | Conversion audit, still the basis of the roadmap |
| `site/assets/` | **Original project images and logos** — see below |

`site/` deserves care. `web/public/assets/` holds copies of the 17 project
images, but `site/index.html` is the provenance of the current design and is
still parsed by `scripts/extract-works.mjs` to regenerate the seed. Deleting
it without first confirming the images exist elsewhere would lose originals.

---

## 7. What cannot be backed up

| Item | Why |
|---|---|
| **Neon instance itself** | Data and schema are exported, but not a point-in-time snapshot. Use Neon's own branch/restore feature for that. |
| **Vercel project settings** | Connector returns `403 Forbidden` on project detail, domains, env vars and deployments. Root Directory, attached domains and production env vars are all unreadable from here. |
| **Secret values** | `web/.env` is gitignored and deliberately not copied into any backup. If it is lost, `DATABASE_URL` and `SESSION_SECRET` must be regenerated from Neon and `openssl`. |
| **Deployment history** | Two prior Vercel projects (`forgeline`, `forgeline-85f6`) were deleted; their build logs are gone. |

---

## 8. Finding to read before Phase 1

**The stated reasons for the rebuild are not, on the evidence, caused by the
codebase.** Recording this because Phase 0 exists to surface exactly this kind
of thing before irreversible work.

| Stated reason | What was measured |
|---|---|
| Routing issues | Production build is clean — 26 routes, `basePath` empty, homepage prerendered |
| Vercel configuration issues | Root cause was Root Directory `web` combined with a `cd web` build override, now removed; and two projects auto-deploying from one repo, since deleted |
| Legacy scripts | `port-homepage.mjs` and `html-to-jsx.mjs` were already deleted in Phase 1 Task 2 |
| Partial production setup | Env vars and domain attachment — both dashboard-side |

The decisive evidence: correct code was pushed as `c3afca4`, and the domain
still returned `404 DEPLOYMENT_NOT_FOUND` six minutes later. **A rebuild
produces a new application that meets exactly the same two blockers** —
`DATABASE_URL` in the Vercel project, and the domain attached to it.

There is also a structural obstacle to the target layout. The repository root
already contains `package.json`, `package-lock.json`, `tsconfig.json` and
`src/` belonging to the paused digital-twin project. Putting a Next.js app at
the root means deleting or relocating those first — a second destructive
decision the brief does not mention.

And the work that would be discarded is verified, not merely present: a
DB-backed CMS with authentication and roles, 17 real project records, and an
enquiry pipeline that passed 7 of 7 end-to-end scenarios including a database
failure simulation.

None of this makes a rebuild wrong — a clean foundation has real value, and
the decision is the owner's. It does mean the rebuild should be chosen for
that reason, rather than in the expectation that it will fix the deployment.

---

## 9. State at this checkpoint

- Backup written and verified
- Preservation commit `28f6bfa` created; working tree clean
- Nothing deleted, no database changed, no Vercel setting touched
- `backups/` added to `.gitignore`

**Stopped here for confirmation, as Phase 0 requires.**
