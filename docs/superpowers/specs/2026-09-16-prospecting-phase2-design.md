# Prospecting Engine Phase 2 — Prospect Discovery (design)

**Date:** 2026-09-16
**Status:** awaiting review
**Depends on:** Phase 1 (complete, verified end-to-end 2026-09-16)
**Blocks:** Phase 3 — Prospect Qualification

## Objective

Turn a list of businesses into ranked, evidence-backed prospects: import them,
deduplicate them by domain, audit them in the background with the Phase 1
engine, and present them to a reviewer ordered by observed opportunity.

Discovery produces candidates. It never contacts anyone.

## Approved decisions

| Decision | Choice | Why |
| --- | --- | --- |
| First source | CSV / manual import | Zero API cost and zero terms risk; proves the import → audit → ranking pipeline before paying for data. The source layer stays pluggable so an adapter can follow. |
| Batch audits | Drained queue, driven locally | Self-throttling, survives process death, spreads load politely across target sites. Driven by a local CLI rather than Vercel Cron — see below. |
| Duplicates | Normalized domain unique, update in place | Re-importing a list is idempotent, so the same business can never be worked or contacted twice. |
| Contact data | Generic business channels only | `info@`, a contact-page URL or a switchboard number, each with provenance. Named individuals are rejected at import, keeping the table out of most personal-data obligations. |

## Architecture

### Data model

One additive migration, `drizzle/0002_prospects.sql`. It creates one table and
adds one nullable column. It alters no existing column and drops nothing.

#### `prospects`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | serial PK | |
| `company_name` | text NOT NULL | As supplied by the source. |
| `domain` | varchar(253) NOT NULL **UNIQUE** | Normalized: lowercase, no scheme, no `www.`, no port, no path. The deduplication key. |
| `website_url` | text NOT NULL | The URL handed to the audit engine. |
| `industry` | varchar(80) NOT NULL DEFAULT `''` | |
| `country` | varchar(2) NOT NULL DEFAULT `''` | ISO-3166-1 alpha-2. |
| `location` | text NOT NULL DEFAULT `''` | |
| `contact_channel` | text NOT NULL DEFAULT `''` | Role-based email, contact-page URL, or switchboard number. |
| `contact_provenance` | text NOT NULL DEFAULT `''` | Required whenever `contact_channel` is set. |
| `sources` | jsonb NOT NULL DEFAULT `[]` | Append-only `[{name, url, importedAt, importedBy}]`. |
| `status` | varchar(16) NOT NULL DEFAULT `'new'` | `new` → `queued` → `audited`; plus `dismissed`, `suppressed`. |
| `suppressed_at` | timestamptz NULL | Set by opt-out. |
| `suppression_reason` | text NOT NULL DEFAULT `''` | |
| `last_audit_id` | integer NULL → `prospect_audits(id)` ON DELETE SET NULL | |
| `last_audited_at` | timestamptz NULL | |
| `total_score` | integer NOT NULL DEFAULT 0 | Snapshot of the latest audit, for sorting. |
| `primary_opportunity` | varchar(32) NOT NULL DEFAULT `''` | Snapshot, for filtering. |
| `created_by` | integer NULL → `users(id)` ON DELETE SET NULL | |
| `created_at` / `updated_at` | timestamptz NOT NULL DEFAULT now() | |

Indexes: unique on `domain`; plus `status`, `total_score DESC`, `country`,
`industry`.

`total_score` and `primary_opportunity` are denormalized snapshots for list
sorting and filtering. Phase 2 does not recompute them: the prospect list and
detail page render these columns, and a score stays explainable through the
Phase 1 audit report, which shows the per-category scores and the findings
behind them. Recomputing a prospect's score from `audit_findings` is deferred
to Phase 3 (Prospect Qualification), which rebuilds this surface.

#### `prospect_audits` — one added column

`prospect_id integer NULL REFERENCES prospects(id) ON DELETE SET NULL`, plus an
index. Nullable because Phase 1 manual single-URL audits have no prospect, and
the ten existing rows must stay valid.

#### No `prospect_events` table

The Phase 0 plan lists one, but it also says to keep using `audit_logs` for
authenticated admin mutations and to add a prospect event model "only when event
detail requires its own bounded model." Provenance lives in `sources`; actions
go to `audit_logs` via new `AuditAction` values: `prospect.import`,
`prospect.queue`, `prospect.suppress`, `prospect.unsuppress`, `prospect.dismiss`.

Revisit when outreach drafts need a per-prospect timeline.

### Import pipeline

Three pure modules, no I/O, unit-tested in isolation — the Phase 1 pattern.

**`src/lib/prospecting/csv.ts`** — `parseProspectCsv(text)` returning
`{ rows, errors }`. A small RFC-4180 parser handling quoted fields, embedded
commas and newlines, CRLF and a leading BOM. No new dependency.

- Required headers: `company`, `website`.
- Optional: `industry`, `country`, `location`, `contact`, `contact_source`.
- A malformed row never aborts the file; it is reported with its line number.
- Caps: 2,000 rows, 1 MB.

**`src/lib/prospecting/domain.ts`** — `normalizeDomain(input)`, purely
syntactic. Lowercases, strips scheme, `www.`, port, path and credentials;
rejects IP literals and non-HTTP(S) schemes.

Deliberately no DNS at import: a 2,000-row file would mean 2,000 lookups, and
the SSRF guarantee already lives where it belongs — `assertSafeUrl` runs inside
`fetchBoundedPage` on every fetch and every redirect. A domain that resolves
somewhere private is caught at audit time, not import time.

**`src/lib/prospecting/contact.ts`** — `classifyContact(value)` returning a
role-based email, a URL, a phone number, or a rejection with a reason.

Accepted local parts: `info`, `hello`, `contact`, `enquiries`, `enquiry`,
`sales`, `admin`, `office`, `support`, `team`, `mail`. Anything resembling a
personal mailbox is rejected: *"Named-individual contacts are not accepted; use
a public business channel."* `contact_source` is required whenever `contact` is
present.

### Upsert

`upsertProspects(rows, actor)` — `INSERT ... ON CONFLICT (domain) DO UPDATE`,
chunked.

- Refreshes company, industry, country, location, website URL.
- Appends to `sources`.
- Never overwrites `status`, `suppressed_at`, `suppression_reason`, scores,
  audit links or `created_by`.
- **A suppressed prospect is never revived by a re-import.** This is the opt-out
  guarantee and it is enforced in SQL, not in application logic.

Returns `{ inserted, updated, skippedSuppressed }`.

### Queue and drain

Enqueueing a prospect creates a `prospect_audits` row at `queued` with
`prospect_id` set, and moves the prospect to `queued`.

`drainAuditQueue({ budgetMs, limit })`:

1. Select candidate `queued` audit ids, oldest first.
2. For each, attempt `saveAuditRunning(id)`. This is the existing
   compare-and-swap in `transitionAudit` — it updates
   `WHERE id = ? AND status = <status it read>` and throws when zero rows come
   back. A throw means another worker claimed it; skip and continue.
3. Run the claimed audit through the existing `runAuditJob` and production
   dependencies. Nothing in the Phase 1 engine changes.
4. Write back `total_score`, `primary_opportunity`, `last_audit_id`,
   `last_audited_at`, and move the prospect to `audited`.
5. Stop when the time budget is nearly spent.

A failing audit is isolated: it marks its own row failed and the drain moves on.

**A failed audit returns its prospect to `new`, not `audited`.** The prospect
keeps `last_audit_id` pointing at the failed run so a reviewer can read the
error, but it becomes eligible for queueing again rather than sitting in a state
that claims it was audited. `completed` and `partial` both count as audited —
`partial` is a real result with findings, not a failure.

**"Queue all new" queues only `status = 'new'`.** Suppressed and dismissed
prospects are never queued, and an already-`queued` prospect is not queued
twice.

`drainAuditQueue` is one tested function with two callers. There is no cron
route, no `vercel.json`, and no `CRON_SECRET`.

**Why:** this project is on Vercel's Hobby plan, where scheduled cron does not
run often enough to drain a queue of any size. Rather than build a scheduled
endpoint that cannot do its job — and secure a new public route to host it —
the drain is driven by the two callers that actually work on any plan:

| Caller | Budget | Use |
| --- | --- | --- |
| `npm run prospecting:drain` | unbounded, polite delay between audits | The primary path. Runs on your machine against the production database, so no serverless time limit applies at all. Import a list, start it, let it work through 200 prospects unattended. Accepts `--limit`. |
| **Run queue now** button | 45s budget, 5 audits | Convenience. Drains one batch from the admin without a terminal. |

A local script fits the repo's existing shape — `scripts/create-admin.mts` and
`scripts/seed-works.mts` already run this way through `tsx` with `--env-file`.

If the project later moves to Pro, adding a scheduled route is a third caller of
the same function and changes nothing else in this design.

The drain also repairs a Phase 1 gap: an audit whose `after()` died still sits
at `queued`, so a later drain picks it up.

### Admin UI

| Route | Purpose |
| --- | --- |
| `/admin/prospecting/import` | Paste or upload CSV. Parsed preview with per-row errors **before** anything is written, then "Import N prospects". |
| `/admin/prospecting/prospects` | List sorted by score descending. Filters: status, opportunity, country, industry. Actions: "Queue all new", "Run queue now". |
| `/admin/prospecting/prospects/[id]` | Fields, provenance, audit history, link to the Phase 1 report, and opt-out with a reason. |

Navigation replaces the single "Prospecting audit" link with a "Prospecting"
group. Access stays on the existing `prospecting.manage` capability.

### Testing

Every pure module is unit-tested with injected dependencies. No test touches
Neon or the network.

- **CSV parser** — quoted fields, embedded commas and newlines, CRLF, BOM,
  missing headers, row and size caps, per-row error reporting.
- **normalizeDomain** — scheme, `www.`, port, path, case, credentials, IP
  literals, trailing dots.
- **classifyContact** — role vs named mailbox, URL, phone, missing provenance.
- **upsert** — insert, update-in-place, suppressed row not revived, `sources`
  appended rather than replaced.
- **drain** — two drains contending for one audit and exactly one running it,
  budget exhaustion stopping cleanly, one failure not stopping the batch.

## Out of scope

Outreach drafts, AI analysis, automated discovery sources,
`/admin/prospecting/settings`, and the overview dashboard. Phase 3
qualification follows this work and unlocks the business-fit and
decision-maker-availability components that currently cap every audit at 80.

## Risks

| Risk | Handling |
| --- | --- |
| Hobby plan cron cannot drain a queue | No cron. The drain runs from a local CLI with no time limit, plus a one-batch button in the admin. |
| Auditing 200 strangers' sites | Existing per-fetch bounds (10s, 1 MB, 5 redirects, 12 links), a small per-drain limit, and a delay between audits in the CLI keep request rates low. |
| Bad CSV silently importing garbage | Preview-before-commit; per-row errors with line numbers; nothing written until confirmed. |
| Personal data arriving anyway | Rejected at parse time with a specific message, before any write. |
| Re-import reviving an opted-out business | Enforced in the upsert's SQL, and covered by a test. |
