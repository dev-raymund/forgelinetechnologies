# Forgeline Conversion Audit

**Site:** forgelinetechnologies.com
**Scope:** Homepage · `/blog` · admin · rendered DOM, component source, and database
**Findings:** 21
**Target markets:** AU · UK · US · CA

The site is well built and honestly written. It is not yet capable of generating
clients — because there is almost nothing on it to find, to trust, or to act on.

## Measured baseline

| Metric | Value |
|---|---|
| Real URLs on the entire site | **2** |
| Case study pages for 17 projects | **0** |
| Testimonials or client logos | **0** |
| Blog posts, on a linked blog | **0** |
| Words of indexable copy | 1,352 |
| Unoptimised project images | 2.8 MB |

---

## A. Critical problems

Each of these independently prevents the site from producing leads. Nothing
below section A matters until these are addressed.

### C1 — The site is one page pretending to be seven

The navigation offers Products, Process, Work, About and FAQ. Every one is an
in-page anchor. There are exactly two real URLs on the entire site.

```
40 links on the homepage
  19  in-page anchors (#products, #work, #about…)
  19  external (client sites, social)
   1  internal route  → /blog
```

Nothing can rank for "web application developer" separately from "Shopify
developer". Nothing can be linked to in an email. A prospect who wants pricing
has to be told to scroll. For a studio selling into four countries across six
service lines, one URL is one chance.

**Fix:** Split into real routes before any other work. This is the precondition
for SEO, for outreach links, and for measuring which service actually converts.

### C2 — The credibility numbers ship as zero

The stats band animates from 0 with JavaScript. The server sends the literal
digit, so first paint, no-JS visitors, and every scraper see a studio with no
track record.

```html
<strong data-to="6"   data-suffix="+">0</strong>   Years building
<strong data-to="17">0</strong>                    Projects shipped
<strong data-to="4">0</strong>                     Countries served
<strong data-to="100" data-suffix="%">0</strong>   Code ownership
```

The one section built to establish experience currently claims six years of
nothing. The real figures are already known and defensible — they just never
reach the HTML.

**Fix:** Render the real values server-side; let the count-up animate from the
rendered number, not from zero.

### C3 — There is no social proof of any kind

The testimonials section exists in the markup and is switched off with
`hidden={true}`. That was the right call — publishing placeholder quotes would
be worse. But the consequence is that a stranger has no third-party reason to
believe anything on the page.

No quotes, no client logos, no named referees, no review profile, no LinkedIn
recommendations surfaced. Seventeen real, live, verifiable projects exist and
none of them speak.

**Fix:** Two or three real testimonials outrank every design change in this
document. Ask the three clients most likely to say yes, in writing, with
permission to publish name and company.

### C4 — The blog is linked, indexed, and empty

`/blog` is in the main navigation and in the sitemap. It currently renders
"No posts published yet — check back soon."

```
GET /blog  →  200
post rows rendered:  0
empty-state shown:   yes
```

An empty blog in the nav is a negative trust signal: it reads as a business that
started something and stopped. It is worse than having no blog link at all.

**Fix:** Either publish three posts, or remove the nav link and drop it from the
sitemap until there is something there. Do not leave it as is.

### C5 — Seventeen projects, zero case studies

The portfolio is seventeen screenshots with a one-line caption each. None of
them link anywhere.

```
work items on homepage:           17
internal links to a detail page:   0
average description length:     ~110 characters
```

This is evidence without argument. A buyer cannot tell what problem was solved,
what was hard, what was built versus configured, or why they should pay four
thousand dollars. The database already stores a slug per project — the route to
use it simply does not exist.

**Fix:** Three real case studies beat seventeen thumbnails. Problem, constraint,
what was built, what shipped. No invented metrics — the constraint and the
decision are the story.

---

## B. High-priority problems

These materially suppress reach and conversion once the critical set is fixed.

### H1 — No sharing metadata and no structured data

Title and description are present and good. Everything else is absent.

```
og:title   0     twitter:card  0
og:image   0     canonical     0
og:desc    0     JSON-LD       0
```

Every link pasted into LinkedIn, Slack, WhatsApp or a client email renders as a
bare grey rectangle. For a business whose growth channel is outreach and
referral, the link preview *is* the first impression. Zero JSON-LD also means no
eligibility for service, FAQ or organisation rich results.

**Fix:** Open Graph + Twitter tags, a generated OG image, canonicals, and
`Organization` / `Service` / `FAQPage` schema.

### H2 — Images are served raw

The homepage loads fifty images through plain `<img>` tags with no responsive
sizing and no modern format.

```
project JPGs on disk:    2.8 MB total
largest single image:    248 KB
founder portrait:        208 KB PNG
next/image on homepage:  0 of 50
```

Mobile visitors in Australia and the UK are downloading megabytes of
desktop-resolution screenshots. This is the cheapest large win available — the
framework already ships the optimiser.

**Fix:** Move to `next/image` with `sizes`, and lazy-load everything below the
fold.

### H3 — 1,352 words is not enough to rank for anything competitive

That is the entire indexable content of the business — spread across six service
lines, four countries, seven packages and seventeen projects.

Competitors ranking for "web application development" in these markets have a
page per service, per market, and a case-study library. This is a volume problem
before it is a quality problem.

**Fix:** Fixing C1 and C5 largely fixes this: six service pages plus three case
studies is roughly 5,000 words of genuinely useful, non-padded content.

### H4 — No main landmark and no skip link

Semantics are otherwise good — one `<nav>`, one `<footer>`, `lang="en"` set, all
fifty images carry an alt attribute, and every form control is labelled.

```
<main>      0
skip link   0
<nav>       1     <footer>  1
img missing alt:  0 of 50
```

A keyboard or screen-reader visitor has to traverse the entire navigation on
every page and has no landmark to jump to. Two lines of markup.

**Fix:** Wrap page content in `<main id="main">` and add a visually-hidden skip
link as the first focusable element.

### H5 — Four different words for the same action

Eight call-to-action buttons carry four distinct labels.

```
4×  "Get started"
2×  "Start a project"
1×  "See our work"
1×  "Book a scoping call"
```

Three of these mean the same thing and land in the same place. Inconsistent
labelling costs recognition on a long page and makes conversion impossible to
attribute.

**Fix:** One primary label everywhere — "Start a project" — and one secondary,
"See our work". "Book a scoping call" is a genuinely different, lower-commitment
offer and should keep its own label near the form.

### H6 — One conversion path, at the very bottom

There is a single form, below roughly 1,300 words of page. No phone number, no
calendar booking, no email address presented as a call to action, and nothing
above the fold except a scroll.

Buyers at different readiness levels need different exits. Someone ready now
should not have to read a process section first.

**Fix:** Add a persistent header CTA, an email address in the footer, and a
calendar link for the scoping call. Keep the form as the considered path, not
the only one.

---

## C. Medium-priority problems

### M1 — The H1 breaks mid-sentence

The headline uses a hard `<br>` for its line break, so extracted text reads
`"We build the site thatwins you the work"`. Visually fine; degraded for text
extraction and screen-reader phrasing, and it forces the break at every viewport
width.

**Fix:** Remove the `<br>` and control the line with `max-width` and
`text-wrap: balance`.

### M2 — "Products" is the wrong word in the navigation

The nav item reads Products; the section it scrolls to is packaged services with
fixed prices. Buyers searching for a developer do not scan for "products" — and
the word suggests software you sell, not work you do.

**Fix:** Rename to "Services", matching both the search intent and what the
section contains.

### M3 — The FAQ answers five questions and dodges the hard ones

What's covered is good: scope, non-technical clients, code ownership, pricing,
start date. What's missing is every objection that actually loses deals —
working with an existing site, working alongside an in-house team, what happens
after launch, and why not simply hire cheaper offshore.

**Fix:** Take it to nine or ten, and answer the uncomfortable ones directly. The
offshore question in particular is being asked whether or not the page addresses
it.

### M4 — Published pricing is a real advantage, hidden inside a scroll

Publishing fixed prices is genuinely unusual and genuinely persuasive. It
currently exists only as an anchor partway down the homepage — it cannot be
linked, cannot be found in search, and cannot be sent to a prospect who asked
"roughly what does this cost?"

**Fix:** Give pricing its own URL. It is one of the strongest assets here and it
is invisible to search.

### M5 — The strongest credential is buried in a paragraph

Enterprise experience at PPD–ThermoFisher and six years across agencies in
Australia and New Zealand is the single most reassuring fact on the site for an
AU or UK buyer. It sits mid-paragraph in the founder story, formatted
identically to everything around it.

**Fix:** Surface it as a distinct credential near the top of the About content,
not as prose.

### M6 — Nothing on the page names a market

The business targets Australia, the UK, the US and Canada. The site names no
market, no currency, no timezone, and no working-hours overlap. A Sydney buyer
cannot tell whether prices are USD or AUD, or whether they will be waiting
overnight for replies.

**Fix:** State currency explicitly, and address timezone overlap directly — a
Philippines base is a genuine advantage for AU clients and worth saying out loud.

---

## D. Low-priority improvements

### L1 — Thirty-two images carry an empty alt attribute

Correct if all are decorative, which is likely — most appear to be inline SVG
ornament. Worth one pass to confirm none of them carry meaning.

### L2 — No apple-touch-icon or icon variants

A single SVG favicon is declared. Saved to a phone home screen or shared into
some clients, it falls back to a generic glyph.

### L3 — The response-time promise is not next to the form

"We'll reply within a day" appears in the section intro but not adjacent to the
submit button, which is where the hesitation actually occurs.

### L4 — Responsive coverage is good but bunched

Six breakpoints exist (1040, 980, 900, 860, 760, 400px) and reduced-motion is
respected. Four of the six sit within a 280px band, which suggests they accreted
as fixes rather than being designed. Worth consolidating during any future
layout work.

---

## E. Recommended new pages

Ordered by commercial return, not build effort. The first four are what turn the
site from a brochure into something that can be found and sent.

| Route | Job it does | Priority |
|---|---|---|
| `/work/[slug]` | Three real case studies. The single highest-value asset for closing a $4,000 build. | Now |
| `/services` | Hub for the six capabilities; captures the broad-intent search. | Now |
| `/services/[slug]` | One page per capability. This is what ranks for "web application development". | Now |
| `/pricing` | Makes the strongest differentiator linkable and findable. | Now |
| `/contact` | A destination for outreach links; somewhere the form can be sent directly. | Next |
| `/work` | Full portfolio index with category filtering. | Next |
| `/about` | Founder story, credentials, how the studio actually operates. | Next |
| `/process` | The four stages, expanded. Useful mid-consideration, not for acquisition. | Later |
| `/blog/[slug]` | Route exists; needs posts. Three good ones beat twenty thin ones. | Later |

---

## F. Recommended content changes

Content work only, no redesign. Ordered by how much each one moves a buyer.

1. **Get three testimonials.** Written, attributed, with permission. Nothing
   else on this list competes with it.
2. **Write three case studies** from the strongest projects — Talk Global Study,
   Multihull Central, and one locksmith or realty site to show the
   small-business end. Problem, constraint, build, outcome. No invented figures.
3. **Server-render the stats** so six years and seventeen projects are stated as
   fact rather than animated into existence.
4. **Say the currency and the timezone.** One sentence removes the biggest
   silent objection for an AU or UK buyer.
5. **Expand the FAQ to nine or ten**, including the offshore-pricing question
   and working alongside an internal team.
6. **Pull the enterprise credential out of the founder paragraph** and give it
   its own line.
7. **Publish or unlink the blog.** Three posts on decisions you actually made —
   choosing WordPress over React for a client, what a fixed quote covers, what
   happens at handover.
8. **Standardise every CTA** on one primary and one secondary label.

---

## G. Recommended conversion funnel

What the funnel should be, and where the current site breaks it.

### 01 — Arrive

A service page or case study ranks, or an outreach link is clicked. The visitor
lands on the specific thing they searched for.

> **Broken:** one indexable page. Everyone lands in the same place regardless of
> intent.

### 02 — Recognise

Within five seconds: what this studio builds, for whom, and that it has done it
before.

> **Broken:** the experience counters read zero on arrival.

### 03 — Believe

Third-party evidence — a named client saying it went well, a case study showing
judgment, a recognisable logo.

> **Broken:** no testimonials, no logos, no case studies. This is the widest gap
> in the funnel.

### 04 — Qualify

The buyer self-selects on price and scope before contacting, so the enquiries
that arrive are already close to fit.

> **Partly working:** published pricing does this well — but it is unlinkable
> and unfindable.

### 05 — Act

A path sized to readiness: book a call, send the form, or email directly.

> **Broken:** one form, at the bottom, as the only exit.

### 06 — Follow up

Enquiry stored, notification sent, confirmation to the sender, reply inside one
business day.

> **Nearly working:** the pipeline is built. It needs the database table created
> (`npm run db:push`) and Resend keys set.

---

## The one-line version

The engineering is not the problem. The site is fast, accessible in most
respects, honestly written, and refuses to fabricate — which is rarer and more
valuable than it looks.

What is missing is **surface area** and **proof**. Two URLs cannot rank against
studios with fifty. Seventeen unexplained thumbnails cannot close a
four-thousand-dollar build. And no amount of design compensates for a page where
nobody but the owner vouches for the work.

If only three things get done: **real testimonials**, **three case studies on
their own URLs**, and **service pages that can be found and sent**. Everything
else in this document is optimisation on top of those.

---

## What's already good, and worth not breaking

- Semantics: `lang` set, one `<nav>`, one `<footer>`, **0 of 50** images missing
  an alt attribute, every form control labelled.
- Security hygiene: `rel="noopener"` on all 19 external links.
- Responsive: six breakpoints, `prefers-reduced-motion` respected.
- Published fixed pricing — a real differentiator most studios won't touch.
- A consistent refusal to fabricate testimonials, metrics or client results.
