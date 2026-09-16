# Prospecting Engine — Phase 0 Handoff

This is the continuation guide for the next ForgeLine development session. Phase 0 created documentation only. It did not add a Prospecting Engine implementation, database migration, route, job, crawler, discovery source, outreach sender, or production-data change.

Read [the Prospecting Engine specification](./prospecting-engine.md) before planning implementation.

## Current state

### Repository checkpoint

Checked on 2026-09-14 (Asia/Manila):

| Item | State |
| --- | --- |
| Branch | `main` |
| Latest commit | `cd7c3c57abcb0dad9e50706bbc0307ba0397de32` — `Remove a fabricated testimonial and two false claims before outreach` |
| Worktree state before Phase 1 implementation | Phase 0 docs and untracked `AGENTS.md` were present; an unrelated tracked deletion of `public/google7ea74dc5ce189336.html` remains preserved. |
| Application stack | Next.js 16.3.4, React 19, TypeScript, Neon PostgreSQL, Drizzle ORM, Resend, Vercel. |
| Current Prospecting Engine | Phase 1 implemented and verified end-to-end against Neon; the migration is applied and audits run with no external job service. |

Do not assume the commit currently deployed to Vercel is the same as this repository commit without checking Vercel deployment metadata. Public route reachability was checked, but deployment-to-commit provenance was not available from the repository.

### Verification performed in Phase 0

- `npm test`: passed — 31 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build -- --webpack`: passed after allowing network access for configured Google Fonts.
- The default Turbopack build could not run in this execution environment because its helper attempted to bind a local port. This is an environment limitation, not a source failure; the webpack control build compiled, type-checked, generated all routes, and completed.
- Existing notices observed during build: Next.js deprecates the `middleware` file convention in favour of `proxy`; the build also reports an existing Edge Runtime compatibility warning in the Next.js import trace. Neither was changed in Phase 0.
- Public `https://www.forgelinetechnologies.com/` and `/admin/login` responded successfully during read-only checks. No contact or review form was submitted, because doing so would create production data and may send email.

### Current architecture

```text
src/app/(site)       Public App Router pages
src/app/admin        Authenticated App Router admin pages
src/components       Public and admin UI components
src/lib              Server actions, auth, queries, email, validation, site utilities
src/db               Drizzle schema and lazy Neon client
drizzle              Existing SQL migration
src/data             Public-site and Build Audit content
```

The public site includes homepage, services, pricing, process, work/case studies, blog, review submission, contact, and `/build-audit` pages. The existing Build Audit page is a public description of a broader diagnostic service; it is not an automated audit engine.

The app is deployed as a root-level Vercel Next.js project according to `docs/vercel-setup.md`. Treat older deployment/environment documentation as historical context and verify it against code and the Vercel dashboard before changing configuration.

### Current admin dashboard

Current admin routes:

- `/admin` — dashboard and counts/recent records;
- `/admin/inquiries` and `/admin/inquiries/[id]` — inbound contact enquiries and notes;
- `/admin/reviews` — moderated client reviews;
- `/admin/blog`, `/admin/blog/new`, `/admin/blog/[id]/edit` — blog management;
- `/admin/works`, `/admin/works/new`, `/admin/works/[id]/edit` — portfolio/work management;
- `/admin/users` — admin-user management;
- `/admin/login` — sign-in.

Authentication is database-backed with server-side sessions. `src/middleware.ts` performs the lightweight unauthenticated redirect; server pages/actions use the actual guards in `src/lib/auth`. Current capabilities include the existing content/inquiry controls plus admin-only `prospecting.manage`. Phase 1 adds `/admin/prospecting/audit` and `/admin/prospecting/audits/[id]`; the navigation link is filtered by that capability and the server action re-authorizes it.

### Current data model

The source of truth is `src/db/schema.ts`; the only checked-in migration is `drizzle/0000_admin_dashboard.sql`.

| Table | Purpose |
| --- | --- |
| `users` | Admin/editor accounts. |
| `sessions` | Revocable server-side admin sessions. |
| `projects` | ForgeLine portfolio work; public routes call this “work.” |
| `posts` | Blog posts; this is the actual table name, not `blog_posts`. |
| `inquiries` | Inbound project/contact-form submissions. |
| `inquiry_notes` | Author-attributed notes on an inbound enquiry. |
| `reviews` | Client review submissions and moderation state. |
| `audit_logs` | Small authenticated-admin action history. |
| `prospect_audits` | Phase 1 queued/running/completed/partial/failed single-URL audit state and report JSON. |
| `audit_findings` | Phase 1 evidence-level findings linked to an audit with cascade cleanup. |

Important migration history: `inquiries` predates the migration journal and contains live production data. `drizzle/0000_admin_dashboard.sql` is explicitly idempotent and preserves that table. Do not use an unreviewed destructive migration or assume a generated baseline can safely recreate existing production tables. `drizzle-kit push` is available through npm scripts, but no database command is authorised for Prospecting Engine work until the new schema has been designed, reviewed, backed up, and migrated safely.

### Existing content and email behaviour

- The public contact form writes an inbound `inquiries` record and can send an internal Resend notification plus visitor confirmation.
- Review submission writes a pending `reviews` record and can notify the studio. Reviews require human moderation and publication permission.
- Existing Resend functions are for inbound enquiries and review notifications only. There is no prospecting/outreach sender.
- Portfolio (`projects`) and blog (`posts`) have draft/published/archived workflows; `inquiries` are triaged with statuses and notes.

Do not repurpose existing inbound contact/email code for outbound prospecting. It has different consent, risk, audit, and approval requirements.

### Relevant configuration

Never copy values from `.env` into documentation, source control, prompts, or logs. The local application uses these relevant names:

| Variable | Current code use |
| --- | --- |
| `DATABASE_URL` | Neon connection used by `src/db/index.ts` and Drizzle CLI scripts. |
| `SESSION_SECRET` | Present in the local environment; verify actual current usage before changing it. |
| `RESEND_API_KEY` | Server-side Resend configuration. |
| `RESEND_FROM` | Resend sending identity. |
| `CONTACT_EMAIL` | Internal recipient for inbound enquiry notification. |
| `REPLY_TO` and public analytics/site variables | Present in templates/configuration; verify code usage before relying on them. |

The local environment also contains provider-style Postgres connection variables. Do not treat them as a separate application data model; the code path here uses `DATABASE_URL`.

## Phase 1 implementation checkpoint

The manual single-URL engine is implemented and tracked in
[`docs/prospecting-engine-phase1-report.md`](./prospecting-engine-phase1-report.md)
and the executable plan at
[`docs/superpowers/plans/2026-09-14-prospecting-phase1.md`](./superpowers/plans/2026-09-14-prospecting-phase1.md).

Implemented flow:

```text
Admin-only form → safe URL validation → queued Neon row → `after()` job
  → bounded fetch + deterministic checks → findings/scores in Neon → report review
```

The implementation uses Cheerio, records partial and failed states, and keeps
business fit/decision-maker availability explicitly unassessed.
`drizzle/0001_prospecting_audits.sql` is additive/idempotent and **has been
applied**: `prospect_audits` and `audit_findings` exist and hold real audits.

The job runs in-process through the Next.js `after()` API, so there is no queue
service, no worker process, and no prospecting environment variable. `npm run
dev` is the entire local setup. This replaced Inngest on 2026-09-16 — see the
Phase 1 report for why.

## Next phase — build this first

Build **only the manual, single-URL Audit Engine** before prospect discovery.

Target route:

```text
/admin/prospecting/audit
```

Initial user flow:

```text
Authenticated admin enters one URL
  → URL and SSRF safety validation
  → audit request is created
  → bounded checks run asynchronously
  → structured findings and partial/failure state are saved
  → admin reviews the report
```

The first deliverable should be able to audit `https://example.com` accurately and visibly distinguish:

- observed result;
- check that did not run or was inconclusive;
- recommendation that follows from the result;
- unsupported business claim, which must not appear.

Do not start directory/search discovery, contact enrichment, AI outreach drafting, or any sending capability until the single-URL audit has tests and reliable reviewer outcomes.

Before code changes, make a focused Phase 1 design and implementation plan that covers:

1. audit data model and safe migration strategy;
2. SSRF/network, crawl, robots, timeout, payload, rate-limit, and retention policies;
3. worker/queue choice that fits Vercel/serverless execution limits;
4. deterministic findings and their test fixtures;
5. admin authorization and review UX;
6. partial failures, retries, cache rules, and cost instrumentation.

## Do not change without an explicit, separately scoped reason

- Public pages, navigation, copy, metadata, visual design, and existing Build Audit messaging.
- Contact form, enquiry creation, Resend inbound notifications, or visitor confirmations.
- Review submission/moderation and publication-permission controls.
- Existing admin routes, roles, capabilities, session handling, and audit logging.
- Production Neon tables, data, indexes, or migration history.
- Vercel environment values, domain setup, root directory, build configuration, or deployment settings.
- The untracked `AGENTS.md` present when Phase 0 began.

Documentation changes are preferred until a Phase 1 design is approved.

## Prospecting Engine future shape

The proposed new tables are `prospects`, `prospect_audits`, `audit_findings`, `outreach_drafts`, and `prospect_events`. They deliberately remain separate from inbound `inquiries` and current `audit_logs`. See [the specification](./prospecting-engine.md#database-plan) for fields and relationships.

The future admin namespace is:

```text
/admin/prospecting
/admin/prospecting/audit
/admin/prospecting/prospects
/admin/prospecting/prospects/[id]
/admin/prospecting/audits
/admin/prospecting/settings
```

Future state must retain evidence alongside every score, AI summary, and outreach draft. A human review gate is mandatory before qualification, invitation, draft approval, and any external sending action.

## Operating rules for the continuation session

- Treat automated checks as observations, not proof of commercial harm.
- Cite stored finding IDs in AI output and outreach drafts.
- Prefer “I noticed…” over unsupported conclusions about a business.
- Collect only public, lawful, necessary contact/source information and honour suppression/opt-out records.
- Keep page count, domain rate, payload size, execution time, retries, external API calls, and model use bounded and measurable.
- Do not add a synchronous multi-page crawler to a Next.js request handler.
- Do not use the existing Resend integration to send prospecting messages.
- Make every migration additive and reviewable; back up/verify production first.

## Phase 0 deliverables

- `docs/prospecting-engine.md` — source-of-truth product and technical specification.
- `docs/prospecting-engine-handoff.md` — this continuation guide.

No other application, schema, migration, configuration, or deployment change belongs to Phase 0.
