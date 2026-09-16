# Prospecting Engine Phase 1 Report

## Status

**Implementation complete and verified end-to-end: 2026-09-16**

This report tracks implementation changes for the manual, single-URL Website Audit Engine. It is intentionally separate from the product specification and handoff so the next session can see what changed and what was verified.

The migration has been applied, real audits have run, and the background job no longer depends on an external service. There is no remaining external setup: `npm run dev` runs the whole engine.

## Scope

Phase 1 includes:

- authenticated admin input at `/admin/prospecting/audit`;
- URL normalization and SSRF/network safety;
- one bounded website audit with deterministic findings;
- durable audit state and findings in Neon through Drizzle;
- in-process background execution through the Next.js `after()` API;
- an admin report showing evidence, limitations, scores, and partial/failure state;
- tests and verification evidence.

Phase 1 excludes prospect discovery, contact enrichment, AI analysis, outreach drafts, Resend integration for prospecting, cold-email sending, and public-site changes.

## Decisions

| Decision | Rationale | Date |
| --- | --- | --- |
| ~~Inngest for durable jobs~~ — **reversed 2026-09-16** | Superseded. See the row below. | 2026-09-14 |
| `after()` in place of Inngest | The audit is bounded to roughly 30 seconds in the worst case — one homepage, robots.txt, sitemap.xml and at most twelve link probes, each capped at 10s — so it completes inside one invocation. Inngest's durable execution bought nothing for that shape of work, while requiring a second long-running process (`inngest-cli dev`) for local development and two secrets in production. Audits `#1` and `#5` in `prospect_audits` are the recorded cost of that: both failed on transport (`fetch failed`, then `We couldn't find an event key`), never on audit logic. | 2026-09-16 |
| Neon remains source of truth | Admin reports and audit history must remain readable even when the job provider is unavailable. | 2026-09-14 |
| Admin-only `prospecting.manage` | Phase 1 fetches user-supplied external URLs and creates operational audit data; existing editors do not receive this capability by accident. | 2026-09-14 |
| Deterministic checks before AI | Phase 1 must produce traceable observations; AI analysis remains a later phase. | 2026-09-14 |
| Additive schema only | Existing production tables include live inquiries and must not be altered or dropped. | 2026-09-14 |

## Change log

| Date | Change | Files | Verification |
| --- | --- | --- | --- |
| 2026-09-14 | Phase 1 implementation plan created. | `docs/superpowers/plans/2026-09-14-prospecting-phase1.md` | Plan reviewed against Phase 0 specification. |
| 2026-09-14 | Added typed score contract and initial evidence-backed scoring implementation. | `src/lib/prospecting/types.ts`, `src/lib/prospecting/score.ts`, `tests/prospecting-score.test.ts` | RED observed: missing module; GREEN: focused suite 32/32 and full suite 32/32 pass. |
| 2026-09-14 | Added URL validation and bounded response fetching. | `src/lib/prospecting/url-safety.ts`, `src/lib/prospecting/fetch.ts`, `tests/prospecting-url.test.ts`, `tests/prospecting-fetch.test.ts` | Focused URL/fetch run: 42/42 pass; private-address, redirect, size, content-type, and timeout cases covered. |
| 2026-09-14 | Added Cheerio-based deterministic page analysis and bounded link discovery. | `src/lib/prospecting/analyze.ts`, `tests/prospecting-analyze.test.ts`, `package.json`, `package-lock.json` | Full test run: 44/44 pass; no business-loss language is emitted. npm reported 4 moderate dependency advisories; no automatic fix was run. |
| 2026-09-14 | Added additive Neon schema, guarded status transitions, and evidence persistence helpers. | `src/db/schema.ts`, `drizzle/0001_prospecting_audits.sql`, `src/lib/prospecting/audit.ts`, `tests/prospecting-audit-state.test.ts`, `src/lib/auth/audit.ts` | State transition test passes; `npm run typecheck` passes. Migration was reviewed but not applied to any database. |
| 2026-09-14 | Added event contract, bounded audit runner, Inngest function, signed App Router endpoint, and environment documentation. | `src/inngest/`, `src/app/api/inngest/route.ts`, `src/lib/prospecting/runner.ts`, `tests/prospecting-inngest.test.ts`, `.env.example`, `docs/environment.md` | Inngest `4.20.0`; focused contract/runner tests pass; full suite later passes 56/56. |
| 2026-09-16 | **Removed Inngest.** The job now runs in-process via `after()`. Deleted `src/inngest/` and `/api/inngest`, dropped the dependency and both environment variables, moved `maxDuration = 60` onto the two page segments, and added a re-run action that recovers an audit stuck in `queued`/`running`. | `src/lib/prospecting/run.ts`, `src/lib/prospecting/admin.ts`, `src/lib/prospecting/actions.ts`, `src/lib/prospecting/audit.ts`, `src/components/admin/prospecting/rerun-button.tsx`, `src/app/admin/prospecting/`, `tests/prospecting-admin.test.ts`, `tests/prospecting-runner.test.ts` | Full suite 61/61; typecheck, lint and build pass; live Neon audit `queued` → `partial` in 694 ms with 7 findings. |
| 2026-09-14 | Added admin-only input, queue action, capability-filtered navigation, persisted report review, and authorization tests. | `src/lib/prospecting/admin.ts`, `src/lib/prospecting/actions.ts`, `src/app/admin/prospecting/`, `src/components/admin/prospecting/`, `tests/prospecting-admin.test.ts` | Admin/form focused tests pass; editors and unknown roles are rejected; no email path is called. |
| 2026-09-14 | Expanded deterministic checks for HTTP/redirect/size/time, robots/sitemap responses, structured data, image dimensions, fixed-width signals, and bounded link probes; partial state is retained when support checks fail. | `src/lib/prospecting/analyze.ts`, `src/lib/prospecting/fetch.ts`, `src/lib/prospecting/runner.ts`, `tests/prospecting-analyze.test.ts` | Full suite: 56/56 pass; typecheck and lint pass. |
| 2026-09-16 | **Phase 2: bulk prospecting.** Added CSV parsing and domain normalization, contact classification, the `prospects` schema and its migration, a domain-unique upsert with a suppression guarantee, a compare-and-swap audit-queue drain, the import/list/detail admin screens with an in-request "Run queue now" action, and a command-line drain (`npm run prospecting:drain`) for large imports with no serverless time limit. `drizzle/0002_prospects.sql` has been written but **not applied** to any database — the `prospects` table does not exist yet. The CLI has not been executed and no end-to-end or production check has been performed. | `src/lib/prospecting/csv.ts`, `src/lib/prospecting/domain.ts`, `src/lib/prospecting/contact.ts`, `src/lib/prospecting/prospects.ts`, `src/lib/prospecting/drain.ts`, `src/lib/prospecting/queue.ts`, `src/db/schema.ts`, `drizzle/0002_prospects.sql`, `src/app/admin/prospecting/import/`, `src/app/admin/prospecting/prospects/`, `src/components/admin/prospecting/queue-actions.tsx`, `scripts/drain-prospecting.mts`, `package.json`, `docs/environment.md`, `docs/prospecting-engine-handoff.md`, `tests/prospecting-csv.test.ts`, `tests/prospecting-domain.test.ts`, `tests/prospecting-contact.test.ts`, `tests/prospecting-upsert.test.ts`, `tests/prospecting-drain.test.ts` | `npm test` — 85 passed, 0 failed. `npx tsc --noEmit` — exit 0. `npm run lint` — exit 0. `npm run build` — exit 0. No database connection was made and the drain CLI was not run. |

## Schema added (migration not applied)

Phase 1 adds only:

- `prospect_audits`: `id`, `requested_url`, `final_url`, `status`, `audit_version`, `requested_by`, `requested_at`, `started_at`, `completed_at`, `http_status`, `https`, `redirect_chain`, `report`, `scores`, `total_score`, `error_detail`, `created_at`, and `updated_at`;
- `audit_findings`: `id`, `audit_id` (cascade FK), `category`, `rule`, `severity`, `page_url`, `evidence`, `recommendation`, `confidence`, `observed_at`, and `created_at`;
- indexes on audit status/request time/requester and finding audit/category/severity.

No production migration is run by the implementation task. The SQL migration is additive and idempotent.

## Security controls

The implementation enforces:

- HTTP/HTTPS-only URLs;
- no URL credentials or fragments;
- rejection of loopback, private, link-local, multicast, and reserved addresses;
- DNS/address checks on the original and every redirect destination;
- at most 5 redirects, 1,000,000 response bytes, 10 seconds per fetch, one homepage plus no more than 12 discovered link probes, and one audit per request;
- incremental response-body reads before parsing;
- no private or gated data collection;
- no claims of revenue loss, customer loss, rankings, or conversion loss.

The audit reads unauthenticated HTTP responses only. It does not submit forms,
log in, scrape private data, call Resend, create prospects, or send outreach.

## Deterministic checks implemented

The report currently records evidence for missing/duplicate title and meta
description, H1 structure, canonical validity, robots meta and robots.txt,
noindex signals, sitemap availability/shape, JSON-LD validity/presence,
viewport, image alt text and dimensions, forms without submit controls, visible
CTA heuristic, fixed-width signals, response status/time/size, redirect chain,
stylesheet/script/image counts, technology indicators, and bounded link results.
Browser-rendered layout, Core Web Vitals, screenshot review, accessibility
conformance, search ranking, business fit, and decision-maker availability are
not assessed; the admin report labels those limits instead of guessing.

## Verification log

| Check | Result | Evidence |
| --- | --- | --- |
| Focused unit tests | Pass | Focused score, URL/fetch, analysis, admin, and runner runs passed. |
| Full unit test suite | Pass | `npm test` — 61 passed, 0 failed (2026-09-16). Node reports existing module-type warnings only. |
| Typecheck | Pass | `npm run typecheck` — exit 0. |
| Lint | Pass | `npm run lint` — exit 0. |
| Production webpack build | Pass | `npm run build -- --webpack` — exit 0 with approved network access for existing Neon/font build-time reads. Existing middleware deprecation notice remains. |
| Local audit of `https://example.com` | Pass (2026-09-16) | Ran through the production dependency wiring against Neon: `queued` → `partial` in 694 ms, HTTP 200 over HTTPS, 7 findings, score 25, empty error detail. The verification row was deleted afterwards. |
| Public-site regression review | Pass | No public page, contact, review, or Resend behavior was changed. An unrelated tracked deletion of `public/google7ea74dc5ce189336.html` was preserved. |

## Required external setup after code review

The production Vercel project needs **no prospecting environment variables**. The
two `/admin/prospecting` page segments declare `maxDuration = 60`, which is the
only deployment setting the engine depends on.

## Out-of-scope confirmation

No Phase 1 change may add:

- prospect discovery or directory/search scraping;
- private contact extraction;
- AI-generated recommendations or outreach;
- Resend outbound prospecting calls;
- automatic cold outreach;
- public website redesign or copy changes;
- destructive database operations.

## Handoff

The implementation plan is [here](./superpowers/plans/2026-09-14-prospecting-phase1.md). The product constraints and future roadmap remain in [the specification](./prospecting-engine.md), and the repository baseline remains in [the Phase 0 handoff](./prospecting-engine-handoff.md).
