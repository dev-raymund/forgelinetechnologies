# Prospecting

An internal tool for deciding whether there is a reason to contact a business,
and for tracking that conversation. It is a prospect tracker, not a CRM.

```text
Website URL
    ↓
Quick Scan          one bounded fetch, deterministic analysis
    ↓
Opportunity         one opportunity, one service, one reason
    ↓
Prospect            saved, deduplicated by domain
    ↓
Outreach            a short email you review and send yourself
    ↓
Pipeline            nine statuses, moved only by you
    ↓
Full audit          when a prospect is interested
```

No AI. No email sending. No scoring. No scheduled follow-ups. The tool works
with no API key and no subscription.

## The screens

| Route | What it does |
|---|---|
| `/admin/prospecting/audit` | Paste a URL, scan it, read the opportunity, save the prospect |
| `/admin/prospecting/prospects` | The pipeline: company, website, opportunity, service, status, updated |
| `/admin/prospecting/prospects/[id]` | One prospect: business, contact, opportunity, outreach, pipeline, suppression, history |
| `/admin/prospecting/audits/[id]` | A stored website report |

All four require `prospecting.manage`, which only the `admin` role holds. Every
server action re-checks it — a guard on a page is not a guard on an action.

## Quick scan

**One request.** The homepage, nothing else. It never fetches `/robots.txt`,
`/sitemap.xml` or any internal page, and it never crawls.

```text
normalizeDomain → websiteUrlForDomain → normalizeAuditUrl (SSRF guard)
                → fetchBoundedPage (3MB cap, 10s timeout, 5 redirects, re-checked each hop)
                → analyzePage (≈25 deterministic checks)
                → QuickScanResult
```

A full audit is the same fetch and the same analysis **plus** robots.txt,
sitemap.xml and up to twelve link probes. Select it with `mode`:

```ts
runAuditJob({ auditId, requestedUrl, mode: "quick" });  // 1 request
runAuditJob({ auditId, requestedUrl, mode: "full"  });  // up to 15
```

`mode` defaults to `full`. The prospecting screens always pass `"quick"`.

## Opportunity

An ordered list of rules, first match wins, at most one opportunity and at most
one service. No score, no band, no confidence. Full detail, including every
rule's evidence and why each threshold is what it is:
[`prospecting-opportunity-rules.md`](prospecting-opportunity-rules.md).

| Opportunity | Service | Chosen by |
|---|---|---|
| SEO | SEO | rules or a person |
| Website Development | Business websites | rules or a person |
| E-commerce | E-commerce | rules or a person |
| Automation | Business automation | **a person only** |
| Web Application | Custom web applications | **a person only** |
| Integration | API integrations | **a person only** |
| No Clear Opportunity | — | rules |
| Needs Manual Review | — | rules |

The last three services exist for when a person selects them; no rule can
produce those opportunities, because one homepage fetch cannot evidence a
manual back-office process or a system worth integrating.

`opportunity_set_by` records who decided: `null` for the rules, a user id for a
person. A re-scan **will not overwrite a person's choice** unless they ask for
it to be replaced.

## Outreach

`generateOutreach` is a pure deterministic template. Same input, same output;
no randomness, no timestamps, no AI.

It refuses to write anything for **No Clear Opportunity**, **Needs Manual
Review**, or an opportunity with no observation behind it — inventing a reason
to contact someone is the one thing the tool must not do.

Every sentence about the business restates something the scan observed.
Nothing infers traffic, rankings, revenue, customers, size or history, and
nothing manufactures familiarity. The draft is generated on demand, never
stored, and **never sent** — you copy it and send it yourself.

## Pipeline

```text
To Contact → Email Sent → Interested → Audit Requested → Call → Proposal → Won
                                                              ↘ Lost
                                                              ↘ Not a Fit
```

Any status can move to any other — people correct mistakes. Nothing moves a
status automatically: generating a draft, copying an email and opening a
prospect all leave it alone.

**Not a Fit is not suppression.** "Not a Fit" is your judgement about a
business. `suppressed_at` is the business asking not to be contacted — an
operational and legal state with its own columns, never folded into `status`.

## Data

`prospects` — one row per business, unique by normalized domain.
`prospect_audits` and `audit_findings` — the stored reports and their
observations. Some are historical full audits from an earlier implementation;
they are kept as history and are not reinterpreted.

Contact details are a **role or company address and a phone number**. The
system deliberately does not store a named individual's contact details:
that is personal data under UK GDPR and the Australian Privacy Act, and both
are target markets. `classifyContact` refuses one on every write.

## Modules

| File | Role |
|---|---|
| `url-safety.ts` | SSRF guard: private-range detection for IPv4 and IPv6, re-checked per redirect |
| `fetch.ts` | Bounded fetching: size cap, timeout, redirect limit, content-type allowlist |
| `analyze.ts` | The deterministic checks. No I/O |
| `runner.ts` | Orchestration, and the one quick/full branch |
| `quick-scan.ts` | The result model. Pure |
| `findings-summary.ts` | Observations as short factual sentences. Pure |
| `opportunity.ts` | The rules. Pure |
| `outreach.ts` | The email template. Pure |
| `scan-view.ts` | What the scan screen renders. Pure |
| `prospect-store.ts` | Prospect reads and writes |
| `prospect-input.ts` | Server-side validation for every write. Pure |
| `actions.ts` | The server actions, each with its own capability check |
| `audit.ts`, `run.ts`, `admin.ts`, `outcome.ts` | Audit lifecycle and persistence |
| `domain.ts`, `contact.ts`, `targets.ts`, `types.ts` | Shared vocabulary and safety |

## History

This replaced a 100-point qualification model with score components, bands,
reviewer adjustments, opportunity overrides, qualification decisions, a bulk
CSV import and an audit queue. All of it is gone.

That architecture and the reasoning for retiring it are recorded in
[`prospecting-simplification-audit.md`](prospecting-simplification-audit.md),
which is **a historical document**: it describes the system as it was in
September 2026 and the plan that replaced it, not the system as it is now.
