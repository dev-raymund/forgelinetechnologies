# Prospecting Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an authenticated, evidence-led single-URL website audit that runs as a durable Inngest job, stores structured findings in Neon, and presents a reviewable report without changing public-site behavior or sending outreach.

**Architecture:** The admin submits and persists a `prospect_audits` row, then emits an Inngest event. An Inngest function fetches one bounded homepage, performs deterministic checks through dependency-injected pure modules, writes `audit_findings`, calculates an evidence-backed score, and marks the audit complete/partial/failed. The admin report reads persisted state; Neon is the source of truth and Inngest is only orchestration.

**Tech Stack:** Next.js App Router, TypeScript, Neon PostgreSQL, Drizzle ORM, Inngest, Cheerio, Zod, Node built-ins, and the existing admin/auth UI primitives.

**Spec:** `docs/prospecting-engine.md` and `docs/prospecting-engine-handoff.md`

## Global Constraints

- Build only the manual, single-URL Audit Engine before prospect discovery.
- Every finding must retain its checked URL, rule, observed evidence, timestamp, recommendation, and confidence.
- Validate only `http:` and `https:` URLs and block loopback, private, link-local, and unsafe resolved addresses.
- Bound redirects, pages, response bytes, link checks, and execution time; record partial/failed checks instead of inventing negative findings.
- Do not change public routes, public copy, contact/review behavior, existing admin behavior, or production data.
- Do not add prospect discovery, AI analysis, outreach drafts, Resend sending, or cold-email functionality.
- Human review is required; audit output is a recommendation and never a claim of revenue or conversion loss.
- Use an admin-only `prospecting.manage` capability for Phase 1.
- Add only additive, idempotent database schema and migration statements; do not run a production migration from this task.
- Add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` as empty-name examples only; never write secrets.

---

## File map

- Create `src/lib/prospecting/types.ts` for audit status, finding, report, score, and policy types.
- Create `src/lib/prospecting/url-safety.ts` for URL normalization, DNS/IP safety checks, and redirect validation.
- Create `src/lib/prospecting/fetch.ts` for bounded response fetching with injected `fetch` and resolver dependencies.
- Create `src/lib/prospecting/analyze.ts` for deterministic HTML, header, metadata, link, image, accessibility, mobile, and technology observations.
- Create `src/lib/prospecting/score.ts` for bounded component scores and cautious opportunity classification.
- Create `src/lib/prospecting/audit.ts` for authorized audit creation, persistence, and report queries.
- Create `src/lib/prospecting/runner.ts` and `src/inngest/contracts.ts` for the tested job pipeline and event boundary.
- Create `src/inngest/client.ts`, `src/inngest/functions.ts`, and `src/app/api/inngest/route.ts` for durable execution.
- Create `src/app/admin/prospecting/audit/page.tsx` and `src/app/admin/prospecting/audits/[id]/page.tsx` for input and report review.
- Create `src/components/admin/prospecting/audit-form.tsx` and `src/components/admin/prospecting/audit-report.tsx` for interactive admin UI.
- Modify `src/db/schema.ts` to add `prospectAudits` and `auditFindings` only.
- Create `drizzle/0001_prospecting_audits.sql` as an idempotent additive migration.
- Modify `src/lib/auth/capabilities.ts` and `tests/capabilities.test.ts` for `prospecting.manage`.
- Modify `src/components/admin/shell.tsx` to show the audit link only to authorized admins.
- Modify `.env.example` with the two Inngest variable names and update `docs/environment.md` with their purpose.
- Modify `package.json` and `package-lock.json` to add `cheerio` and `inngest`.
- Create `tests/prospecting-url.test.ts`, `tests/prospecting-fetch.test.ts`, `tests/prospecting-analyze.test.ts`, and `tests/prospecting-score.test.ts`.
- Create `docs/prospecting-engine-phase1-report.md` and update it after every implementation checkpoint.

## Task 1: Establish the Phase 1 report and pure contracts

**Files:**

- Create: `docs/prospecting-engine-phase1-report.md`
- Create: `src/lib/prospecting/types.ts`
- Create: `src/lib/prospecting/score.ts`
- Test: `tests/prospecting-score.test.ts`

**Interfaces:**

- `AuditStatus = "queued" | "running" | "completed" | "partial" | "failed"`.
- `FindingCategory = "technical" | "seo" | "accessibility" | "mobile" | "conversion" | "links" | "metadata" | "image"`.
- `AuditFinding` contains `id`, `category`, `rule`, `severity`, `pageUrl`, `evidence`, `recommendation`, `confidence`, and `observedAt`.
- `AuditReport` contains request/final URL, redirect chain, HTTP/HTTPS summary, technology indicators, performance indicators, page observations, score, classification, and check errors.
- `scoreReport(report): AuditScore` is pure and returns six component scores, total, and primary opportunity.

- [x] **Step 1: Write the report before implementation**

Create a dated report with sections for scope, decisions, files, schema, security controls, test evidence, environment requirements, and a chronological change log. Start with status `in progress` and explicitly list excluded features.

- [x] **Step 2: Write the score contract test first**

```ts
function finding(rule: string, category: FindingCategory, severity: FindingSeverity, points: number): AuditFinding {
  return {
    id: rule,
    category,
    rule,
    severity,
    pageUrl: "https://example.com/",
    evidence: { points },
    recommendation: "Review this observed signal.",
    confidence: "high",
    observedAt: "2026-09-14T00:00:00.000Z",
  };
}

test("scoreReport gives points only to observed findings and leaves unknown fit at zero", () => {
  const result = scoreReport({
    findings: [
      finding("missing-meta-description", "seo", "medium", 10),
      finding("missing-primary-cta", "conversion", "low", 5),
    ],
    businessFit: { status: "not_assessed", points: 0 },
    decisionMakerAvailability: { status: "not_assessed", points: 0 },
  });

  assert.equal(result.seo, 10);
  assert.equal(result.conversion, 5);
  assert.equal(result.businessFit, 0);
  assert.equal(result.decisionMakerAvailability, 0);
  assert.equal(result.total, 15);
});
```

Run `npm test -- tests/prospecting-score.test.ts`. Expected: fail because the score contract does not exist.

- [x] **Step 3: Implement the minimal types and score contract**

Define the exact discriminated unions (`FindingCategory`, `FindingSeverity`, and `Confidence`) and JSON-safe evidence types in `types.ts`, then implement `scoreReport` in `score.ts` with caps of 25/20/20/15/10/10. Use explicit finding-rule points, cap each component, and default unassessed business fit/decision-maker points to zero.

- [x] **Step 4: Run the focused test and the existing suite**

Run `npm test -- tests/prospecting-score.test.ts` and then `npm test`. Expected: the new test and all existing tests pass.

- [x] **Step 5: Update the report checkpoint**

Record the contract, score behavior, command output summary, and remaining tasks in `docs/prospecting-engine-phase1-report.md`.

## Task 2: Implement URL and response safety

**Files:**

- Create: `src/lib/prospecting/url-safety.ts`
- Create: `src/lib/prospecting/fetch.ts`
- Test: `tests/prospecting-url.test.ts`
- Test: `tests/prospecting-fetch.test.ts`

**Interfaces:**

- `normalizeAuditUrl(input: string): Promise<NormalizedAuditUrl>`.
- `assertSafeUrl(url: URL, resolveHost?: HostResolver): Promise<void>`.
- `fetchBoundedPage(url: URL, options: FetchOptions): Promise<BoundedPageResponse>`.
- `followAuditRedirect(response, requestedUrl, options): Promise<BoundedPageResponse>`.

- [x] **Step 1: Write failing URL-safety tests**

Cover normalization of a bare invalid value, acceptance of HTTPS, rejection of `file:`, credentials, loopback IPv4/IPv6, RFC1918/private ranges, link-local metadata ranges, localhost, and unsafe redirect destinations. Use an injected resolver so tests never perform real DNS.

- [x] **Step 2: Run URL tests to verify expected failures**

Run `npm test -- tests/prospecting-url.test.ts`. Expected: fail with missing URL-safety exports.

- [x] **Step 3: Implement URL normalization and address checks**

Trim input, require an absolute URL with `http:` or `https:`, reject username/password, normalize the URL without fragments, resolve hostnames through an injected `dns.promises.lookup` adapter, and reject private/loopback/link-local/multicast/reserved IPv4 and IPv6 ranges. Revalidate every redirect target before following it.

- [x] **Step 4: Write failing bounded-fetch tests**

Cover response-status preservation, redirect-chain limits, maximum body bytes, timeout/abort, unsupported content type, and a response without `Content-Length` whose stream exceeds the limit. Inject `fetch`, clock, and resolver dependencies.

- [x] **Step 5: Run fetch tests to verify expected failures**

Run `npm test -- tests/prospecting-fetch.test.ts`. Expected: fail with missing bounded-fetch exports.

- [x] **Step 6: Implement bounded response fetching**

Use `redirect: "manual"`, an abort timeout, a response-byte ceiling, a redirect ceiling of 5, and a single-page audit ceiling of 1 HTML document plus up to 12 same-origin link probes. Read streams incrementally; never call `response.text()` before enforcing the byte limit. Preserve status, headers, timing, redirect chain, and a structured failure reason.

- [x] **Step 7: Run focused and full tests**

Run `npm test -- tests/prospecting-url.test.ts tests/prospecting-fetch.test.ts` and `npm test`. Expected: all pass.

- [x] **Step 8: Update the report**

Record limits, SSRF test cases, and the fact that no real external URL is used by unit tests.

## Task 3: Build deterministic audit analysis

**Files:**

- Create: `src/lib/prospecting/analyze.ts`
- Modify: `src/lib/prospecting/types.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `tests/prospecting-analyze.test.ts`

**Interfaces:**

- `analyzePage(input: PageAnalysisInput): PageAnalysis`.
- `collectAuditLinks(baseUrl, html): DiscoveredLink[]`.
- `technologyIndicators(headers, document): TechnologyIndicator[]`.

- [x] **Step 1: Write fixture-based failing tests**

Use a local HTML fixture containing title, no meta description, one H1, missing image alt text, a viewport tag, canonical, robots meta, JSON-LD, internal/external links, a form, a visible-looking CTA, and a render-blocking stylesheet. Assert only observed findings with exact rules and evidence; assert no business-loss language.

- [x] **Step 2: Run analysis tests to verify failure**

Run `npm test -- tests/prospecting-analyze.test.ts`. Expected: fail because analysis exports do not exist.

- [x] **Step 3: Install the parser dependency**

Run `npm install cheerio`. If the sandbox blocks registry access, request the approved network escalation and rerun the same command; do not hand-edit the lockfile.

- [x] **Step 4: Implement parsing and checks**

Parse HTML with Cheerio and produce findings for title/description, duplicate or missing H1, canonical, robots/indexability, sitemap/robots response metadata passed by the runner, JSON-LD presence/parse validity, viewport, fixed-width/high-signal mobile issues, missing alt text, dimensions/loading hints, stylesheet/script resource counts, response size/time, forms, and visible CTA heuristics. Mark browser-dependent visual/performance checks as `not_assessed` rather than failing them.

- [x] **Step 5: Implement technology indicators**

Detect only transparent signals from headers, generator metadata, script/link paths, and HTML signatures. Include signal and confidence; never phrase a detector result as certainty.

- [x] **Step 6: Implement bounded link collection**

Resolve relative links, drop fragments and non-HTTP schemes, deduplicate, prioritize same-origin links, and return no more than 12 probes. Store the source page and discovered URL for every candidate.

- [x] **Step 7: Run focused and full tests**

Run `npm test -- tests/prospecting-analyze.test.ts` and then `npm test`. Expected: all pass.

- [x] **Step 8: Update the report**

List every deterministic rule implemented and explicitly list checks reported as unavailable without a browser or external performance provider.

## Task 4: Add scoring, persistence, and additive schema

**Files:**

- Modify: `src/db/schema.ts`
- Create: `drizzle/0001_prospecting_audits.sql`
- Modify: `src/lib/prospecting/audit.ts`
- Modify: `src/lib/prospecting/score.ts`
- Modify: `src/lib/auth/audit.ts`
- Test: `tests/prospecting-score.test.ts`
- Test: `tests/prospecting-audit-state.test.ts`

**Interfaces:**

- `createAuditRequest(input): Promise<{ id: number }>`; the Inngest event is emitted by the authenticated admin action after the durable request row exists.
- `getAuditForAdmin(id, actor): Promise<AuditDetail | null>`, where `AuditDetail` is the persisted audit plus ordered findings.
- `saveAuditRunning`, `saveAuditResult`, and `saveAuditFailure` persist state transitions.
- `prospectAudits` and `auditFindings` are Drizzle table exports with inferred types.

- [x] **Step 1: Extend score tests for classification and caps**

Assert that duplicate findings cannot exceed category caps, unassessed fit remains zero, a strong SEO evidence set classifies as `SEO`, a UX/conversion set classifies as `Website Improvement`, and ambiguous/insufficient evidence classifies as `Build Audit`.

- [x] **Step 2: Run score tests and verify the new cases fail**

Run `npm test -- tests/prospecting-score.test.ts`. Expected: new assertions fail before classification/cap logic is added.

- [x] **Step 3: Add Drizzle schema**

Add `prospectAudits` with serial ID, requested/final URLs, status, audit version, requested user, request/start/completion timestamps, status code, HTTPS flag, redirect chain JSON, report JSON, component score JSON, total score, error/partial detail, and updated timestamp. Add `auditFindings` with audit FK cascade, category/rule/severity/page URL, evidence JSON, recommendation, confidence, observed timestamp, and indexes on audit/category/severity.

- [x] **Step 4: Write the idempotent additive migration**

Create `drizzle/0001_prospecting_audits.sql` using `CREATE TABLE IF NOT EXISTS`, guarded foreign-key constraints, and `CREATE INDEX IF NOT EXISTS`. Do not alter or drop any existing table, column, index, or row.

- [x] **Step 5: Implement persistence and audit-log entries**

Authorize `prospecting.manage`, insert a queued audit, write `prospecting.audit.requested` to the existing audit log, and expose read/state-transition helpers that only accept valid status transitions. A failed Inngest send must mark the row failed with a reviewer-visible reason.

- [x] **Step 6: Run typecheck and score tests**

Run `npm test -- tests/prospecting-score.test.ts` and `npm run typecheck`. Expected: both pass without connecting to Neon.

- [x] **Step 7: Update the report**

Document the exact new tables/columns, migration safety, and the fact that migration application was not run.

## Task 5: Wire Inngest durable execution

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/inngest/client.ts`
- Create: `src/inngest/functions.ts`
- Create: `src/app/api/inngest/route.ts`
- Modify: `.env.example`
- Modify: `docs/environment.md`
- Test: `tests/prospecting-inngest.test.ts`

**Interfaces:**

- Event: `prospecting/audit.requested` with `{ auditId: number; requestedUrl: string; requestedBy: number }`.
- Function: `prospectingAudit` claims one audit, executes the runner, persists findings/report, and marks `completed`, `partial`, or `failed`.
- Route: `/api/inngest` exports `GET`, `POST`, and `PUT` from `serve()`.

- [x] **Step 1: Add a failing event/function contract test**

Test the pure event payload validator rejects missing/invalid IDs and accepts a valid request. Test the runner is called once for a claimed audit and failures become persisted `failed` state; inject persistence and audit runner dependencies rather than using Neon/Inngest in unit tests.

- [x] **Step 2: Run the focused test and verify failure**

Run `npm test -- tests/prospecting-inngest.test.ts`. Expected: fail because the event contract and function wrapper do not exist.

- [x] **Step 3: Install dependencies**

Run `npm install inngest`. If the sandbox blocks registry access, request the approved network escalation and rerun the same command; do not hand-edit the lockfile.

- [x] **Step 4: Implement the Inngest client and route**

Create an `Inngest` client with the app ID `forgeline-prospecting`, expose the standard App Router serve route, and require the signing/event keys in production while allowing the documented local dev server mode.

- [x] **Step 5: Implement the durable function**

Use an event-triggered function with durable steps for bounded fetching/support checks, analysis/scoring, and persistence. Configure three retries, a conservative global concurrency limit of one for Phase 1, and a 60-second Vercel route maximum. Never send email or create an outreach record.

- [x] **Step 6: Run focused and full tests**

Run `npm test -- tests/prospecting-inngest.test.ts` and `npm test`. Expected: all pass.

- [x] **Step 7: Update the report**

Record dependency versions from the lockfile, environment names (not values), event name, retry/concurrency policy, and the required Vercel/Inngest setup step.

## Task 6: Add authenticated admin input and report review

**Files:**

- Modify: `src/lib/auth/capabilities.ts`
- Modify: `tests/capabilities.test.ts`
- Modify: `src/components/admin/shell.tsx`
- Create: `src/app/admin/prospecting/audit/page.tsx`
- Create: `src/app/admin/prospecting/audits/[id]/page.tsx`
- Create: `src/components/admin/prospecting/audit-form.tsx`
- Create: `src/components/admin/prospecting/audit-report.tsx`
- Test: `tests/prospecting-admin.test.ts`

**Interfaces:**

- `prospecting.manage` is admin-only.
- `requestAudit(formData): Promise<AuditActionResult>` validates a URL, creates a queued row, emits the event, and redirects to `/admin/prospecting/audits/[id]`.
- Report page displays status, requested/final URL, redirect chain, HTTP/HTTPS, technology signals, performance indicators, all findings/evidence, score components, classification, and partial/error notices.

- [x] **Step 1: Write failing authorization and form tests**

Assert editors and unknown roles cannot use `prospecting.manage`, unauthenticated requests receive the existing session error, invalid URLs return a field error, and a valid request returns an audit ID without sending email.

- [x] **Step 2: Run focused tests and verify failure**

Run `npm test -- tests/prospecting-admin.test.ts tests/capabilities.test.ts`. Expected: new capability/form assertions fail before route/action code exists.

- [x] **Step 3: Add capability and navigation**

Add `prospecting.manage` to the existing capability matrix for `admin` only and add a “Prospecting audit” link filtered through `roleHas`; do not alter any existing link or role.

- [x] **Step 4: Implement the input page/action**

Use the existing admin shell and primitives, show the URL field and clear safety/coverage note, call the authorized audit request helper, send the Inngest event, and redirect to the report. Return reviewer-readable errors for invalid input or failed enqueue.

- [x] **Step 5: Implement the report page**

Use server-side `requireCapability`, load only persisted data, render evidence and limitations, show “not assessed” distinctly from failures, and never render claims about revenue, customer loss, or conversion loss.

- [x] **Step 6: Run focused and full verification**

Run `npm test -- tests/prospecting-admin.test.ts tests/capabilities.test.ts`, `npm run typecheck`, and `npm run lint`. Expected: all pass.

- [x] **Step 7: Update the report**

Record the admin routes, capability decision, visible review states, and excluded actions.

## Task 7: Integration verification and handoff

**Files:**

- Modify: `docs/prospecting-engine-phase1-report.md`
- Modify: `docs/prospecting-engine-handoff.md`
- Modify: `docs/environment.md`

- [x] **Step 1: Run the complete verification set**

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build -- --webpack`. The build may require network access for existing Google Fonts; do not modify the font configuration to work around a sandbox restriction.

- [ ] **Step 2: Run a local end-to-end audit with the Inngest dev server**

Run `npm run dev` in one terminal and `npx inngest-cli@latest dev` in another, using a local `.env` pointed at a disposable Neon database. Submit `https://example.com` from the authenticated admin and verify the report transitions from queued to completed/partial with findings. Do not use a production contact form or production database.

- [x] **Step 3: Verify production safety by diff review**

Run `git diff --check`, inspect `git status --short`, and confirm the diff contains no public-page changes, Resend sending changes, discovery code, outreach code, destructive SQL, or values from `.env`. Preserve the unrelated tracked deletion and untracked `AGENTS.md` unless the user explicitly asks to resolve them.

- [x] **Step 4: Complete the report and handoff**

Set the report status to `complete` only with command evidence, record any environment setup still required, link this plan, and state that prospect discovery remains out of scope.
