# Prospecting Phase 3 — Prospect Qualification (design)

**Date:** 2026-09-17
**Status:** awaiting review
**Branch:** `prospecting-phase-3` — branched from `prospecting-phase-2`, with `main` merged in (`536eef6`), so it carries Phases 1–2 and everything production runs.
**Depends on:** Phase 1 (audit engine), Phase 2 (prospects, import, drain).
**Ships to production:** not by this work. Merging to `main` stays a separate decision.

## Objective

Turn an audited prospect into a **reviewed qualification**:

- a complete, evidence-backed 100-point score;
- a primary opportunity and optional secondaries;
- a score band with the spec's required action;
- a human decision — **Qualified** or **Dismissed**.

A score is a prioritisation aid and a recommendation. Only a reviewer qualifies a prospect.

## Approved decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Base | `prospecting-phase-2` with `main` merged in | Phase 3 is built and tested against the admin production actually runs. The eventual merge to `main` becomes a fast-forward. |
| Business fit (10) | Exact rules; a reviewer fills gaps | 5 for a target market, 5 for a target industry after normalising and a fixed synonym table. Anything unmatched scores 0 and says so. The spec forbids guessing from free text. |
| Decision-maker availability (10) | A public channel earns 5; a reviewer-confirmed role earns 5 more | Phase 2 stores only generic channels by design. A generic `info@` must never pretend to reach a decision-maker. |
| Reviewer decision | Qualified or Dismissed | Reversible and audited. Dismissed needs a reason, drops out of the default list, and cannot be queued. |
| Architecture | Recompute from stored inputs; reviewer inputs stored as state | Meets the spec's "recalculated from stored findings, not unexplained totals". A rule change fixes every prospect at once. |
| Prep | Drain CLI survives a cold database | Phase 3 depends on drained audits, and the CLI currently dies on its first read against a suspended Neon instance. |

---

## The qualification model

One pure module, `src/lib/prospecting/qualify.ts`, with no database or network imports, computes everything from three inputs:

1. **The latest usable audit** — its stored findings and technology indicators, taken from the prospect's most recent audit whose status is `completed` or `partial`. A failed audit is never used. The latest *usable* one is looked up directly rather than via `last_audit_id`, because Phase 2 deliberately leaves `last_audit_id` pointing at a failed run so its error stays readable.
2. **The prospect's own fields** — `country`, `industry`, `contact_channel`, `contact_provenance`.
3. **Reviewer inputs** — score adjustments and an opportunity override.

```ts
qualifyProspect(input: {
  audit: { id: number; findings: AuditFinding[]; technologyIndicators: TechnologyIndicator[] } | null;
  prospect: { country: string; industry: string; contactChannel: string; contactProvenance: string };
  adjustments: ScoreAdjustments;
  opportunityOverride: OpportunityOverride | null;
}): Qualification
```

`Qualification` carries, per component, its cap, automatic points, effective points, the evidence behind the automatic value, and any adjustment and whether it applied. It also carries the automatic and effective totals, the band, and the automatic and effective opportunities.

The detail page always renders this. The `prospects.total_score` and `prospects.primary_opportunity` columns stay what Phase 2 made them — snapshots for sorting and filtering the list — but they now hold the **effective** values and are refreshed on every path that can change them (see *Keeping the list honest*).

### Components

| Component | Cap | Source |
| --- | ---: | --- |
| Website / UX | 25 | Stored findings, via the existing per-rule points in `scoreReport` |
| SEO | 20 | Stored findings |
| Technical | 20 | Stored findings |
| Conversion | 15 | Stored findings |
| Business fit | 10 | Prospect fields, by rule |
| Decision-maker availability | 10 | Prospect fields, by rule |

With no usable audit, the four finding-based components score 0 with the evidence "no completed audit yet". Business fit and contact still score, because they don't depend on the website.

### Business fit (10)

**Target market — 5 points.** `country` is one of `AU`, `GB`, `UK`, `US`, `CA`. `UK` is accepted alongside `GB`: Phase 2 stores any two capital letters as typed, and `UK` is what people type. Evidence: *"AU — target market (Australia)"*. Anything else scores 0: an empty country gives *"no country recorded"*, any other code gives *"FR — not a target market"*.

**Target industry — 5 points.** The target industries are the ones in the project's `CLAUDE.md`: Accounting, Real estate, Recruitment, Consulting, Professional services, Construction, Healthcare, Education.

The industry text is normalised — trimmed, lower-cased, runs of whitespace collapsed, punctuation other than `&` removed — and then **matched exactly as a whole string** against a fixed synonym table:

| Canonical | Accepted exact values after normalising |
| --- | --- |
| Accounting | accounting, accountant, accountants, accountancy, bookkeeping, tax accounting |
| Real estate | real estate, property, property management, realty, estate agents, real estate agency |
| Recruitment | recruitment, recruiting, recruitment agency, staffing, employment agency |
| Consulting | consulting, consultancy, management consulting |
| Professional services | professional services |
| Construction | construction, builders, building contractors, civil construction |
| Healthcare | healthcare, health care, medical, medical practice, dental, allied health |
| Education | education, training, tutoring, schools, higher education |

There is **no substring or keyword matching**. "Rebuild Church Ministries" must never score as Construction. Evidence on a match: *"'Accountants' → Accounting"*. With no match: *"'Bookkeeping & tax' — industry not recognised"*, and the reviewer can award it with a reason. The table lives in code, so extending it is a one-line reviewed change.

### Decision-maker availability (10)

**A public channel — 5 points, automatic.** `contact_channel` is non-empty, `contact_provenance` is non-empty, and the channel still classifies as a role email, contact-page URL or phone number under Phase 2's `classifyContact`. Re-classifying at read time means a bad value that somehow reached the database earns nothing. Evidence: *"role email info@acme.com.au — website footer"*.

**A confirmed decision-making role — the other 5, reviewer only.** A reviewer who has seen a decision-making role **published by the company itself** raises the component with a reason naming the role and where it appears — *"Director listed on the About page"* — **never the person**. The adjustment form says so. Nothing infers a person's authority, and nothing stores a name as data.

### Reviewer adjustments

Any component can be set to a whole number from 0 to its cap, with a reason (1–300 characters).

```ts
type ScoreAdjustment = {
  points: number;
  reason: string;
  byUserId: number;
  byEmail: string;
  at: string;              // ISO timestamp
  auditId: number | null;  // set for the four finding-based components, null for fit and contact
};
type ScoreAdjustments = Partial<Record<ComponentKey, ScoreAdjustment>>;
```

- **The automatic value is always shown beside the adjusted one.** An adjustment never hides the evidence, e.g. *"Business fit 10 (automatic 5) — Industry is property management; target fit. Raymund, 17 Sept"*.
- **Adjustments to finding-based components are pinned to the audit they were made against.** After a newer audit they stop applying and show as stale: *"made against audit #14, now #19 — re-check"*. The findings they judged no longer exist.
- **Business-fit and contact adjustments are facts about the business**, not the website, so they survive re-audits.
- Clearing an adjustment returns the component to automatic.
- Setting and clearing are both written to `audit_logs`.

### Opportunities

**Primary, automatic.** The existing `classify` rules, applied to the **finding-based components only** — their effective values and their own sum, not the 100-point total. Business fit and contact say nothing about what the website needs; a well-matched business with a sound website must not be labelled as having an opportunity. Below the existing threshold it stays **Build Audit**, the honest answer when the evidence doesn't justify a prescription.

**Secondary, automatic and evidence-based.** Explicit thresholds, not "the primary's rule also holds": `classify`'s SEO rule requires SEO to outscore technical and UX, which would make it the primary, so reusing it would mean SEO could never be secondary.

| Secondary | Condition (effective finding-based points) | Evidence |
| --- | --- | --- |
| SEO | SEO ≥ 8 | the SEO points |
| Website Rebuild | Technical ≥ 14 and Website / UX ≥ 8 | both values |
| Website Improvement | Website / UX ≥ 8, or Conversion ≥ 8 | the qualifying value |
| E-commerce | the audit detected Shopify or WooCommerce | the detected signal |

The first three apply only when the finding-based sum is at least 10 — the same gate below which the primary is Build Audit — so a thin audit doesn't sprout secondaries. E-commerce applies whenever it's detected, since it's an observed platform fact, not a scoring inference. The primary is never repeated as a secondary.

**WooCommerce detection** is added to the audit (`analyze.ts`), following the existing Shopify pattern: the `generator` meta tag naming WooCommerce, or a `/wp-content/plugins/woocommerce/` asset, both high confidence. It applies to audits run from now on. Existing audits gain it when re-audited.

**Reviewer override.** A reviewer may set the primary and secondaries to **any** of the eight opportunities, with a reason. That is the only way to reach Automation, API / Integration, or Custom Software — a homepage cannot evidence them. The automatic opportunities stay visible beside the override, and clearing the override restores them.

```ts
type OpportunityOverride = {
  primary: Opportunity;
  secondary: Opportunity[];  // distinct, excludes primary
  reason: string;
  byUserId: number;
  byEmail: string;
  at: string;
};
```

### Bands

On the **effective** total, with the spec's wording:

| Score | Meaning | Required action |
| --- | --- | --- |
| 75–100 | Strong observed opportunity and fit | Human review before any draft is created. |
| 50–74 | Potentially relevant but needs judgment | Review the evidence and improve or dismiss the audit. |
| 25–49 | Limited or incomplete evidence | Keep only if useful for future research; do not prioritize outreach. |
| 0–24 | Insufficient evidence or poor fit | Do not create outreach. |

### The reviewer's decision

- **Qualified** — reason optional (up to 300 characters). This is the shortlist the later outreach phase draws from.
- **Dismissed** — reason required (1–300 characters). The prospect leaves the default list and can no longer be queued.
- **Clear decision** — back to undecided; clears the reason, `decided_by` and `decided_at`.

"Can no longer be queued" is enforced in `enqueueProspects` itself, not only by hiding a button: its SELECT and its status UPDATE both require `decision <> 'dismissed'`, mirroring the `suppressed_at IS NULL` guard Phase 2 added to the same two statements. A direct call to the action therefore cannot queue a dismissed prospect.

All three are reversible and written to `audit_logs`.

**The decision is its own column, not a value of `status`.** `status` (`new` / `queued` / `audited`) is written by the pipeline — the drain's `applyResult` sets it after every audit. Phase 2's worst defect was exactly that: the drain overwrote a human decision (suppression) held in `status`. Suppression was fixed by making `suppressed_at` the source of truth; the decision follows the same principle from the start. Suppression stays separate: it is the business's opt-out, while dismissal is ForgeLine's judgement.

`prospect.dismiss` returns to the `AuditAction` union — Phase 2 cut it because it was unreachable — alongside `prospect.qualify`, `prospect.decision.clear`, `prospect.score.adjust`, `prospect.score.clear`, `prospect.opportunity.set` and `prospect.opportunity.clear`.

---

## Storage

One additive, idempotent migration, `drizzle/0003_prospect_qualification.sql`. It only adds columns to `prospects`, alters or drops nothing, and leaves every existing row valid:

| Column | Type | Default |
| --- | --- | --- |
| `score_adjustments` | jsonb NOT NULL | `'{}'` |
| `opportunity_override` | jsonb NULL | — |
| `decision` | varchar(16) NOT NULL | `''` (`''`, `qualified`, `dismissed`) |
| `decision_reason` | text NOT NULL | `''` |
| `decided_by` | integer NULL → `users(id)` ON DELETE SET NULL | — |
| `decided_at` | timestamptz NULL | — |

Plus an index on `decision`. The Drizzle schema is updated to match.

**Applying it to the production database needs the owner's explicit go-ahead**, as with Phase 2's migration. Implementation verifies against the schema and pure tests first.

## Keeping the list honest

`prospects.total_score` and `prospects.primary_opportunity` hold the effective values. A single helper, `refreshQualificationSnapshot(prospectId)`, loads the inputs, runs `qualifyProspect`, and writes the two columns. It is called:

- after an audit is applied (the drain's `applyResult`),
- after a score adjustment is set or cleared,
- after an opportunity override is set or cleared,
- after a re-import changes a prospect's country, industry or contact.

The last path is why the helper exists at all: the Phase 2 upsert is one SQL statement and cannot recompute. After it, the helper runs for each updated prospect — and suppressed prospects are skipped, since the upsert never touches them. A snapshot write never touches `status`, `suppressed_at` or the decision columns.

The detail page never reads the snapshot for the breakdown. It always recomputes.

## Admin UI

**`/admin/prospecting/prospects/[id]` — a Qualification panel:**

- the band, with its meaning and required action;
- a component table: cap, automatic points and evidence, effective points, any adjustment (value, reason, who, when, stale flag), and Adjust / Clear controls;
- opportunities, automatic and overridden, with Set / Clear;
- the decision, with Qualify / Dismiss (reason required) / Clear.

**`/admin/prospecting/prospects` — the list:**

- **Band** and **Decision** columns;
- decision and band filters;
- dismissed prospects hidden unless filtered for explicitly;
- "Queue all new" skips dismissed prospects.

Every new action authorises `prospecting.manage`, validates its reason and bounds **on the server** (Phase 2's review found a client-only check), writes `audit_logs`, and revalidates both the list and detail paths.

## Drain CLI cold-start fix

On a suspended Neon instance, the drain's first read fails with `UND_ERR_CONNECT_TIMEOUT` and the CLI prints a raw stack trace. Every run so far has succeeded on immediate retry.

- `withRetry` and its transient-error test move out of `src/lib/queries.ts` into an import-free `src/lib/retry.ts`, which `queries.ts` re-exports. It has to move: `queries.ts` is `server-only`, which a plain-Node CLI cannot import — the same trap that split `merge.ts` from the media library.
- The drain's **reads** — the queued-audit list, the claim's select, and `applyResult`'s suppression read — are wrapped in `withRetry`. Writes are not retried. The claim is a compare-and-swap, and retrying a write whose first attempt may already have committed would turn one audit into a lost claim.
- If the CLI still fails after retries, it prints one readable line naming the cause, not a stack trace.

## Testing

Pure and table-driven. No database, no network.

- **Business fit:** every target market (including `UK` and `GB`), a non-target country, an empty country; every canonical industry and every synonym; case, whitespace and punctuation variants; near-misses that must not match ("Rebuild Church Ministries", "Accounting software"); an empty industry.
- **Decision-maker:** channel with provenance; missing provenance; a stored value that no longer classifies; an empty channel.
- **Adjustments:** within cap; over cap and negative rejected; non-integer rejected; empty and over-long reasons rejected; a finding-based adjustment applying on its own audit and going stale after a newer one; fit and contact adjustments persisting across audits; clearing.
- **Opportunities:** primary from the finding-based components only (a high-fit, sound-website prospect stays Build Audit); each secondary threshold at and just below its boundary; no finding-based secondaries below the 10-point gate while E-commerce still appears; the primary never repeated as a secondary; E-commerce from Shopify and from WooCommerce; an override replacing the automatic set; override validation (known opportunities, distinct, primary not repeated, reason required).
- **Decision:** dismissal without a reason rejected; qualification without a reason accepted; over-long reasons rejected; clearing resets reason and attribution. The enqueue guard's SQL is checked with `.toSQL()` for `decision <> 'dismissed'` on both statements.
- **Bands:** every boundary — 24/25, 49/50, 74/75 — plus 0 and 100.
- **No usable audit:** finding components 0 with evidence; fit and contact still scored.
- **WooCommerce detection** in the analyzer: the generator tag, the plugin asset path, and a plain WordPress site that must not match.
- **Retry:** a transient error retried, a non-transient one thrown at once, retries bounded.

Route handlers, server actions and UI are verified by typecheck, lint and build, plus reasoning recorded in each task report, as with the rest of this admin.

## Out of scope

AI analysis (Phase 4), outreach drafts, automated discovery sources, bulk decision actions, a per-prospect history view of `audit_logs`, and merging to `main`.

## Risks

| Risk | Handling |
| --- | --- |
| The synonym table is too narrow for real CSVs | Unmatched industries score 0 visibly and a reviewer awards them. Adding a synonym is a one-line reviewed change. |
| Automated scores read as decisions | The band is labelled a recommendation, and only an explicit reviewer action sets Qualified. |
| A finding adjustment silently outlives the evidence it judged | Pinned to its audit; stale adjustments stop applying and are shown. |
| The pipeline overwrites a human decision | Decision in its own columns; snapshot writes never touch it. |
| Personal data entering through a reason field | The role-confirmation form asks for the role and where it is published, never a name. Reasons are capped at 300 characters. |
| List and detail disagree | The detail page always recomputes; the snapshot is refreshed on every mutating path. |
| Migration 0003 on production | Applied only with the owner's explicit go-ahead. |
