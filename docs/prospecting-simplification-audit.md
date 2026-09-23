# Prospecting simplification audit (Phase 0)

> **Historical.** This describes the prospecting engine as it was before the
> simplification, including the 100-point qualification model, score bands,
> the bulk CSV import and the audit queue — none of which still exist. It is
> kept for the reasoning behind those decisions and why they were reversed.
> For how prospecting works now, see
> [`prospecting-architecture.md`](prospecting-architecture.md).

**Date:** 2026-09-23
**Branch inspected:** `prospecting-phase-3` (48 commits ahead of `main`)
**Status:** analysis only. No application code, database, or migration was changed.

## Summary

The prospecting system on this branch is three layers deep. The scanner layer is
good and should mostly survive untouched. The bulk-pipeline layer and the
100-point qualification layer exist to serve a workflow — import a list, queue
it, drain it, score it out of 100, band it, have a reviewer adjust components
and record a qualification decision — that the simplified product does not have.

The single most useful finding: **the quick scan and the deep audit are the same
code.** `fetchBoundedPage` + `analyzePage` already produce every signal the
"Quick Findings" block needs, in one bounded pass. The deep audit is that same
pass *plus* twelve link probes. Nothing in the scanner needs rewriting; it needs
one optional flag and a different presentation.

The second most useful finding is in [§5](#5-database): **`main` has no
prospecting code at all**, and migrations `0002` and `0003` were never applied to
any database. The simplification carries essentially no production-data risk, and
it should happen *before* this branch merges rather than after.

---

## 1. Current architecture

Three layers, built in three phases, each depending on the one before it.

### Layer 1 — the scanner (Phase 1)

A manual single-URL website audit. Fully deterministic, no AI, no external job
service.

```text
admin enters URL
  → normalizeAuditUrl      url-safety.ts    SSRF guard, DNS resolution check
  → createAuditRequest     audit.ts         row inserted at status "queued"
  → after() response sent  actions.ts       Next.js `after`, same invocation
  → runAuditJob            runner.ts        orchestration
      → fetchBoundedPage   fetch.ts         bounded, timeout, redirect-checked
      → collectAuditSupport runner.ts       robots.txt, sitemap.xml, 12 link probes
      → analyzePage        analyze.ts       ~25 deterministic checks → findings
      → scoreReport        score.ts         findings → 100-point components
  → saveAuditResult        audit.ts         completed | partial, findings inserted
  → recordAuditOutcome     outcome.ts       writes lifecycle back to the prospect
```

The audit is bounded by design: one homepage, two support resources, at most
twelve link probes, each with a 10s timeout and a 3MB response cap. It completes
inside one serverless invocation, which is why there is no queue service.

Audit status is a strict state machine (`canTransitionAudit` in `audit.ts`) with
a compare-and-swap `UPDATE` behind every transition. That is what makes
concurrent drains safe.

### Layer 2 — the prospect store and bulk pipeline (Phase 2)

```text
CSV paste/upload
  → parseProspectCsv       csv.ts           RFC 4180, per-row errors, 2000-row cap
  → normalizeDomain        domain.ts        dedup key: lowercase host, no www
  → classifyContact        contact.ts       role-email | url | phone only
  → upsertProspects        prospects.ts     ON CONFLICT (domain), suppression-guarded
  → enqueueProspects       queue.ts         prospect → "queued" + audit row
  → drainAuditQueue        drain.ts         claim, run, apply, pause; budget-bounded
```

Two drain entry points: `runQueueNow` (a server action, 5 audits, 45s budget) and
`npm run prospecting:drain` (a CLI, 500 audits, no budget).

Suppression (`suppressed_at`) is the business's opt-out and is enforced in SQL in
four separate places, not in application logic. That is deliberate and correct.

### Layer 3 — qualification (Phase 3)

```text
loadQualification         qualification.ts   reads prospect + latest usable audit
  → qualifyProspect       qualify.ts         pure; no DB, no network
      6 components: websiteUx 25, seo 20, technical 20, conversion 15,
                    businessFit 10, decisionMakerAvailability 10  = 100
      → bandFor            strong 75+ / judgment 50+ / limited 25+ / insufficient
      → suggestOpportunities  primary + secondary[] from component thresholds
      → reviewer adjustments  per-component override with reason, pinned to auditId
      → opportunity override  reviewer-set primary + secondary[], with reason
      → decision              "" | qualified | dismissed, with reason and actor
  → qualificationSnapshot  denormalized total_score + primary_opportunity
                           written back so the list can sort and filter in SQL
```

The snapshot is refreshed on five separate paths (import, audit via drain, audit
via inline re-run, adjustment, override). Keeping those five in step is a
meaningful share of the Phase 3 complexity.

### What the whole thing does not do

There is no outreach generation, no email template, no prospect status beyond the
pipeline lifecycle (`new` / `queued` / `audited` / `suppressed`), and no AI. The
brief's desired output — one opportunity, one service, a reason, and a short
email — does not exist yet in any form.

### Cross-cutting

- **Auth.** Every route calls `requireCapability("prospecting.manage")`; every
  server action calls `authorise("prospecting.manage")`. Only the `admin` role
  holds it (`src/lib/auth/capabilities.ts`). Middleware only checks for a cookie
  and is explicitly not the security boundary.
- **Audit log.** 13 of the 34 `AuditAction` values are prospecting actions.
- **Navigation.** Three entries in `src/components/admin/shell.tsx:33-35`.
- **Tests.** 22 prospecting test files; 185 tests total in the suite, all passing
  in ~2.1s as of this inspection.

---

## 2. Current routes

| Route | File | Verdict | Notes |
|---|---|---|---|
| `/admin/prospecting/audit` | [audit/page.tsx](../src/app/admin/prospecting/audit/page.tsx) | **SIMPLIFY** | Becomes the primary entry point: paste a URL, get a quick scan. Needs a company-name field so the scan can create a prospect. Keep `maxDuration = 60`. |
| `/admin/prospecting/audits/[id]` | [audits/[id]/page.tsx](../src/app/admin/prospecting/audits/%5Bid%5D/page.tsx) | **KEEP** | This is the deep audit view, which the brief explicitly retains for after a prospect expresses interest. The page shell needs no change; its component does. |
| `/admin/prospecting/import` | [import/page.tsx](../src/app/admin/prospecting/import/page.tsx) | **REMOVE LATER** | CSV import exists to feed the bulk queue/drain workflow. With that gone, its only remaining value is loading many businesses at once, which the brief's flow ("find a business → paste URL") does not ask for. It is the cheapest thing on this list to keep if bulk loading is wanted later — see [§10](#10-files-to-eventually-remove). |
| `/admin/prospecting/prospects` | [prospects/page.tsx](../src/app/admin/prospecting/prospects/page.tsx) | **SIMPLIFY** | Keep the table, the country/industry filters, and the 200-row cap. Drop the Score and Band columns, the Band filter, the Decision column and filter, and the `QueueActions` header. Replace the status chips with the new lifecycle. Sort by `updated_at` instead of `total_score`. |
| `/admin/prospecting/prospects/[id]` | [prospects/[id]/page.tsx](../src/app/admin/prospecting/prospects/%5Bid%5D/page.tsx) | **REPLACE** | The Details / Contact / Sources / Suppress sections stay. `QualificationPanel` is replaced by a Quick Findings → Opportunity → Service → Reason panel plus the outreach email block. Audit history stays (it is the deep-audit trail), minus its Score column. |

No new routes are needed. The scan result, the opportunity, the email, and the
status all live on the prospect detail page.

---

## 3. Current components

| Component | LOC | Verdict | Why |
|---|---|---|---|
| [audit-form.tsx](../src/components/admin/prospecting/audit-form.tsx) | 59 | **SIMPLIFY** | Good shape already. Add a company-name input; change the copy from "Run website audit" to "Scan website"; it now redirects to a prospect, not an audit report. |
| [audit-report.tsx](../src/components/admin/prospecting/audit-report.tsx) | 187 | **SIMPLIFY** | Delete only the "Score components" section (lines 134–146) and the `classification` heading's fallback to `"Build Audit"`. Everything else — redirect chain, performance metrics, technology signals, findings with evidence, the no-inflated-claims footer — is the deep audit report and stays verbatim. |
| [rerun-button.tsx](../src/components/admin/prospecting/rerun-button.tsx) | 37 | **KEEP** | Unchanged. Still the recovery path for an audit whose process died. |
| [suppress-controls.tsx](../src/components/admin/prospecting/suppress-controls.tsx) | 99 | **KEEP** | Unchanged. Suppression is the opt-out and must survive the simplification — see [§5](#5-database). |
| [import-form.tsx](../src/components/admin/prospecting/import-form.tsx) | 273 | **REMOVE** | Goes with the import route. The preview-invalidation logic in it is careful work, but it has no role in a one-URL-at-a-time flow. |
| [queue-actions.tsx](../src/components/admin/prospecting/queue-actions.tsx) | 81 | **REMOVE** | "Queue all new" and "Run queue now" are the bulk workflow. |
| [qualification-panel.tsx](../src/components/admin/prospecting/qualification-panel.tsx) | 195 | **REPLACE** | The entire 100-point presentation: the /100 readout, the band meaning and required action, the six-row component table with automatic/effective columns and stale-adjustment warnings, the automatic-vs-effective opportunity comparison. Replaced by a much smaller `opportunity-panel.tsx`. |
| [score-adjust-controls.tsx](../src/components/admin/prospecting/score-adjust-controls.tsx) | 171 | **REMOVE** | There are no score components left to adjust. |
| [opportunity-controls.tsx](../src/components/admin/prospecting/opportunity-controls.tsx) | 179 | **SIMPLIFY** | Keep as a **single-select** opportunity override with a reason. Do not keep the secondary multi-select. This control earns its place: three of the eight required opportunity values (Automation, Web Application, Integration) cannot be evidenced from a homepage fetch, so a human choosing them is the only honest route — see [§7](#7-qualification). |
| *(new)* `status-controls.tsx` | — | **NEW** | The nine-value outreach lifecycle. Replaces `decision-controls.tsx`. |
| [decision-controls.tsx](../src/components/admin/prospecting/decision-controls.tsx) | 97 | **REPLACE** | Qualified/Dismissed/Clear becomes the nine-value status. Its shape (reason box + three actions + pending state) is a good template for the replacement. |
| *(new)* `outreach-email.tsx` | — | **NEW** | Renders the generated email, with a copy button. Generates only; never sends. |
| *(new)* `quick-findings.tsx` | — | **NEW** | The ✓/✗ checklist block. |

---

## 4. Current lib modules

Every file in `src/lib/prospecting/`, in dependency order.

### KEEP — unchanged

| Module | LOC | Why |
|---|---|---|
| [url-safety.ts](../src/lib/prospecting/url-safety.ts) | 147 | The SSRF guard. Full IPv4 and IPv6 private-range detection including IPv4-mapped IPv6, re-checked on every redirect hop. Explicitly preserved by the brief. Touch nothing here. |
| [fetch.ts](../src/lib/prospecting/fetch.ts) | 158 | Bounded fetching: 3MB cap enforced while streaming (not just on `content-length`), 10s timeout via `AbortController`, manual redirect handling capped at 5 hops with an SSRF check per hop, content-type allowlist. Explicitly preserved. |
| [analyze.ts](../src/lib/prospecting/analyze.ts) | 361 | Every deterministic check in the brief's preserve list. See [§6](#6-scanner). |
| [domain.ts](../src/lib/prospecting/domain.ts) | 57 | Per-label hostname validation and the `https://{domain}/` audit URL. Still needed: a pasted URL must still normalise to a dedup key so the same business is not entered twice. |
| [audit.ts](../src/lib/prospecting/audit.ts) | 158 | Audit row lifecycle and the compare-and-swap state machine. The deep audit still needs all of it. |
| [admin.ts](../src/lib/prospecting/admin.ts) | 184 | The dependency-injected request/re-run workflow. It is auth-aware, re-validates a stored URL against DNS before re-fetching it, and records a scheduling failure on the row. Reused by both the quick scan and the deep audit. |

### KEEP — pending one decision

| Module | LOC | Why |
|---|---|---|
| [contact.ts](../src/lib/prospecting/contact.ts) | 61 | Classifies a contact as role-email, URL, or phone, and **rejects a named individual's email address**. The rationale is documented in the file: a named person's work address is personal data under UK GDPR and the Australian Privacy Act, and refusing it at parse time keeps subject-access and erasure obligations out of the system. The brief's suggested schema asks for `contactName` and `contactEmail`, which is the opposite. This is a decision for you, not for me — see [§5](#5-database). |

### SIMPLIFY

| Module | LOC | Change |
|---|---|---|
| [runner.ts](../src/lib/prospecting/runner.ts) | 208 | Two changes. (a) Make link probing optional inside `collectAuditSupport` so a quick scan does homepage + robots.txt + sitemap.xml (3 fetches, ~1–3s) and a deep audit adds the 12 link probes. (b) Drop the `scoreReport` call and the `scores` / `totalScore` fields from `prepareAuditResult`'s persistence object. Everything else — the `partial` vs `completed` determination, the report jsonb, `linkFindings` — stays. |
| [run.ts](../src/lib/prospecting/run.ts) | 70 | Keep the `after()` orchestration and the two-layer error guard verbatim. Only the `recordAuditOutcome` call shrinks. |
| [outcome.ts](../src/lib/prospecting/outcome.ts) | 116 | Keep `lastAuditId` / `lastAuditedAt`. Drop `refreshSnapshot` entirely (no snapshot to refresh). `lifecycleFor` mostly disappears: in the simplified model `status` is human-owned, so a finished audit must not write it at all. That is a *simplification of a guarantee the current code works hard for* — Phase 2's worst defect was a pipeline write clobbering human state, and removing the pipeline writer removes the defect class. |
| [prospects.ts](../src/lib/prospecting/prospects.ts) | 269 | Keep `getProspect`, `listProspects`, `suppressProspect`, `unsuppressProspect`. Add a single-prospect upsert-by-domain. Drop `buildUpsertValues`, `upsertConflictSet`, `qualificationInputsChanged`, the bulk `upsertProspects`, the band filter, and the decision filter. `suppressProspect`'s cancellation of queued audits can go with the queue. |
| [review-input.ts](../src/lib/prospecting/review-input.ts) | 91 | Keep the `Validated<T>` shape, `validateProspectId`, and the 300-char reason bound — these are used by every action and the pattern is right (server-side validation inside each action, not only in the browser). Drop `validateAdjustment`, `validateOverride`, `validateDecision`, `validateComponentKey`. Add `validateStatus` and `validateOpportunity`. |
| [types.ts](../src/lib/prospecting/types.ts) | 112 | Keep `AuditStatus`, `FindingCategory`, `FindingSeverity`, `Confidence`, `AuditFinding`, `JsonValue`. Replace the `Opportunity` union and `OPPORTUNITIES` with the new eight values. Delete `AssessedScore`, `ScoreInput`, `AuditScore`, `ComponentKey`, `FindingComponentKey`, `ScoreAdjustment`, `ScoreAdjustments`, `OpportunityOverride`, `ProspectDecision`. |
| [actions.ts](../src/lib/prospecting/actions.ts) | 249 | Keep `requestAudit`, `rerunAudit`, `suppressProspectAction`, `unsuppressProspectAction`. Drop `previewImport`, `commitImport`, `queueAllNew`, `runQueueNow`. Add `scanUrlAction`, `setStatusAction`, `setOpportunityAction`, `generateOutreachAction`. |

### MERGE

| Module | LOC | Change |
|---|---|---|
| [fit.ts](../src/lib/prospecting/fit.ts) | 123 | The *points* go; the *tables* are worth keeping. `TARGET_MARKETS` (AU / GB / UK / US / CA) and `INDUSTRY_SYNONYMS` encode CLAUDE.md's target markets and industries, with whole-string matching chosen specifically so "Rebuild Church Ministries" never scores as Construction. That is useful for flagging a prospect as in-market and for personalising an email. Merge the two tables and `normalizeIndustry` / `targetIndustry` into a new `targets.ts`; delete `scoreBusinessFit`, `scoreContact`, `RuleScore`, and `REVIEWER_ONLY_ROLE`. |

### REPLACE

| Module | LOC | Replaced by |
|---|---|---|
| [qualify.ts](../src/lib/prospecting/qualify.ts) | 279 | A new `opportunity.ts`: an ordered list of deterministic rules over the scan result, first match wins, each carrying its own evidence string. Roughly 80–120 lines. See [§7](#7-qualification). |
| [qualification.ts](../src/lib/prospecting/qualification.ts) | 229 | A much smaller store. `toObservedFinding` and `storedTechnologyIndicators` are worth carrying over verbatim — the second one defensively filters untyped jsonb rather than trusting it, which is still needed. `latestUsableAudit` is worth keeping too. Everything else (`loadQualification`, `refreshQualificationSnapshot`, the six adjustment/override/decision writers) goes. |

### REMOVE

| Module | LOC | Why |
|---|---|---|
| [score.ts](../src/lib/prospecting/score.ts) | 137 | The 100-point model itself: `CAPS`, `RULE_POINTS`, `pointsForFinding`, `componentFor`, `classify`, `scoreReport`, `MIN_FINDING_TOTAL`. Nothing in the simplified product is measured in points. |
| [qualification-actions.ts](../src/lib/prospecting/qualification-actions.ts) | 243 | Six server actions: adjust score, clear adjustment, set override, clear override, qualify, dismiss, clear decision. Only the override survives, in simplified form, and it moves to `actions.ts`. |
| [queue.ts](../src/lib/prospecting/queue.ts) | 241 | The bulk enqueue path and the production drain dependencies, including stale-claim recovery. `isLostClaim` is the one export with a life outside the queue (`prospects.ts` uses it) and can move to `audit.ts` if still needed after `suppressProspect` stops cancelling queued audits. |
| [drain.ts](../src/lib/prospecting/drain.ts) | 129 | The drain loop, its budget accounting and its skip/claim summary. Explicitly out of scope. |
| [csv.ts](../src/lib/prospecting/csv.ts) | 217 | Hand-rolled RFC 4180 parsing with physical line numbers and per-row errors. Good code with no remaining caller once import goes. **Remove last**, in Phase 7, so the decision to drop bulk import can be reversed cheaply until then. |

**Totals:** of the 3,839 lines in `src/lib/prospecting/`, 1,126 are kept
unchanged (url-safety, fetch, analyze, domain, audit, admin, contact), 1,238 are
simplified or merged, and 1,475 are replaced or removed. The new modules
(`opportunity.ts`, `targets.ts`, `outreach.ts`, `findings-summary.ts`) should add
roughly 300. Net: about a 40% reduction, concentrated entirely in layers 2 and 3.

---

## 5. Database

Three prospecting tables exist in `src/db/schema.ts`, created by three
migrations.

### Deployment reality — read this first

| Fact | Evidence |
|---|---|
| `main` contains **no prospecting code and no prospecting migration**. Its only migration is `drizzle/0000_admin_dashboard.sql`. | `git ls-tree -r --name-only main \| grep -i prospect` → 0 files |
| All 48 prospecting commits are unmerged, on `prospecting-phase-3`. | `git log --oneline main..prospecting-phase-3 \| wc -l` → 48 |
| Migration `0001` (`prospect_audits`, `audit_findings`) **was applied** to Neon during Phase 1 verification. | `docs/prospecting-engine-handoff.md:19` |
| Migration `0002` (`prospects`) had **not** been applied to any database. | `docs/prospecting-engine-handoff.md:19` |
| Migration `0003` (qualification columns) is documented as *"before merging: apply to production"* — i.e. not yet applied. | `docs/prospecting-engine.md:137` |

**The consequence is large and good:** there is no deployed prospecting
application, no reviewer has ever recorded a decision, and the `prospects` table
most likely does not exist in any database. Almost everything this simplification
removes is holding no data.

**Verify before Phase 1** with one read-only query — no writes, no schema change:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('prospects', 'prospect_audits', 'audit_findings');

-- and, only if prospects came back:
SELECT count(*) AS rows,
       count(*) FILTER (WHERE decision <> '')            AS decisions,
       count(*) FILTER (WHERE score_adjustments <> '{}') AS adjustments,
       count(*) FILTER (WHERE suppressed_at IS NOT NULL) AS suppressions
FROM prospects;
```

If that query returns only `prospect_audits` and `audit_findings`, take path A in
[§9](#9-migration-strategy). If `prospects` exists with rows, take path B.

### `prospect_audits` — KEEP

| Column | Verdict |
|---|---|
| `id`, `requested_url`, `final_url`, `status`, `requested_by`, `prospect_id`, `requested_at`, `started_at`, `completed_at`, `http_status`, `https`, `redirect_chain`, `report`, `error_detail`, `created_at`, `updated_at` | **Keep.** All of it serves the deep audit and the scan history. |
| `audit_version` | **Keep.** Currently always `"phase1-v1"`. Becomes genuinely useful once quick scans and deep audits are two shapes in one table — set `"quick-v1"` and `"deep-v1"`. |
| `scores` (jsonb), `total_score` (integer) | **Stop writing in Phase 2; drop in Phase 7.** These hold the six-component breakdown and the /100 total. Nothing in the simplified product reads them. Leaving the columns in place during the transition costs nothing and keeps the old report page renderable. |

### `audit_findings` — KEEP entirely

No change. This is the evidence store, and it is exactly what both the Quick
Findings block and the deterministic opportunity rules read. The
`category` / `rule` / `severity` / `evidence` / `recommendation` / `confidence`
shape is right and the `observed_at` timestamp is what makes a finding
defensible.

### `prospects` — SIMPLIFY

| Column | Verdict | Notes |
|---|---|---|
| `id`, `company_name`, `domain`, `website_url`, `industry`, `country`, `location` | **Keep** | Matches the brief's suggested schema exactly. `domain` stays the unique dedup key. |
| `status` varchar(16) | **Keep the column, replace the values** | Old: `new` / `queued` / `audited` / `suppressed` (pipeline states). New: the nine outreach states. All nine fit in 16 characters (`Audit Requested` is the longest at 15), but **widen to varchar(24)** in the Phase 1 migration — 1 character of headroom is not headroom. |
| `suppressed_at`, `suppression_reason` | **Keep** | Do not fold these into `status`. "Not a Fit" is ForgeLine's judgement; suppression is the business asking not to be contacted. They are different facts with different obligations, and the existing code enforces the opt-out in SQL in several places. This is the one piece of Phase 2/3 state that must survive intact. |
| `last_audit_id`, `last_audited_at` | **Keep** | The link to the deep audit. |
| `primary_opportunity` varchar(32) | **Rename to `opportunity`** | Same column, new value set. All eight new values fit in 32 (`No Clear Opportunity` is the longest at 20). |
| `sources` jsonb | **Keep, simplified** | Append-only import provenance. With one-at-a-time entry there is usually one entry, but recording where a business was found is still worth having. |
| `contact_channel`, `contact_provenance` | **Decision required** | See below. |
| `total_score` | **Remove** | Only supports the 100-point list sort. |
| `score_adjustments` jsonb | **Remove** | Only supports per-component reviewer adjustment. |
| `opportunity_override` jsonb | **Replace with two plain columns** | The jsonb holds `{primary, secondary[], reason, byUserId, byEmail, at}`. With no secondaries and no automatic/effective split, this becomes `opportunity_set_by` + `opportunity_reason`. |
| `decision`, `decision_reason`, `decided_by`, `decided_at` | **Remove** | The qualified/dismissed axis collapses into `status`. |
| *(new)* `service` varchar(40) | **Add** | The single recommended ForgeLine service. Longest CLAUDE.md service name is "Custom web applications" (23). |
| *(new)* `opportunity_reason` text | **Add** | The evidence-based sentence shown to the human and used in the email. |
| *(new)* `contact_name`, `contact_email`, `contact_phone` | **Decision required** | See below. |
| `created_by`, `created_at`, `updated_at` | **Keep** | |

### The contact decision — this one is yours

The brief's suggested schema asks for `contactName`, `contactEmail` and
`contactPhone`. The existing `contact.ts` **deliberately refuses a named
individual's email**, and documents why: under UK GDPR and the Australian Privacy
Act a named person's work address is personal data, which would make `prospects`
a personal-data store carrying subject-access and erasure obligations. Refusing
it at parse time keeps those obligations out of the system entirely. CLAUDE.md
lists the United Kingdom and Australia as two of the four target markets, so both
regimes apply.

Three options, in the order I would consider them:

1. **Keep the role-channel-only rule** (recommended default). Store
   `contact_email` but validate it through `classifyContact`, so `info@` is
   accepted and `jane.smith@` is not. Add `contact_phone` (a business number is
   not personal data). Do not add `contact_name`. Costs nothing, changes nothing
   legally, and a permission-based first email to `info@` is the normal path
   anyway.
2. **Add all three fields and accept the obligation.** Workable, but it needs a
   retention rule, a deletion path, and a note in the privacy policy. That is
   real work and should be scoped deliberately, not slipped into Phase 1.
3. **Add `contact_name` as a free-text label only** (e.g. "Practice Manager")
   without an individual's address. A middle path that keeps the email
   personalised without storing a person.

I have written the Phase 1 plan in [§12](#12-phase-plan) assuming option 1,
because it is the only one that changes nothing about the system's legal
position. Say the word and it becomes option 2 or 3 — it is a two-column
difference in one migration, not a redesign.

### Could production data be affected?

**Almost certainly not, and not at all if the verification query comes back as
expected.** The only prospecting rows that can exist are Phase 1 audits in
`prospect_audits` / `audit_findings`, and those two tables are kept unchanged.
`inquiries` — the one table the handoff doc flags as holding live production data
— is not touched by any part of this work. The public website, the contact
system, reviews, blog and work management are all outside the blast radius.

---

## 6. Scanner

**Reuse it essentially as-is.** `analyze.ts` already implements every check on
the brief's preserve list:

| Brief's item | Where |
|---|---|
| HTTP status | `analyzePage` → `http-response-error`; `performance.status` |
| HTTPS | `prepareAuditResult` → `https: finalUrl.startsWith("https:")` |
| redirect chain | `fetchBoundedPage` → `redirectChain`; `redirect-chain-too-long` |
| title | `missing-title`, `duplicate-title` |
| meta description | `missing-meta-description`, `duplicate-meta-description` |
| H1 | `missing-h1`, `multiple-h1` |
| canonical | `missing-canonical`, `invalid-canonical` |
| robots meta | `missing-robots`, `noindex-meta` |
| robots.txt | `missing-robots-txt`, `invalid-robots` |
| sitemap | `missing-sitemap`, `invalid-sitemap` |
| JSON-LD | `missing-structured-data`, `invalid-structured-data` (parses each block) |
| viewport | `missing-viewport` |
| image alt text | `missing-image-alt` (per image, indexed) |
| form detection | `form-without-submit-control` (per form) |
| CTA detection | `hasPrimaryCta` → `missing-primary-cta` |
| response time | `slow-response` at 3,000ms; `performance.responseTimeMs` |
| HTML size | `oversized-html` at 500KB; `performance.htmlBytes` |
| scripts | `performance.scriptCount` |
| stylesheets | `performance.renderBlockingStylesheets` |
| images | `performance.imageCount` |
| technology detection | `technologyIndicators` → WordPress, Shopify, WooCommerce (generator tag *or* plugin asset path), Vercel, Next.js |
| bounded links | `collectAuditLinks` → deduped, same-origin first, capped at 12 |

Nothing on that list is missing, and nothing should be rewritten.

### The one change the scanner needs

The expensive part of an audit is not the analysis — it is `collectAuditSupport`
fetching robots.txt, sitemap.xml **and probing up to twelve links**, each with a
10s timeout. That is what makes an audit take ~30s.

Split it:

```text
Quick scan   homepage + robots.txt + sitemap.xml        3 fetches   ~1-3s
Deep audit   the above + up to 12 link probes          15 fetches   ~10-30s
```

The plumbing for this already exists. `runAuditJob` skips support entirely when
`fetchResource` is absent (`runner.ts:196-198`) and `prepareAuditResult` handles
`support === undefined` (`runner.ts:122`). The change is one optional
`probeLinks` flag threaded through `collectAuditSupport`, so a quick scan still
gets robots and sitemap — which the SEO opportunity rule wants — without the
fourteen extra requests.

### Quick Findings

The brief's example block is a small derivation over what the scan already
returns. Roughly:

| Line | Derived from |
|---|---|
| ✓/✗ HTTPS | `https` |
| ✓/✗ Mobile structure | absence of `missing-viewport` and `fixed-width-layout` |
| ✓/✗ Page titles and descriptions | absence of `missing-title`, `missing-meta-description` |
| ✓/✗ Contact method | a `form` was found, or a `mailto:`/`tel:` link was seen |
| ✓/✗ Clear next step | absence of `missing-primary-cta` |
| ✓/✗ Sitemap and robots.txt | absence of `missing-sitemap`, `missing-robots-txt` |
| ✓/✗ Structured data | absence of `missing-structured-data`, `invalid-structured-data` |
| Platform | `technologyIndicators` |

One caveat worth recording: the brief's example includes "✓ Multiple local
service areas", which is a *content* signal. Nothing currently extracts it.
`collectAuditLinks` gives up to twelve same-origin link URLs, so counting
service-shaped paths is possible but would be a new check with a real false-
positive rate. I would leave it out of Phase 2 and add it later only if the
local-SEO opportunity proves useful in practice. Every other line above is
already evidenced.

---

## 7. Qualification

### What exists only because of the 100-point model

These are the pieces with no purpose outside it:

**Whole modules:** `score.ts` (137), `qualify.ts` (279), `qualification-actions.ts` (243).

**Inside other files:**

- `types.ts` — `AssessedScore`, `ScoreInput`, `AuditScore`, `ComponentKey`,
  `FindingComponentKey`, `ScoreAdjustment`, `ScoreAdjustments`,
  `OpportunityOverride`, `ProspectDecision` (lines 42–62, 76–112).
- `fit.ts` — `scoreBusinessFit`, `scoreContact`, `RuleScore`,
  `REVIEWER_ONLY_ROLE` (the point-awarding half of the file).
- `qualification.ts` — `loadQualification`, `refreshQualificationSnapshot`,
  `setScoreAdjustment`, `clearScoreAdjustment`, `setOpportunityOverride`,
  `clearOpportunityOverride`, `setDecision`, `clearDecision`, `decisionValues`.
- `prospects.ts` — `buildUpsertValues`'s snapshot call, the `staleScores`
  accounting, `qualificationInputsChanged`, the band clause and decision clause
  in `prospectListWhere`, `DECISION_FILTERS`.
- `runner.ts` — the `scoreReport` call and the `scores` / `totalScore` fields.
- `outcome.ts` — `refreshSnapshot` and its retry wrapper.
- `review-input.ts` — `validateAdjustment`, `validateOverride`,
  `validateDecision`, `validateComponentKey`.
- `schema.ts` — `prospects.total_score`, `score_adjustments`,
  `opportunity_override`, `decision`, `decision_reason`, `decided_by`,
  `decided_at`; `prospect_audits.scores`, `total_score`;
  `prospects_score_idx`, `prospects_decision_idx`.
- `scripts/requalify-prospects.mts` — exists solely to rebuild snapshots.

A hidden cost worth naming: the denormalized snapshot has to be refreshed on
**five** separate paths (import, drain audit, inline audit re-run, adjustment,
override), and keeping those five correct is a recurring source of the branch's
defect history. Removing the snapshot removes all five.

### The deterministic replacement

One ordered rule list, first match wins, each rule carrying the evidence that
fired it. No points, no caps, no bands, no components, no totals.

```text
scan result (findings, technologyIndicators, performance, https, status)
  → rules, in order
  → { opportunity, service, reason, evidence[] }
```

Proposed rules:

| # | Opportunity | Fires when | Evidence it cites |
|---|---|---|---|
| 1 | **Needs Manual Review** | the fetch failed, timed out, was refused, or returned a non-HTML content type | the `AuditFetchError` code |
| 2 | **E-commerce** | Shopify or WooCommerce detected | the generator tag or plugin asset path |
| 3 | **Website Development** | no HTTPS, **or** `missing-viewport` / `fixed-width-layout`, **or** an HTTP error status | the named findings |
| 4 | **SEO** | two or more of `missing-title`, `missing-meta-description`, `missing-h1`, `missing-sitemap`, `missing-robots-txt` | the specific rules matched |
| 5 | **No Clear Opportunity** | the scan succeeded and nothing above fired | "the checks found no clear opportunity" |

**Automation, Web Application and Integration are deliberately not reachable by
any rule.** A homepage fetch cannot evidence that a business has a manual process
worth automating or a system worth integrating. The existing code already reached
this conclusion — `opportunity-controls.tsx` says so in its own doc comment — and
inventing a rule for them would be exactly the claim inflation CLAUDE.md
forbids. They stay reachable only through the human single-select override, which
is why that control survives ([§3](#3-current-components)).

Service mapping is a fixed table, not logic:

| Opportunity | Service |
|---|---|
| SEO | SEO |
| Website Development | Business websites |
| E-commerce | E-commerce |
| Automation | Business automation |
| Web Application | Custom web applications |
| Integration | API integrations |
| No Clear Opportunity | — |
| Needs Manual Review | — |

Reason wording must stay inside the evidence. The existing audit report footer is
the right standard and should be carried into the new panel verbatim: *"This
report contains observations from a bounded unauthenticated fetch. It is not a
claim about revenue, rankings, customer loss, or conversion loss."* The reason
sentence says what was observed and what it *may* indicate — never lost revenue,
lost customers, guaranteed rankings, guaranteed leads, traffic loss, conversion
loss, that a business is bad, or that it needs a redesign.

`opportunity.ts` should be **pure** — no database, no network — exactly as
`qualify.ts` is today. That property is the reason the current qualification
model is testable, and it is worth keeping even as the model shrinks.

---

## 8. Simplified architecture

The smallest thing that supports `URL → scan → opportunity → service → reason →
email → status`.

```text
 admin pastes URL + company name
            │
            ▼
   normalizeDomain ─────────────────────── domain.ts        KEEP
   normalizeAuditUrl ───────────────────── url-safety.ts    KEEP
            │
            ▼
   upsert prospect by domain ───────────── prospects.ts     SIMPLIFY
            │
            ▼
   quick scan
     fetchBoundedPage ──────────────────── fetch.ts         KEEP
     collectAuditSupport(probeLinks:false) runner.ts        SIMPLIFY
     analyzePage ───────────────────────── analyze.ts       KEEP
     saveAuditResult ───────────────────── audit.ts         KEEP
            │
            ▼
   summarizeFindings ───────────────────── findings-summary.ts  NEW
   detectOpportunity ───────────────────── opportunity.ts       NEW   (pure)
            │
            ▼
   prospect.opportunity / .service / .opportunity_reason
            │
            ├──────────────► human may override opportunity (single-select + reason)
            │
            ▼
   buildOutreachEmail ──────────────────── outreach.ts          NEW   (pure)
            │
            ▼
   human reads, copies, sends from their own mail client
            │
            ▼
   setStatus ───────────────────────────── actions.ts       SIMPLIFY
     To Contact → Email Sent → Interested → Audit Requested
                → Call → Proposal → Won | Lost | Not a Fit
            │
            ▼ (only once Interested / Audit Requested)
   deep audit: the existing full runAuditJob with link probes
     → /admin/prospecting/audits/[id]  ─── audit-report.tsx  SIMPLIFY
```

**Five surfaces, total:**

1. `/admin/prospecting/audit` — paste URL + company name, scan.
2. `/admin/prospecting/prospects` — the list.
3. `/admin/prospecting/prospects/[id]` — findings, opportunity, email, status,
   suppress, audit history.
4. `/admin/prospecting/audits/[id]` — the deep audit report.
5. Admin nav: two entries instead of three.

**Four new pure modules**, none of which touch the database or the network:
`opportunity.ts`, `findings-summary.ts`, `outreach.ts`, `targets.ts`. Purity is
the point — every one of them is fully testable without Neon, a network, or a
cookie, which is what keeps the test suite at ~2 seconds.

**No AI anywhere.** The architecture leaves exactly one seam for it later:

```text
detectOpportunity  →  { opportunity, service, reason, evidence[] }
                             │
                             ├──► buildOutreachEmail (deterministic template)
                             │
                             └──► [later, optional] refineWording(result) → better prose
```

An optional refinement step takes a complete deterministic result and returns
better wording. If it is absent, unconfigured, or fails, the deterministic
result is what ships. No API key, no provider, and no failure mode is introduced
in any of Phases 1–7.

### Outreach

`buildOutreachEmail` is a pure function over the prospect and its scan result,
producing subject and body for a human to read, edit and send. It must:

1. name the business;
2. cite one thing genuinely observed, quoting the evidence;
3. state the opportunity without overstating it ("there may be an opportunity
   to…", never "you are losing…");
4. introduce ForgeLine in one sentence as a web development studio;
5. ask permission to prepare a short review;
6. stop there — no pricing, no urgency, no second ask.

There is **no send path**. No Resend call, no mail transport, no queue, no
scheduled job. The output is text on a page with a copy button. The audit log
records that an email was generated and that the status moved to "Email Sent";
it does not record the body.

---

## 9. Migration strategy

Two principles: the old system keeps working until the new one replaces it, and
nothing is deleted until nothing reads it.

### Database path — choose after the verification query in §5

**Path A — `prospects` does not exist (expected).**

Rewrite `drizzle/0002_prospects.sql` to create the simplified table, and delete
`drizzle/0003_prospect_qualification.sql`. Neither file has ever run anywhere, so
there is no migration history to preserve and no journal to reconcile. The result
is one clean additive migration that creates exactly the columns the product
needs — rather than creating six columns in `0003` and dropping them again in
`0004`.

This is not "deleting the old system first". The *code* still lands
incrementally, phase by phase; this only avoids shipping a schema we already know
we do not want.

**Path B — `prospects` exists with rows.**

Leave `0002` and `0003` untouched as history. Add `0004_simplify_prospects.sql`,
strictly additive: add `service`, `opportunity_reason`, `opportunity_set_by`;
widen `status` to varchar(24); backfill `status` from the old values
(`new` → `To Contact`, `audited` → `To Contact`, `queued` → `To Contact`,
`suppressed` → leave and rely on `suppressed_at`); backfill `opportunity` from
`primary_opportunity` through a mapping table. The old columns stay, unread, and
are dropped in Phase 7 by `0005_drop_qualification_columns.sql` — after a backup,
and only once `grep` confirms nothing references them.

Under either path, `prospect_audits.scores` and `total_score` stop being written
in Phase 2 and are dropped in Phase 7.

### Code path — always incremental

| Step | Old system | New system |
|---|---|---|
| Phase 1 | untouched, still works | columns added; nothing reads them |
| Phase 2 | untouched | quick scan built and unit-tested, not yet wired to a route |
| Phase 3 | untouched | `opportunity.ts` built and unit-tested, not yet wired |
| Phase 4 | qualification panel removed from the page; modules still compile | new panel renders from the new modules |
| Phase 5–6 | queue/import routes still reachable | outreach and status shipped |
| Phase 7 | deleted | the only system |

Two checkpoints are worth insisting on:

- **After Phase 4**, the whole flow works end to end for one real business, on a
  real URL, before anything is deleted. If the simplified model turns out to be
  wrong, everything is still there.
- **Before Phase 7 deletes anything**, `npm run typecheck`, `npm run lint`,
  `npm test` and `npm run build` all pass, and `grep -rn` confirms zero
  references to each module about to go.

### Merge order

Because `main` has no prospecting code, the entire simplification should land
**before** this branch merges. The order is: simplify on a branch off
`prospecting-phase-3`, verify, apply the one migration to Neon, then merge. This
avoids the awkward sequence `docs/prospecting-engine.md:137` currently
prescribes — apply `0003` to production, merge, then immediately migrate away
from it.

### Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| `prospects` turns out to exist with real decisions in it | low | The §5 verification query answers it in one read. Path B then applies. |
| The deterministic rules classify real sites unhelpfully | **medium — the real risk** | Rules are pure and cheap to change. Run the quick scan against 10–20 real target-market businesses at the end of Phase 3 and read the output before building any UI on it. |
| The quick scan misses something the deep audit caught, and outreach is written on thin evidence | medium | Robots and sitemap stay in the quick scan; only link probes are dropped, and a broken link is not an outreach hook anyway. |
| Dropping `total_score` loses a useful prioritisation signal | low | The list sorts by `updated_at` instead. If prioritisation is missed later, it can return as a filter on `opportunity`, which is more honest than a number. |
| Deleting `csv.ts` removes bulk loading someone wanted | low | It is removed last, in Phase 7, and it is self-contained enough to restore from git if the one-at-a-time flow proves too slow. |
| Test suite loses coverage as modules are deleted | low | Each phase deletes a module and its test together, and the phase's own tests replace the coverage. Watch the 185 baseline: it should fall as removals land and rise as new modules arrive. |

---

## 10. Files to eventually remove

Nothing here is removed before Phase 7. Listed with the phase at which its last
caller disappears.

**Library modules (7 files, 1,475 lines)**

```text
src/lib/prospecting/score.ts                   137   dead after Phase 3
src/lib/prospecting/qualify.ts                 279   dead after Phase 3
src/lib/prospecting/qualification.ts           229   dead after Phase 4   (port 3 helpers first)
src/lib/prospecting/qualification-actions.ts   243   dead after Phase 4
src/lib/prospecting/queue.ts                   241   dead after Phase 6   (check isLostClaim's callers)
src/lib/prospecting/drain.ts                   129   dead after Phase 6
src/lib/prospecting/csv.ts                     217   dead after Phase 6   (remove last)
```

**Components (5 files, 817 lines)**

```text
src/components/admin/prospecting/score-adjust-controls.tsx   171
src/components/admin/prospecting/qualification-panel.tsx     195   replaced in Phase 4
src/components/admin/prospecting/decision-controls.tsx        97   replaced in Phase 6
src/components/admin/prospecting/import-form.tsx             273
src/components/admin/prospecting/queue-actions.tsx            81
```

**Routes**

```text
src/app/admin/prospecting/import/page.tsx      28
```

**Scripts and package entries**

```text
scripts/drain-prospecting.mts                  41
scripts/requalify-prospects.mts                29
package.json  →  "prospecting:drain", "prospecting:requalify"
```

**Tests (10 files)**

```text
tests/prospecting-score.test.ts
tests/prospecting-qualify.test.ts
tests/prospecting-fit.test.ts                  partial — keep the target-table cases
tests/prospecting-qualification-store.test.ts
tests/prospecting-review-input.test.ts         partial — keep the shared validators
tests/prospecting-reviewer-state.test.ts
tests/prospecting-list-filter.test.ts          partial — keep country/industry
tests/prospecting-queue.test.ts
tests/prospecting-drain.test.ts
tests/prospecting-csv.test.ts
tests/prospecting-upsert.test.ts               partial — keep single-prospect upsert
```

**Schema and migration objects (Phase 7, after backup)**

```text
prospects.total_score, score_adjustments, opportunity_override,
          decision, decision_reason, decided_by, decided_at
prospect_audits.scores, total_score
index prospects_score_idx, prospects_decision_idx
```

**Audit-log actions** — remove from the `AuditAction` union once unused:
`prospect.queue`, `prospect.import`, `prospect.qualify`, `prospect.dismiss`,
`prospect.decision.clear`, `prospect.score.adjust`, `prospect.score.clear`.
Keep `prospect.opportunity.set` / `.clear`; add `prospect.scan`,
`prospect.status`, `prospect.outreach.generate`.

*Historic log rows keep their old action strings. Do not rewrite them — an audit
log that gets edited is not an audit log.*

---

## 11. Files to preserve

### Preserve unchanged

```text
src/lib/prospecting/url-safety.ts        147   SSRF guard — do not touch
src/lib/prospecting/fetch.ts             158   bounded fetch, limits, redirects, timeout
src/lib/prospecting/analyze.ts           361   every deterministic check
src/lib/prospecting/domain.ts             57   dedup key and audit URL
src/lib/prospecting/audit.ts             158   audit lifecycle + compare-and-swap
src/lib/prospecting/admin.ts             184   DI'd request/re-run workflow
src/lib/prospecting/contact.ts            61   privacy guard (pending the §5 decision)
src/lib/retry.ts                               Neon cold-start retries

src/components/admin/prospecting/rerun-button.tsx        37
src/components/admin/prospecting/suppress-controls.tsx   99

tests/prospecting-url.test.ts
tests/prospecting-fetch.test.ts
tests/prospecting-analyze.test.ts
tests/prospecting-domain.test.ts
tests/prospecting-contact.test.ts
tests/prospecting-audit-state.test.ts
tests/prospecting-admin.test.ts
tests/prospecting-runner.test.ts         adjust only where scores are asserted
tests/prospecting-outcome.test.ts        adjust only where the snapshot is asserted
```

### Preserve, modified

```text
src/lib/prospecting/runner.ts, run.ts, outcome.ts, prospects.ts,
                    review-input.ts, types.ts, actions.ts
src/lib/prospecting/fit.ts       → tables only, merged into targets.ts
src/db/schema.ts                 → prospects table only
src/components/admin/prospecting/audit-form.tsx, audit-report.tsx,
                                  opportunity-controls.tsx
src/components/admin/shell.tsx   → nav entries
src/lib/auth/audit.ts            → AuditAction union
src/app/admin/prospecting/**     → four of five routes
```

### Preserve absolutely — outside this work

```text
src/lib/auth/**                  capabilities, guard, session, password, cookie
drizzle/0000_admin_dashboard.sql
src/db/schema.ts                 users, projects, posts, inquiries, sessions,
                                 reviews, inquiryNotes, auditLogs
                                 (inquiries holds live production data)
prospect_audits, audit_findings  both tables, both already applied to Neon
src/app/(public)/**              the public website
src/app/admin/{inquiries,reviews,blog,works,users,media}/**
docs/prospecting-engine*.md      keep as history; add a status note, do not rewrite
docs/superpowers/**              the Phase 1-3 specs and plans are the record of
                                 why the current design exists
```

The three admin capabilities checks stay exactly as they are:
`prospecting.manage` remains admin-only, every route keeps its
`requireCapability` call, and every server action keeps its `authorise` call.
The simplification removes actions; it never removes a guard.

---

## 12. Phase plan

Eight phases, as specified. No phase adds AI, prospect discovery, automated
sending, or CRM functionality beyond the prospect list.

### Phase 0 — Analysis (this document)

Complete. No code, database or migration changed.

### Phase 1 — Simplify the data and application model

- Resolve the contact-field decision in [§5](#5-database).
- Run the verification query; choose migration path A or B.
- Update `prospects` in `src/db/schema.ts`.
- Write the one migration. Do not apply it to Neon yet.
- Update `types.ts`: new `Opportunity` union, new `ProspectStatus` union, delete
  the nine scoring types.
- Add `targets.ts` from `fit.ts`'s tables.
- Old code still compiles and still works. Nothing is deleted.

**Done when:** `npm run typecheck`, `lint`, `test` and `build` all pass, and the
migration has been read by a human but not yet run.

### Phase 2 — Simplify the quick website scan

- Add the `probeLinks` flag to `collectAuditSupport`.
- Stop writing `scores` / `totalScore` in `prepareAuditResult`.
- Add `findings-summary.ts` (pure) and its tests.
- Wire a `scanUrl` path that creates or finds a prospect by domain, runs the
  quick scan, and stores the audit.

**Done when:** a quick scan of a real URL completes in a few seconds, stores its
findings, and produces a Quick Findings block in a test.

### Phase 3 — Simple opportunity detection

- Add `opportunity.ts` (pure): the ordered rules, the service map, the reason
  builder, and its tests.
- **Run it against 10–20 real target-market businesses and read the output
  before building UI on it.** This is the checkpoint that decides whether the
  rules are right.

**Done when:** the rules classify real sites in a way a human agrees with, and
no reason sentence makes a claim the evidence does not support.

### Phase 4 — Simple prospect result UI

- New `quick-findings.tsx` and `opportunity-panel.tsx`.
- Rewrite the prospect detail page around them; remove `QualificationPanel` from
  the page (the module stays).
- Simplify `audit-form.tsx` (add company name) and the prospects list (drop
  Score, Band, Decision).
- Simplify `audit-report.tsx` (drop the score section).
- Simplify `opportunity-controls.tsx` to single-select.

**Done when:** paste a URL → see findings, one opportunity, one service and a
reason, for a real business, end to end.

### Phase 5 — Simple outreach generation

- Add `outreach.ts` (pure) and its tests, including tests that assert the
  forbidden claims never appear.
- Add `outreach-email.tsx` with a copy button.
- Log generation to the audit log; never log the body; never send.

**Done when:** a generated email reads like something a person would actually
send, and no template path can produce a claim the scan did not evidence.

### Phase 6 — Prospect status tracking

- The nine-value lifecycle, `status-controls.tsx`, `setStatusAction`.
- Status filter on the list; sort by `updated_at`.
- Remove the import route, `import-form.tsx`, `queue-actions.tsx`, and the
  queue/drain server actions. Update the nav.

**Done when:** a prospect can be moved through the full lifecycle, and
suppression still behaves exactly as it does today.

### Phase 7 — Testing and cleanup

- Delete every module, component, route, script and test in
  [§10](#10-files-to-eventually-remove), each with a `grep -rn` check first.
- Trim the `AuditAction` union.
- Back up, then drop the dead columns and indexes.
- Update `docs/prospecting-engine.md` with the new architecture; keep the Phase
  1–3 history rather than rewriting it.
- Full verification: `typecheck`, `lint`, `test`, `build`, and one manual
  end-to-end pass on a real business.

**Done when:** the suite is green, `src/lib/prospecting/` is the simplified set,
and nothing references a removed symbol.

---

## Appendix — files inspected

**Source (33)** — all of `src/lib/prospecting/` (22), all of
`src/components/admin/prospecting/` (10), all five prospecting routes,
`src/db/schema.ts`, `src/db/index.ts`, `src/lib/auth/{capabilities,guard,audit}.ts`,
`src/lib/{retry,queries}.ts`, `src/components/admin/{shell,ui}.tsx`.

**Migrations (3)** — `0001_prospecting_audits.sql`, `0002_prospects.sql`,
`0003_prospect_qualification.sql`.

**Scripts (2)** — `drain-prospecting.mts`, `requalify-prospects.mts`, plus
`package.json`.

**Tests (22 files, 185 tests)** — surveyed; the full suite was run as a baseline
and passes in ~2.1s.

**Docs (5)** — `prospecting-engine.md`, `prospecting-engine-handoff.md`,
`prospecting-engine-phase1-report.md`, the Phase 3 design spec and the Phase 3
plan.

**Repository state** — branch topology against `main` and `origin/main`, worktree
layout, and the merge status of all 48 prospecting commits.
