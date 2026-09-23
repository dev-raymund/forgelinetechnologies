/**
 * Deterministic opportunity detection (Phase 3).
 *
 * Every fixture below is run through the real quick scan — `runAuditJob` in
 * quick mode over real HTML — and the resulting `QuickScanResult` is what the
 * rules see. Nothing here hand-writes a findings array, so a rule keyed on a
 * finding name the scanner does not actually emit fails instead of silently
 * never firing.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { runAuditJob } from "../src/lib/prospecting/runner.ts";
import type { BoundedPageResponse } from "../src/lib/prospecting/fetch.ts";
import type { QuickScanResult } from "../src/lib/prospecting/quick-scan.ts";
import { failedQuickScan } from "../src/lib/prospecting/quick-scan.ts";
import { detectOpportunity, serviceFor } from "../src/lib/prospecting/opportunity.ts";
import { RULES_REQUIRING_A_FULL_AUDIT, summarizeFindings } from "../src/lib/prospecting/findings-summary.ts";
import { OPPORTUNITY_VALUES } from "../src/lib/prospecting/types.ts";

/** Runs the real quick scan over one page of HTML. */
async function scanOf(
  html: string,
  options: { finalUrl?: string; status?: number; elapsedMs?: number } = {},
): Promise<QuickScanResult> {
  const page: BoundedPageResponse = {
    requestedUrl: "https://acme.example/",
    finalUrl: options.finalUrl ?? "https://acme.example/",
    status: options.status ?? 200,
    headers: { "content-type": "text/html" },
    contentType: "text/html",
    body: html,
    bytes: Buffer.byteLength(html),
    elapsedMs: options.elapsedMs ?? 200,
    redirectChain: [],
  };
  const result = await runAuditJob(
    { auditId: 1, requestedUrl: "https://acme.example/", mode: "quick" },
    {
      markRunning: async () => undefined,
      fetchPage: async () => page,
      saveResult: async () => undefined,
      saveFailure: async () => undefined,
    },
  );
  return result.scan;
}

const head = (extra: string) => `<!doctype html><html><head>${extra}</head>`;
const GOOD_HEAD = head(`
  <title>Acme Plumbing — Sydney</title>
  <meta name="description" content="Licensed plumbers serving inner Sydney.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="https://acme.example/">`);
const GOOD_BODY = `<body>
  <h1>Acme Plumbing</h1>
  <img src="/team.jpg" alt="The Acme team">
  <form><button type="submit">Send</button></form>
  <a href="/contact">Contact us</a>
</body></html>`;

/** A well-built small-business site. Nothing here is a reason to make contact. */
const HEALTHY = `${GOOD_HEAD}${GOOD_BODY}`;

/** Title, description and H1 all absent; everything else sound. */
const SEO_DEFICIENT = `${head(`<meta name="viewport" content="width=device-width">`)}
  <body><p>Welcome</p><a href="/contact">Contact us</a></body></html>`;

/** Sound on-page SEO, but no responsive viewport. */
const NO_VIEWPORT = `${head(`
  <title>Acme Plumbing</title>
  <meta name="description" content="Licensed plumbers.">`)}
  <body><h1>Acme Plumbing</h1><a href="/contact">Contact us</a></body></html>`;

/** A storefront with no visible next step anywhere on the homepage. */
const STORE_WITH_OBSTACLE = `${head(`
  <title>Acme Supplies</title>
  <meta name="description" content="Workwear and safety gear.">
  <meta name="viewport" content="width=device-width">
  <meta name="generator" content="Shopify">`)}
  <body><h1>Acme Supplies</h1><a href="/about">About us</a><a href="/">Home</a></body></html>`;

/** The same storefront, with nothing the quick scan can fault. */
const STORE_HEALTHY = `${head(`
  <title>Acme Supplies</title>
  <meta name="description" content="Workwear and safety gear.">
  <meta name="viewport" content="width=device-width">
  <meta name="generator" content="Shopify">`)}
  <body><h1>Acme Supplies</h1><a href="/shop">Shop now</a>
  <form><button type="submit">Search</button></form></body></html>`;

/* ------------------------------------------------------- 1. manual review */

test("a failed scan needs manual review", () => {
  const result = detectOpportunity(failedQuickScan("https://acme.example/", "Fetch exceeded the 10000ms timeout."));

  assert.equal(result.opportunity, "Needs Manual Review");
  assert.equal(result.service, null);
  assert.equal(result.ruleId, "needs-manual-review");
  assert.match(result.evidence[0] ?? "", /did not complete/i);
});

test("a blocked private address needs manual review, via the scanner's own error", () => {
  const result = detectOpportunity(
    failedQuickScan("https://internal.example/", "Audit URL resolves to an unsafe or private address."),
  );

  assert.equal(result.opportunity, "Needs Manual Review");
  assert.match(result.evidence.join(" "), /unsafe or private/i);
});

test("an incomplete scan result needs manual review rather than throwing", () => {
  const broken = { requestedUrl: "https://acme.example/" } as unknown as QuickScanResult;
  const result = detectOpportunity(broken);

  assert.equal(result.opportunity, "Needs Manual Review");
  assert.match(result.reason, /incomplete/i);
});

test("a homepage that answers 4xx needs manual review, not an SEO recommendation", async () => {
  // The bytes analysed are an error page, so its missing title is the error
  // page's, not the business's.
  const scan = await scanOf(SEO_DEFICIENT, { status: 404 });
  const result = detectOpportunity(scan);

  assert.equal(result.opportunity, "Needs Manual Review");
  assert.match(result.reason, /HTTP 404/);
});

test("a homepage asking not to be indexed needs manual review", async () => {
  const scan = await scanOf(
    `${head(`<meta name="robots" content="noindex"><meta name="viewport" content="width=device-width">`)}<body><p>Staging</p></body></html>`,
  );
  const result = detectOpportunity(scan);

  assert.equal(result.opportunity, "Needs Manual Review");
  assert.match(result.reason, /noindex|not to index/i);
});

test("few findings is not manual review — a clean site is a clean result", async () => {
  const result = detectOpportunity(await scanOf(HEALTHY));
  assert.notEqual(result.opportunity, "Needs Manual Review");
});

/* ----------------------------------------------------------------- 2. SEO */

test("title, description and H1 all absent is an SEO opportunity", async () => {
  const result = detectOpportunity(await scanOf(SEO_DEFICIENT));

  assert.equal(result.opportunity, "SEO");
  assert.equal(result.service, "SEO");
  assert.equal(result.ruleId, "seo");
  assert.deepEqual(result.evidence, [
    "No page title detected.",
    "No meta description detected.",
    "No H1 detected.",
  ]);
  assert.match(result.reason, /missing a page title, a meta description and an H1/);
});

test("one missing SEO element alone is not enough to recommend SEO", async () => {
  // Title and H1 present, description absent. A single oversight is not a
  // reason to email someone.
  const scan = await scanOf(
    `${head(`<title>Acme Plumbing</title><meta name="viewport" content="width=device-width">`)}
     <body><h1>Acme Plumbing</h1><a href="/contact">Contact us</a></body></html>`,
  );
  const result = detectOpportunity(scan);

  assert.notEqual(result.opportunity, "SEO");
  assert.equal(result.opportunity, "No Clear Opportunity");
});

test("two of the three core elements absent reaches the threshold", async () => {
  const scan = await scanOf(
    `${head(`<meta name="viewport" content="width=device-width">`)}
     <body><h1>Acme Plumbing</h1><a href="/contact">Contact us</a></body></html>`,
  );
  const result = detectOpportunity(scan);

  assert.equal(result.opportunity, "SEO");
  assert.deepEqual(result.evidence, ["No page title detected.", "No meta description detected."]);
});

test("a missing robots meta tag is never reported as a missing robots.txt", async () => {
  const scan = await scanOf(SEO_DEFICIENT);
  const result = detectOpportunity(scan);

  assert.equal(scan.page.robotsMeta, false, "the fixture declares no robots meta tag");
  const text = `${result.reason} ${result.evidence.join(" ")} ${summarizeFindings(scan).join(" ")}`;
  assert.doesNotMatch(text, /robots\.txt/i);
});

test("an absent sitemap link is never reported as a missing sitemap.xml", async () => {
  const scan = await scanOf(SEO_DEFICIENT);
  const result = detectOpportunity(scan);

  assert.equal(scan.page.sitemapLink, false, "the fixture declares no sitemap link");
  const text = `${result.reason} ${result.evidence.join(" ")} ${summarizeFindings(scan).join(" ")}`;
  assert.doesNotMatch(text, /sitemap/i);
});

test("a quick scan never carries a finding that needs a full audit", async () => {
  const scan = await scanOf(SEO_DEFICIENT);
  const rules = new Set(scan.findings.map((finding) => finding.rule));
  for (const rule of RULES_REQUIRING_A_FULL_AUDIT) {
    assert.equal(rules.has(rule), false, `${rule} cannot come from a quick scan`);
  }
});

/* --------------------------------------------- 3. website development */

test("a missing responsive viewport is a website development opportunity", async () => {
  const result = detectOpportunity(await scanOf(NO_VIEWPORT));

  assert.equal(result.opportunity, "Website Development");
  assert.equal(result.service, "Business websites");
  assert.equal(result.ruleId, "website-development");
  assert.ok(result.evidence.includes("No responsive viewport meta tag detected."));
});

test("a site served without HTTPS is a website development opportunity", async () => {
  const result = detectOpportunity(await scanOf(HEALTHY, { finalUrl: "http://acme.example/" }));

  assert.equal(result.opportunity, "Website Development");
  assert.ok(result.evidence.includes("The site is served without HTTPS."));
  assert.match(result.reason, /without HTTPS/);
});

test("a detected platform alone is never a development recommendation", async () => {
  // A well-built WordPress site. The platform is information, not a defect.
  const scan = await scanOf(
    `${head(`
      <title>Acme Plumbing</title>
      <meta name="description" content="Licensed plumbers.">
      <meta name="viewport" content="width=device-width">
      <meta name="generator" content="WordPress 6.6">`)}
     <body><h1>Acme Plumbing</h1><a href="/contact">Contact us</a></body></html>`,
  );
  const result = detectOpportunity(scan);

  assert.ok(scan.technologies.includes("WordPress"), "the fixture is detected as WordPress");
  assert.equal(result.opportunity, "No Clear Opportunity");
});

test("the reason never reaches for a subjective judgement about the design", async () => {
  const result = detectOpportunity(await scanOf(NO_VIEWPORT));
  assert.doesNotMatch(result.reason, /outdated|old|ugly|unattractive|looks|redesign|feels/i);
});

/* ------------------------------------------------------- 4. e-commerce */

test("a storefront with an observable obstacle is an E-commerce opportunity", async () => {
  const result = detectOpportunity(await scanOf(STORE_WITH_OBSTACLE));

  assert.equal(result.opportunity, "E-commerce");
  assert.equal(result.service, "E-commerce");
  assert.equal(result.ruleId, "ecommerce");
  assert.ok(result.evidence.includes("Storefront platform detected: Shopify."));
  assert.ok(result.evidence.includes("No obvious call to action detected in the page text."));
});

test("a storefront with nothing to fault is not forced into an E-commerce recommendation", async () => {
  const scan = await scanOf(STORE_HEALTHY);
  const result = detectOpportunity(scan);

  assert.equal(scan.signals.ecommerce, true, "the fixture is detected as a storefront");
  assert.notEqual(result.opportunity, "E-commerce");
  assert.equal(result.opportunity, "No Clear Opportunity");
});

test("an e-commerce recommendation never claims lost sales or a checkout problem", async () => {
  const result = detectOpportunity(await scanOf(STORE_WITH_OBSTACLE));
  assert.doesNotMatch(
    `${result.reason} ${result.evidence.join(" ")}`,
    /losing|lost sales|underperform|checkout|revenue|conversion rate/i,
  );
});

/* ------------------------------------------- 5. no clear opportunity */

test("a healthy business website returns no clear opportunity", async () => {
  const result = detectOpportunity(await scanOf(HEALTHY));

  assert.equal(result.opportunity, "No Clear Opportunity");
  assert.equal(result.service, null);
  assert.equal(result.ruleId, "no-clear-opportunity");
  assert.deepEqual(result.evidence, []);
});

/* ------------------------------------------------ 6. first match wins */

test("a storefront that also has SEO gaps and no viewport returns E-commerce only", async () => {
  // All three of the e-commerce, SEO and website-development conditions hold.
  const scan = await scanOf(
    `${head(`<meta name="generator" content="Shopify">`)}<body><p>Our range</p></body></html>`,
  );
  const result = detectOpportunity(scan);

  assert.equal(result.opportunity, "E-commerce");
  assert.equal(result.ruleId, "ecommerce");
});

test("SEO outranks website development when both conditions hold", async () => {
  // Two core SEO elements absent and no viewport, on a non-storefront site.
  const scan = await scanOf(`${head("")}<body><h1>Acme</h1><a href="/contact">Contact us</a></body></html>`);
  const result = detectOpportunity(scan);

  assert.equal(result.opportunity, "SEO");
  assert.equal(result.ruleId, "seo");
});

test("exactly one opportunity and at most one service are ever returned", async () => {
  for (const html of [HEALTHY, SEO_DEFICIENT, NO_VIEWPORT, STORE_WITH_OBSTACLE, STORE_HEALTHY]) {
    const result = detectOpportunity(await scanOf(html));
    assert.ok(OPPORTUNITY_VALUES.includes(result.opportunity), result.opportunity);
    assert.equal(typeof result.opportunity, "string");
    assert.ok(result.service === null || typeof result.service === "string");
  }
});

/* --------------------------------------------------- 7. service mapping */

test("each automated opportunity maps to the project's own service name", () => {
  assert.equal(serviceFor("SEO"), "SEO");
  assert.equal(serviceFor("Website Development"), "Business websites");
  assert.equal(serviceFor("E-commerce"), "E-commerce");
  assert.equal(serviceFor("No Clear Opportunity"), null);
  assert.equal(serviceFor("Needs Manual Review"), null);
});

test("the human-only opportunities keep their services for later selection", () => {
  assert.equal(serviceFor("Automation"), "Business automation");
  assert.equal(serviceFor("Web Application"), "Custom web applications");
  assert.equal(serviceFor("Integration"), "API integrations");
});

/* ------------------------------------------------- 8. nothing inferred */

test("no automated rule can ever return a human-only opportunity", async () => {
  const everyFixture = [HEALTHY, SEO_DEFICIENT, NO_VIEWPORT, STORE_WITH_OBSTACLE, STORE_HEALTHY];
  for (const html of everyFixture) {
    const result = detectOpportunity(await scanOf(html));
    for (const manual of ["Automation", "Web Application", "Integration"]) {
      assert.notEqual(result.opportunity, manual, `${manual} must never be produced by a rule`);
    }
  }
});

test("the result carries no score, band, confidence or prediction", async () => {
  const result = detectOpportunity(await scanOf(SEO_DEFICIENT));

  assert.deepEqual(Object.keys(result).sort(), ["evidence", "opportunity", "reason", "ruleId", "service"]);
  assert.doesNotMatch(
    JSON.stringify(result),
    /score|band|confidence|probability|revenue|roi|estimated|predict/i,
  );
});

test("no reason or evidence line makes a business claim the scan cannot support", async () => {
  for (const html of [HEALTHY, SEO_DEFICIENT, NO_VIEWPORT, STORE_WITH_OBSTACLE, STORE_HEALTHY]) {
    const scan = await scanOf(html);
    const result = detectOpportunity(scan);
    const text = `${result.reason} ${result.evidence.join(" ")} ${summarizeFindings(scan).join(" ")}`;
    assert.doesNotMatch(
      text,
      /losing (leads|customers|money|revenue)|needs a (rebuild|redesign)|poor conversion|hurting|traffic loss/i,
      html.slice(0, 40),
    );
  }
});
