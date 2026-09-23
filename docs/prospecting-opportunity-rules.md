# Opportunity rules

How the prospecting tool decides, from one quick scan, whether there is a
reason to contact a business. Implemented in
[`src/lib/prospecting/opportunity.ts`](../src/lib/prospecting/opportunity.ts);
the observation wording lives in
[`findings-summary.ts`](../src/lib/prospecting/findings-summary.ts).

```text
QuickScanResult → ordered rules, first match wins → one OpportunityResult
```

Pure functions: no database, no network, no AI, no score. `detectOpportunity(scan)`
takes a plain object and always returns exactly one result.

## Automated opportunities

The detector may return only these five:

| Opportunity | Service |
|---|---|
| SEO | SEO |
| Website Development | Business websites |
| E-commerce | E-commerce |
| No Clear Opportunity | *(none)* |
| Needs Manual Review | *(none)* |

## Human-only opportunities

**Automation**, **Web Application** and **Integration** are never returned by a
rule. One homepage fetch cannot evidence a manual back-office process, a need
for custom software, or a system worth integrating. A person selects these, or
nobody does. Their service mapping stays defined for when a person does.

## Rule precedence

First match wins. One opportunity, one service, always.

| # | Rule | Fires when |
|---|---|---|
| 1 | `needs-manual-review` | the scan is not trustworthy enough to recommend from |
| 2 | `ecommerce` | a storefront **and** an observable obstacle to buying |
| 3 | `seo` | two or more of the three core page elements are absent |
| 4 | `website-development` | a concrete implementation fault |
| 5 | `no-clear-opportunity` | always — the scan worked and nothing else matched |

Two consequences worth knowing:

- A storefront with SEO gaps **and** a buying obstacle returns **E-commerce**,
  because the storefront result is the more specific one.
- A site with SEO gaps **and** an implementation fault returns **SEO**, because
  rule 3 precedes rule 4.

## Evidence used by each rule

### 1. Needs Manual Review

Any one of:

- `scan.error` is set — the scanner's own refusal: a blocked private address,
  a timeout, an unsupported content type, an oversized body, a redirect loop.
- the page was never reached (`httpStatus` or `finalUrl` is `null`).
- the homepage answered **4xx or 5xx**. The bytes analysed are then an error
  page, so its missing title belongs to that page and not to the business.
- the finding `noindex-meta` — the homepage asks not to be indexed, which is
  deliberate or a staging site. An automated SEO recommendation is unsafe.
- the scan object is structurally incomplete.

### 2. E-commerce

`signals.ecommerce` (Shopify or WooCommerce, detected by generator tag or
plugin asset path) **and** at least one of:

`missing-primary-cta` · `form-without-submit-control` · `missing-viewport` · `fixed-width-layout`

The platform alone is never enough. A storefront with none of those falls
through. Nothing claims lost sales, underperformance or a checkout problem —
the quick scan never reaches a checkout.

### 3. SEO

Two or more of these three findings:

`missing-title` · `missing-meta-description` · `missing-h1`

**Why two.** Each is an element every page is expected to declare, and each is
reported at high or medium severity. One missing element is an oversight and
not worth an email; two or more is a pattern a person can confirm in ten
seconds. It is a count of named elements, not a score — no weights, and no
other finding can push a site over the line.

Deliberately excluded: `missing-canonical`, `missing-structured-data` and
`missing-robots` are low or informational and common on healthy sites.

### 4. Website Development

Any one of:

- the site is served without HTTPS (`scan.https === false`)
- `missing-viewport` — no responsive viewport meta tag
- `fixed-width-layout` — a large fixed-width layout
- `redirect-chain-too-long`

`slow-response` and `oversized-html` are **not** triggers: both vary with the
network and the moment of measurement. They still appear in the findings
summary for a person to read.

A detected platform is never a trigger. WordPress, Shopify or PHP is
information about the build, not a defect in it. No rule uses a subjective
judgement about how a site looks.

### 5. No Clear Opportunity

The scan succeeded, the evidence is usable, and no rule above reached its
threshold. Evidence is empty by design.

This is a real outcome, not a failure. Forcing every prospect into a service is
how a prospecting tool starts inventing problems.

## What the quick scan cannot tell you

Quick mode makes **one request**. It never fetches `/robots.txt`,
`/sitemap.xml` or any internal page, so these five findings can never appear
and no rule may be written against them:

`missing-robots-txt` · `invalid-robots` · `missing-sitemap` · `invalid-sitemap` · `broken-link`

Two Phase 2 fields are read straight from the HTML and must not be confused
with the files they resemble:

| Field | Means | Does **not** mean |
|---|---|---|
| `page.robotsMeta` | a `<meta name="robots">` tag is present | anything about `/robots.txt` |
| `page.sitemapLink` | a `<link rel="sitemap">` element is present | anything about `/sitemap.xml` |

Absence of an unchecked resource is never converted into an observation.

## Changing a rule

Edit the rule object in `opportunity.ts` and its test in
`tests/prospecting-opportunity.test.ts`. The tests run real HTML through the
real scanner, so a rule keyed on a finding the scanner does not emit fails
rather than silently never firing.
