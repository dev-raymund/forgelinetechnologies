# Forgeline Prospecting Engine

## Objective

Create an internal, evidence-led system that supports this flow:

```text
Prospect Discovery
  → Website Audit
  → Opportunity Detection
  → Lead Scoring
  → Prospect Management
  → Outreach Draft
  → Human Approval
  → Outreach
```

The first version must **not** send cold outreach automatically. A person must review, edit where necessary, and approve every message before it can be sent outside the system.

The engine is a decision-support tool for ForgeLine, not a system for making unsupported claims about other businesses. Its value comes from accurately observed website signals and clear, commercially useful recommendations.

## Scope and non-goals

This document describes the intended future system. It does not authorise implementation in Phase 0.

Phase 0 must not:

- change the public site or existing admin behaviour;
- add a database migration or alter production data;
- build a crawler, scraper, discovery source, audit worker, or outreach sender;
- send email, create a mailing list, or automate LinkedIn activity;
- infer private data, revenue, conversion performance, internal processes, company size, or decision-maker identity.

## Design principles

1. **Observed fact before recommendation.** Every finding needs evidence: the checked URL, time, check name, raw or normalized result, and a stable finding identifier.
2. **No claim inflation.** A missing CTA can support “potential conversion improvement opportunity”; it cannot support “the business is losing customers.”
3. **Human judgment at external boundaries.** People decide whether a prospect is qualified, whether the finding is useful, and whether any outreach is appropriate.
4. **Separate inbound and outbound concepts.** Existing `inquiries` are people who contacted ForgeLine. Future `prospects` are research records about potential outbound targets. They must not be merged.
5. **Minimal, lawful collection.** Keep only business information that is publicly available and necessary for the workflow. Respect applicable law, source terms, robots guidance where relevant, and opt-out requests.
6. **Deterministic checks before AI.** Technical tests create the evidence. AI summarizes and drafts from selected evidence; it does not discover facts by invention.
7. **Long work is asynchronous.** A full multi-page audit must never hold open a normal Next.js request.

## Evidence model

Every future finding should retain a record shaped like this conceptually:

| Field | Purpose |
| --- | --- |
| `findingId` | Stable identifier used by scores, reports, AI citations, and review screens. |
| `auditId` | The audit run that produced the finding. |
| `category` | Technical, SEO, accessibility, mobile, conversion, links, metadata, or image. |
| `rule` | The deterministic check performed, such as `missing-meta-description`. |
| `severity` | Informational, low, medium, or high; this is technical priority, not business impact. |
| `observedAt` | Timestamp of the fetch or measurement. |
| `pageUrl` | Exact inspected URL after redirects. |
| `evidence` | Relevant response data, extracted elements, metric, screenshot reference, or link result. |
| `recommendation` | Carefully worded action that follows from the evidence. |
| `confidence` | Confidence in the observation, not an assertion of commercial outcome. |

Evidence should make a reviewer able to answer: “What did we see, where did we see it, and why did this recommendation follow?”

## Phased roadmap

### Phase 1 — Website Audit Engine

The first implementation after Phase 0 is a **manual single-URL audit**. An authenticated user enters a URL; the system produces a structured audit for review. Prospect discovery must wait until this engine is reliable.

**Input**

- One user-entered HTTP or HTTPS URL, for example `https://example.com`.
- An explicit audit request from an authorised admin.

**Output**

- HTTP status, redirect chain, final URL, and HTTPS availability;
- technology indicators, clearly labelled as detected signals rather than certainty;
- performance indicators and their measurement source;
- mobile and responsive-layout observations;
- SEO checks: title, meta description, headings, indexability indicators, metadata, sitemap, robots, canonical URLs, and structured data;
- accessibility checks: high-signal automated issues, with automated results clearly distinguished from a full accessibility audit;
- conversion observations, limited to visible and reproducible interface signals;
- broken internal and selected external links, with scope and timeout recorded;
- image analysis: missing alt text, dimensions where available, format, oversized assets, and loading indicators;
- a classified opportunity and evidence-based score;
- a durable structured audit report, including all findings and any failed checks.

**Phase 1 safeguards**

- Validate URLs and permit only `http:` and `https:`.
- Block loopback, private, link-local, and otherwise unsafe network targets to prevent server-side request forgery.
- Apply strict per-page, total-page, payload-size, redirect, and elapsed-time limits.
- Record a partial audit as partial; never turn a failed or blocked check into a negative finding.
- Do not claim legal accessibility conformance, search rankings, revenue impact, or actual conversion performance.

The initial admin route should be `/admin/prospecting/audit`. It is a test bench for the engine, not a discovery tool.

### Phase 2 — Prospect Discovery

Discovery accepts:

- country;
- industry;
- location;
- optional keywords.

It can return, where lawfully and publicly available:

- company name;
- website and normalized domain;
- industry and location;
- public business contact channel, if relevant and permitted;
- source and source URL;
- the website URL selected for audit.

Do not build this phase until Phase 1 results are accurate and useful to a human reviewer.

Possible future sources to evaluate individually before use include search-engine results, Google Business Profiles/Maps where their terms permit it, industry directories, company-owned websites, public chambers or registries, and manually curated agency/referral lists. Each source needs a documented legal/terms review, rate limit, provenance field, and opt-out path. The engine must not scrape private, gated, or personally sensitive information.

### Phase 3 — Prospect Qualification

Use selected audit findings to classify one primary opportunity and optional secondary opportunities:

- Website Improvement
- Website Rebuild
- SEO
- Automation
- E-commerce
- API / Integration
- Custom Software
- Build Audit

“Build Audit” is the appropriate result where observable signals indicate a meaningful issue but there is not enough evidence to responsibly prescribe a specific solution.

Qualification is a recommendation to a reviewer, not an automatic decision to contact someone.

**Status:** built on the `prospecting-phase-3` branch. Not in production until merged and migration 0003 is applied. Design: [`docs/superpowers/specs/2026-09-17-prospecting-phase3-design.md`](superpowers/specs/2026-09-17-prospecting-phase3-design.md).

How it works:

- **Score (100).** Website / UX 25, SEO 20, Technical 20 and Conversion 15 come from the latest completed or partial audit's stored findings. Business fit 10 is 5 for a target market (AU, GB/UK, US, CA) and 5 for a target industry matched exactly against a fixed synonym table in `src/lib/prospecting/fit.ts`. Decision-maker availability 10 is 5 for a public business channel with recorded provenance; the other 5 only a reviewer can award, for a decision-making role the company publishes. The reviewer names the role, never the person.
- **Adjustments.** A reviewer can set any component from 0 to its cap, with a reason. The automatic value stays visible. Adjustments to the four website components are pinned to the audit they judged and stop applying after a newer audit.
- **Opportunities.** The primary comes from the website components only. Secondaries use explicit thresholds, and E-commerce appears when Shopify or WooCommerce is detected. A reviewer override is the only route to Automation, API / Integration or Custom Software.
- **Bands.** 75–100 human review before any draft; 50–74 review the evidence; 25–49 do not prioritise outreach; 0–24 do not create outreach.
- **Decision.** Qualified (reason optional) or Dismissed (reason required), both reversible and written to the audit log. A dismissed prospect is hidden from the default list and cannot be queued. A suppressed prospect cannot be qualified.
- **List snapshot.** `prospects.total_score` and `primary_opportunity` hold the effective values and are refreshed after every audit, adjustment, override and re-import that changes fit or contact. After applying migration 0003, or after changing a scoring rule, run `npm run prospecting:requalify` once.

### Phase 4 — AI Analysis

**Input:** a completed structured audit and the subset of findings selected for analysis.

**Output:**

- concise summary;
- strongest observed problems;
- primary and secondary opportunity;
- cited supporting evidence using `findingId` values;
- confidence level and explicit limitations;
- suggested outreach angle.

The model must be constrained to the supplied audit data. It must never invent a problem, a result, a technology, a person, a business process, or a commercial loss.

For example:

> Observed: no visible primary CTA was detected in the first rendered viewport of the homepage. Potential implication: there may be an opportunity to make the next step clearer for visitors.

Not:

> Your business is losing customers because the CTA is missing.

If evidence is weak, contradictory, unavailable, or ambiguous, the output must say so and recommend human review instead of making a claim.

## Opportunity and score model

The proposed score is a 100-point prioritisation aid. It ranks the clarity and relevance of observed opportunity; it does not estimate revenue, urgency, company quality, or likelihood of purchase.

| Area | Maximum | Evidence-based calculation |
| --- | ---: | --- |
| Website / UX opportunity | 25 | Aggregate reproducible issues such as mobile layout failures, unreadable controls, navigation friction, forms that visibly fail validation flow, or missing/unclear primary next steps. Award only for named findings; cap duplicate instances of the same rule. |
| SEO opportunity | 20 | Score observed technical SEO signals: missing or duplicate titles/descriptions, indexability conflicts, missing canonical tags, broken internal links, invalid or absent sitemap/robots signals, heading-structure issues, and structured-data errors. No score for assumed ranking position. |
| Technical opportunity | 20 | Score HTTPS, status/redirect problems, failed essential resources, high-signal performance indicators, outdated or risky detectable patterns where confidence is high, broken links, and severe image delivery issues. Do not treat uncertain technology detection as a defect. |
| Conversion opportunity | 15 | Score directly visible calls-to-action, contact paths, form clarity, mobile usability, and relevant trust or service information. This measures observed interface opportunity only, never conversion loss. |
| Business fit | 10 | Score public evidence that the business is in ForgeLine’s target geography/industry and has a website, web application, e-commerce, automation, or integration need compatible with its stated services. Missing information scores zero; it must not be guessed. |
| Decision-maker availability | 10 | Score only a public, appropriate business contact path or named role published by the company, plus clear provenance. Do not enrich from private sources or infer a person’s authority. |
| **Total** | **100** | Sum the six bounded components, retaining component evidence and explanation. |

Suggested interpretation:

| Score | Meaning | Required action |
| --- | --- | --- |
| 75–100 | Strong observed opportunity and fit | Human review before any draft is created. |
| 50–74 | Potentially relevant but needs judgment | Review the evidence and improve or dismiss the audit. |
| 25–49 | Limited or incomplete evidence | Keep only if useful for future research; do not prioritize outreach. |
| 0–24 | Insufficient evidence or poor fit | Do not create outreach. |

Scores must be recalculated from stored findings, not written as unexplained totals. A reviewer must be able to adjust an individual component with a reason and preserve an audit event.

## Automation boundaries

### Safe to automate with limits and logging

- website fetching and bounded crawling;
- deterministic technical, SEO, performance, metadata, sitemap, robots, canonical, structured-data, image, and link checks;
- technology indicators;
- finding normalisation, scoring, categorisation, and report generation;
- outreach-draft generation from explicitly selected findings;
- cache lookup and duplicate-domain prevention.

### Require human review

- final prospect qualification;
- any claim about a company’s internal process, business results, revenue, conversion, customer behaviour, or staffing;
- the practical usefulness of a detected issue;
- whether a prospect should receive outreach;
- all edits and approval of an outreach draft;
- importing contacts from a source or acting on an opt-out;
- any actual email or direct message sending.

### Never automate in the first version

- cold-email sending;
- mass outreach;
- scraping private, gated, or sensitive data;
- impersonation, account creation, or automated social engagement;
- claims that cannot be traced to stored observations.

## Database plan

Do not create a migration in Phase 0. The following is the proposed boundary for a future, separately reviewed migration.

### `prospects`

One record for a researched organisation/domain, not an inbound enquiry.

Key fields: ID, company name, normalized domain and website URL, country/region/location, industry, source name and URL, public business contact channel with provenance, lifecycle status, primary opportunity, component/total score snapshot, last-audited timestamp, opt-out/suppression state, created/updated timestamps.

Use a uniqueness rule around normalized domain (and possibly source-specific identity) after deciding the desired duplicate-handling policy. Store only minimal contact information required for review.

### `prospect_audits`

An immutable or append-oriented record of an audit run. A prospect can have many audits over time; manual Phase 1 audit runs may initially have no prospect.

Key fields: ID, optional prospect ID, requested URL, final URL, status, audit version, started/completed timestamps, crawl limits used, HTTP/HTTPS summary, structured report JSON, component scores, total score, error/partial-run details, and cache key/expiry.

### `audit_findings`

The evidence-level records produced by an audit.

Key fields: ID, audit ID, category, rule code, severity, page URL, evidence JSON, normalized value/metric, recommendation, confidence, deduplication key, and timestamps. Keep sufficient evidence for a reviewer and AI citation without retaining unnecessary full-page content.

### `outreach_drafts`

Drafts are internal editorial records. Their creation must never send a message.

Key fields: ID, prospect ID, optional audit ID, selected finding IDs/evidence snapshot, channel (`email`, `linkedin`, `build-audit-invitation`, `follow-up`), subject, body, status (`draft`, `in_review`, `approved`, `rejected`, `sent_externally` only when a person records it), author/generator metadata, reviewer ID, reviewed timestamp, rejection reason, and timestamps.

“Sent externally” should be an explicit human-recorded event in an early version, not an automated sending integration.

### `prospect_events`

Append-only history for significant actions: import, audit requested/completed/failed, score override, qualification change, draft created/edited/approved/rejected, opt-out, and manually recorded outreach.

Key fields: ID, prospect ID, optional audit/draft ID, event type, actor (user or system), concise metadata JSON, timestamp. Do not use this table as an unrestricted copy of email bodies or scraped source data.

### Coexistence with current schema

| Existing concept | Current table | Prospecting relationship |
| --- | --- | --- |
| Admin users | `users` | Reuse for access control, manual review, approvals, and audit-event actors. |
| Inbound project enquiries | `inquiries`, `inquiry_notes` | Keep separate. A prospect becomes an enquiry only if the business chooses to contact ForgeLine; do not convert automatically. |
| Portfolio works | `projects` | Keep separate. Projects are ForgeLine’s delivered work, not prospect records. |
| Client reviews | `reviews` | Keep separate; never use review data to fabricate or infer prospect results. |
| Blog posts | `posts` | Keep separate. `posts` is the current table name; there is no `blog_posts` table. |
| Existing action history | `audit_logs` | Continue using it for authenticated admin mutations. Add prospect-specific events only when event detail requires its own bounded model. |

## Admin dashboard plan

Future routes, all authenticated and capability-protected:

| Route | Purpose |
| --- | --- |
| `/admin/prospecting` | Overview: totals, high-opportunity items, items needing review, recent audits, and draft counts. |
| `/admin/prospecting/audit` | Phase 1 manual single-URL audit input and result page. |
| `/admin/prospecting/prospects` | Searchable/filterable prospect list with status, source, score, and reviewer state. |
| `/admin/prospecting/prospects/[id]` | Prospect timeline, audit evidence, score rationale, and associated drafts. |
| `/admin/prospecting/audits` | Audit-run list, status, failures/partials, and report access. |
| `/admin/prospecting/settings` | Crawl limits, retention, scoring thresholds, source policies, and draft-generation settings. |

Potential dashboard groupings are Prospects, Audits, High Opportunity, Needs Review, and Outreach Drafts. Use a dedicated capability such as `prospecting.manage` (and, if needed, narrower `prospecting.review` / `prospecting.settings`) rather than silently granting access through an unrelated existing capability. Capability design is deferred until implementation.

## Outreach draft system

### Input

An approved-for-drafting prospect, completed audit, selected opportunity, and a curated set of evidence-backed findings.

### Output

- subject;
- opening observation;
- concise problem explanation tied to observations;
- suggested improvement;
- CTA.

The system may generate a concise cold-email draft, LinkedIn-message draft, Build Audit invitation, and follow-up draft. Each must identify the evidence it draws upon and must stay accurate if copied verbatim.

### Review workflow

```text
Draft → Edit or Reject → Approve → Human sends outside the system → Record outcome if desired
```

Admins must be able to approve, edit, or reject. Approval is not dispatch. The Phase 1–4 scope contains no email provider integration for prospecting and no automatic sender.

## Build Audit relationship

The Prospecting Engine should complement—not replace—the existing ForgeLine Build Audit offering.

```text
Prospect
  → Automated technical audit
  → Human review
  → Evidence-led Build Audit invitation
  → Client conversation
  → ForgeLine Build Audit
  → Scoped proposal
```

The existing public `/build-audit` page describes a broader diagnostic conversation covering the site/application, workflows, integrations, and priority. An automated website audit is only a potential entry point. It must not represent itself as a complete Build Audit, a paid engagement, or a diagnosis of internal systems.

## Technical direction

Do not install or configure these tools in Phase 0. Evaluate them against Vercel limits, cost, security, licensing, and testability before choosing.

| Need | Direction to evaluate |
| --- | --- |
| Fetching/crawling | A bounded HTTP client with a clear allowlist/denylist, redirect policy, robots policy, and per-domain rate limit. |
| HTML parsing | A server-side parser such as Cheerio or parse5, selected only after compatibility and security review. |
| Performance | PageSpeed Insights or Lighthouse executed in a worker-capable environment; record source and measurement conditions. |
| SEO and structured data | Deterministic in-house rules over parsed HTML, headers, sitemap, robots, and JSON-LD before considering a third-party analyzer. |
| Technology indicators | Transparent signature rules or a reviewed detection library, always returned as confidence-qualified indicators. |
| Link checking | Queue-backed, bounded checker with same-domain prioritisation and explicit external-link limits. |
| AI analysis/drafting | A structured-output model called only after deterministic checks and with finding citations required in its response schema. |
| Background jobs | A managed queue/workflow service or external worker suited to long-running browser/Lighthouse work; choose after a Phase 1 timing profile. |

### Asynchronous architecture

The eventual request path should create an audit request quickly, persist its state, enqueue work, and return an audit ID. A worker then fetches pages, produces findings, saves progress, calculates score, and marks the run complete, partial, or failed. The admin reads persisted results and may retry a failed audit with recorded limits.

Do not use a normal server-rendered request as the place to crawl a site or run Lighthouse. Vercel/serverless execution limits, browser dependencies, retries, and cost controls make that unreliable for multi-page audits.

## Cost control and operational limits

- Normalize domains and cache results; do not crawl the same domain repeatedly within a defined freshness window.
- Start with the homepage and a small, deterministic set of important pages. Keep a page-count ceiling and expose it in the audit record.
- Stop safely on redirect loops, oversize responses, unsupported content, rate limits, robots policy, repeated failures, or elapsed-time budgets.
- Reuse deterministic audit data for score recalculation and draft revisions.
- Run AI only after deterministic checks have produced enough useful evidence and only for qualified/reviewed records.
- Generate outreach drafts only for prospects a human has elected to pursue.
- Track per-audit pages, fetches, external API calls, model tokens, and failures so cost and quality can be reviewed together.
- Make retries deliberate and bounded; cache a failed external dependency outcome briefly to avoid retry storms.

## Ethical and quality rules

The system must never fabricate:

- website, SEO, accessibility, performance, or technology problems;
- business problems, revenue loss, conversion loss, customer complaints, or internal workflows;
- results, rankings, company size, decision-maker identity, or contact permission;
- claims about technologies not supported by an observed signal.

Every outreach claim must be traceable to a stored observed fact. Prefer language such as “I noticed…” or “On the page we checked…” and qualify uncertainty. Do not claim a business is losing customers, needs a rebuild, or has a broken internal process without evidence appropriate to that claim.

## Phase 0 completion criteria

Phase 0 is complete when this specification and the companion handoff document exist, production behaviour is unchanged, and the next session can begin Phase 1 with the manual single-URL audit rather than rediscovering the existing system.
