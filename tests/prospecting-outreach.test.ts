/**
 * The outreach draft (Phase 5).
 *
 * Opportunities are produced by the real detector over the real scanner, so
 * the evidence these drafts cite is evidence the system can actually produce.
 * The claim-discipline tests at the end are the important ones: the whole
 * value of a deterministic template is that it cannot drift into saying
 * something the scan never established.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { runAuditJob } from "../src/lib/prospecting/runner.ts";
import { detectOpportunity } from "../src/lib/prospecting/opportunity.ts";
import { toScanView } from "../src/lib/prospecting/scan-view.ts";
import { failedQuickScan, type QuickScanResult } from "../src/lib/prospecting/quick-scan.ts";
import {
  FORGELINE_SENDER,
  describeEvidence,
  generateOutreach,
  outreachFromView,
  selectOutreachEvidence,
  type OutreachGenerationResult,
} from "../src/lib/prospecting/outreach.ts";
import { observationFor } from "../src/lib/prospecting/findings-summary.ts";
import type { BoundedPageResponse } from "../src/lib/prospecting/fetch.ts";

async function scanOf(
  html: string,
  options: { finalUrl?: string; status?: number } = {},
): Promise<QuickScanResult> {
  const page: BoundedPageResponse = {
    requestedUrl: "https://acme.example/",
    finalUrl: options.finalUrl ?? "https://acme.example/",
    status: options.status ?? 200,
    headers: { "content-type": "text/html" },
    contentType: "text/html",
    body: html,
    bytes: Buffer.byteLength(html),
    elapsedMs: 210,
    redirectChain: [],
  };
  const result = await runAuditJob(
    { auditId: 0, requestedUrl: "https://acme.example/", mode: "quick" },
    {
      markRunning: async () => undefined,
      fetchPage: async () => page,
      saveResult: async () => undefined,
      saveFailure: async () => undefined,
    },
  );
  return result.scan;
}

async function draftFor(html: string, options = {}): Promise<OutreachGenerationResult> {
  const scan = await scanOf(html, options);
  return outreachFromView(toScanView(scan, detectOpportunity(scan)));
}

function mustDraft(result: OutreachGenerationResult) {
  assert.equal(result.kind, "draft", `expected a draft, got: ${JSON.stringify(result)}`);
  if (result.kind !== "draft") throw new Error("unreachable");
  return result.draft;
}

const HEAD = (extra: string) => `<!doctype html><html><head>${extra}</head>`;

const HEALTHY = `${HEAD(`
  <title>Acme Plumbing</title><meta name="description" content="Licensed plumbers.">
  <meta name="viewport" content="width=device-width">`)}
  <body><h1>Acme Plumbing</h1><img src="/a.jpg" alt="Team">
  <form><button type="submit">Send</button></form><a href="/contact">Contact us</a></body></html>`;

const SEO_GAPS = `${HEAD(`<meta name="viewport" content="width=device-width">`)}
  <body><p>Welcome</p><a href="/contact">Contact us</a></body></html>`;

const STORE_WITH_OBSTACLE = `${HEAD(`
  <title>Acme Supplies</title><meta name="description" content="Workwear.">
  <meta name="viewport" content="width=device-width"><meta name="generator" content="Shopify">`)}
  <body><h1>Acme Supplies</h1><a href="/about">About us</a></body></html>`;

/** Every phrase the tool must never produce, whatever the opportunity. */
const FORBIDDEN =
  /losing (customers|leads|money|revenue)|lost revenue|increase revenue|guarantee|traffic loss|conversion rate|ranking|penalt|urgent|outdated|poorly designed|unprofessional|abandoned cart|checkout drop|low sales|drop-?off/i;

/* ------------------------------------------------------------------- SEO */

test("an SEO opportunity produces a subject, a body, and the company name", async () => {
  const draft = mustDraft(await draftFor(SEO_GAPS));

  assert.equal(draft.subject, "Quick idea for acme.example");
  assert.ok(draft.body.length > 0);
  assert.ok(draft.body.includes("acme.example"), "the company/site identity appears");
  assert.match(draft.body, /SEO/, "the recommended service is named");
});

test("the SEO draft restates the observed facts and nothing beyond them", async () => {
  const draft = mustDraft(await draftFor(SEO_GAPS));

  assert.match(draft.body, /no page title/i);
  assert.match(draft.body, /no meta description/i);
  assert.match(draft.body, /no main heading/i);
  assert.doesNotMatch(draft.body, FORBIDDEN);
  // The scan establishes nothing about search performance.
  assert.doesNotMatch(draft.body, /google|search engine|visibility|index/i);
});

/* ----------------------------------------------------- website development */

test("a website development draft names the project's own service", async () => {
  const draft = mustDraft(await draftFor(HEALTHY, { finalUrl: "http://acme.example/" }));

  assert.match(draft.body, /business websites/i, "the Phase 3 service name, not 'Web Development'");
  assert.doesNotMatch(draft.body, /web development service|Web Development\b/);
  assert.match(draft.body, /served without HTTPS/i, "the factual observation is stated");
});

test("a website development draft never calls the site bad", async () => {
  const draft = mustDraft(await draftFor(HEALTHY, { finalUrl: "http://acme.example/" }));
  assert.doesNotMatch(draft.body, /outdated|poorly designed|broken|unprofessional|ugly|looks old/i);
});

/* ------------------------------------------------------------ e-commerce */

test("an e-commerce draft cites the platform as context and the real obstacle", async () => {
  const draft = mustDraft(await draftFor(STORE_WITH_OBSTACLE));

  assert.match(draft.body, /Shopify/, "the detected platform is stated as fact");
  assert.match(draft.body, /no obvious next step/i, "the observation that fired the rule");
  assert.match(draft.body, /e-commerce/i, "the recommended service is named");
});

test("an e-commerce draft never claims lost sales, carts or conversion", async () => {
  const draft = mustDraft(await draftFor(STORE_WITH_OBSTACLE));
  assert.doesNotMatch(draft.body, FORBIDDEN);
  assert.doesNotMatch(draft.body, /sales|revenue|cart|checkout/i);
});

/* ------------------------------------------------------------ skip states */

test("No Clear Opportunity is skipped rather than turned into a generic pitch", async () => {
  const result = await draftFor(HEALTHY);

  assert.equal(result.kind, "skip");
  if (result.kind !== "skip") throw new Error("unreachable");
  assert.match(result.reason, /no clear opportunity/i);
});

test("Needs Manual Review is skipped with the agreed reason", () => {
  const scan = failedQuickScan("https://acme.example/", "Fetch exceeded the 10000ms timeout.");
  const result = outreachFromView(toScanView(scan, detectOpportunity(scan)));

  assert.equal(result.kind, "skip");
  if (result.kind !== "skip") throw new Error("unreachable");
  assert.equal(result.reason, "Manual review required before outreach.");
});

test("an opportunity with no observation behind it is skipped, not padded out", () => {
  const result = generateOutreach({
    companyName: "Acme",
    websiteUrl: "https://acme.example/",
    opportunity: { opportunity: "SEO", service: "SEO", evidence: [] },
  });

  assert.equal(result.kind, "skip");
});

/* ------------------------------------------------- identity and contact */

test("with no site title the draft falls back to the domain, inventing no company", async () => {
  const draft = mustDraft(await draftFor(SEO_GAPS));

  assert.match(draft.subject, /acme\.example/);
  assert.doesNotMatch(draft.body, /\bLtd\b|\bPty\b|\bInc\b|Solutions|Group|Limited/);
});

test("a known site title is used as the company name", async () => {
  const draft = mustDraft(await draftFor(STORE_WITH_OBSTACLE));
  assert.equal(draft.subject, "Quick idea for Acme Supplies");
});

test("generation works with no contact email and no phone", () => {
  const result = generateOutreach({
    companyName: "Acme",
    websiteUrl: "https://acme.example/",
    contactEmail: null,
    contactPhone: null,
    opportunity: {
      opportunity: "SEO",
      service: "SEO",
      evidence: ["No meta description detected.", "No H1 detected."],
    },
  });

  assert.equal(result.kind, "draft");
});

test("the greeting is neutral and no personal name is ever addressed", async () => {
  for (const html of [SEO_GAPS, STORE_WITH_OBSTACLE]) {
    const draft = mustDraft(await draftFor(html));
    assert.match(draft.body, /^Hi there,/, "a neutral business greeting");
    assert.doesNotMatch(draft.body, /^(Hi|Hello|Dear) [A-Z][a-z]+,/m, "never a first name");
  }
});

test("the draft never manufactures familiarity with the business", async () => {
  const draft = mustDraft(await draftFor(SEO_GAPS));
  assert.doesNotMatch(
    draft.body,
    /love what|impressed by|been following|your recent|expanding into|congratulations|big fan/i,
  );
});

test("the draft never asserts a fact the scan did not establish", async () => {
  const draft = mustDraft(await draftFor(SEO_GAPS));
  assert.doesNotMatch(
    draft.body,
    /employees|years in business|customers|turnover|competitors|award|testimonial|ad spend|traffic/i,
  );
});

/* -------------------------------------------------------------- mechanics */

test("the same input always produces the same output", async () => {
  const scan = await scanOf(SEO_GAPS);
  const view = toScanView(scan, detectOpportunity(scan));

  assert.deepEqual(outreachFromView(view), outreachFromView(view));
  assert.deepEqual(mustDraft(outreachFromView(view)), mustDraft(outreachFromView(view)));
});

test("no timestamp, date or random token appears in the copy", async () => {
  const draft = mustDraft(await draftFor(SEO_GAPS));
  assert.doesNotMatch(draft.body, /\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}|GMT|UTC/);
  assert.doesNotMatch(draft.subject, /\d{4}-\d{2}-\d{2}/);
});

test("the draft stays short enough to read quickly", async () => {
  for (const html of [SEO_GAPS, STORE_WITH_OBSTACLE]) {
    const words = mustDraft(await draftFor(html)).body.trim().split(/\s+/).length;
    assert.ok(words >= 80 && words <= 170, `body is ${words} words`);
  }
});

test("the subject is plain and never sensational", async () => {
  for (const html of [SEO_GAPS, STORE_WITH_OBSTACLE]) {
    const { subject } = mustDraft(await draftFor(html));
    assert.match(subject, /^Quick idea for /);
    assert.doesNotMatch(subject, /!|URGENT|\bemergency\b|major problem|\d+%/i);
    assert.ok(subject.length <= 78, "fits a mail client's subject line");
  }
});

test("the sign-off is the studio's own identity", async () => {
  const draft = mustDraft(await draftFor(SEO_GAPS));
  assert.ok(draft.body.includes(FORGELINE_SENDER.name));
  assert.ok(draft.body.includes(FORGELINE_SENDER.company));
  assert.ok(draft.body.includes(FORGELINE_SENDER.website));
});

/* ------------------------------------------------- evidence translation */

test("an unmapped observation is carried verbatim rather than dropped or reworded", () => {
  const result = generateOutreach({
    companyName: "Acme",
    websiteUrl: "https://acme.example/",
    opportunity: {
      opportunity: "Website Development",
      service: "Business websites",
      evidence: ["The homepage followed 5 redirects."],
    },
  });

  const draft = mustDraft(result);
  assert.ok(draft.body.includes("The homepage followed 5 redirects."));
});

test("describeEvidence separates the platform from the observations", () => {
  const described = describeEvidence([
    "Storefront platform detected: WooCommerce.",
    "No obvious call to action detected in the page text.",
  ]);

  assert.equal(described.platform, "WooCommerce");
  assert.deepEqual(described.homepage, ["no obvious next step"]);
  assert.deepEqual(described.standalone, []);
  assert.deepEqual(described.verbatim, []);
});

/* ----------------------------------------------- claim discipline sweep */

test("no draft the system can produce contains a forbidden claim", async () => {
  const fixtures = [SEO_GAPS, STORE_WITH_OBSTACLE, HEALTHY];
  for (const html of fixtures) {
    for (const options of [{}, { finalUrl: "http://acme.example/" }]) {
      const result = await draftFor(html, options);
      if (result.kind !== "draft") continue;
      assert.doesNotMatch(result.draft.body, FORBIDDEN, `${html.slice(0, 30)} ${JSON.stringify(options)}`);
      assert.doesNotMatch(result.draft.subject, FORBIDDEN);
    }
  }
});

test("a list of homepage observations merges into one grammatical clause", () => {
  const draft = mustDraft(
    generateOutreach({
      companyName: "Acme",
      websiteUrl: "https://acme.example/",
      opportunity: {
        opportunity: "SEO",
        service: "SEO",
        evidence: ["No page title detected.", "No meta description detected.", "No H1 detected."],
      },
    }),
  );

  assert.match(draft.body, /the homepage has no page title, no meta description and no main heading\./);
  assert.doesNotMatch(draft.body, /there is no meta description/, "clauses must not be mixed mid-list");
});

test("a plural service name still reads grammatically", () => {
  const draft = mustDraft(
    generateOutreach({
      companyName: "Acme",
      websiteUrl: "https://acme.example/",
      opportunity: {
        opportunity: "Website Development",
        service: "Business websites",
        evidence: ["The site is served without HTTPS."],
      },
    }),
  );

  assert.match(draft.body, /we work on business websites\./);
  assert.doesNotMatch(draft.body, /business websites is/, "subject and verb must agree");
});

test("homepage and standalone observations never collide into a double 'and'", () => {
  const draft = mustDraft(
    generateOutreach({
      companyName: "Acme",
      websiteUrl: "https://acme.example/",
      opportunity: {
        opportunity: "Website Development",
        service: "Business websites",
        evidence: ["The site is served without HTTPS.", "No responsive viewport meta tag detected."],
      },
    }),
  );

  assert.doesNotMatch(draft.body, /and .* and the site/);
  assert.match(draft.body, /I also noticed that/);
});

/* ============================================================================
 * Evidence selection — the email is about the reason the rule fired
 * ========================================================================= */

/** A page shaped like the Vanguard Roofing review: one layout fault, and a
 *  pile of unrelated SEO and accessibility noise around it. */
const VANGUARD = `<!doctype html><html><head>
  <title>Vanguard Roofing</title><title>Vanguard Roofing Ltd</title>
  <meta name="description" content="Roofing across the North West.">
  <meta name="viewport" content="width=device-width">
</head><body style="width: 1600px">
  <h2>Vanguard Roofing</h2>
  ${Array.from({ length: 35 }, (_, i) =>
    i < 12 ? `<img src="/i${i}.jpg">` : `<img src="/i${i}.jpg" alt="Roof ${i}" width="400" height="300">`,
  ).join("")}
  <a href="/contact">Contact us</a>
  <form><button type="submit">Send</button></form>
</body></html>`;

test("the Vanguard Roofing page is a Website Development opportunity on its layout", async () => {
  const scan = await scanOf(VANGUARD);
  const detected = detectOpportunity(scan);

  assert.equal(detected.opportunity, "Website Development");
  assert.deepEqual(detected.evidence, ["A large fixed-width layout was detected."]);
});

test("its email is about the layout, not the five quick findings", async () => {
  const scan = await scanOf(VANGUARD);
  const draft = mustDraft(outreachFromView(toScanView(scan, detectOpportunity(scan))));

  assert.match(draft.body, /fixed-width layout/i, "the reason the rule fired");

  // Everything the scan also noticed, and none of it belongs in this email.
  assert.doesNotMatch(draft.body, /main heading|H1/i);
  assert.doesNotMatch(draft.body, /more than one page title/i);
  assert.doesNotMatch(draft.body, /alt text/i);
  assert.doesNotMatch(draft.body, /canonical/i);
  assert.doesNotMatch(draft.body, /robots/i);
});

test("its email adds one supporting layout observation, and only one", async () => {
  const scan = await scanOf(VANGUARD);
  const draft = mustDraft(outreachFromView(toScanView(scan, detectOpportunity(scan))));

  assert.match(draft.body, /width or height/i, "images without dimensions support a layout point");
  assert.equal((draft.body.match(/I also noticed/g) ?? []).length, 1);
});

test("a Website Development email never reaches into SEO findings", () => {
  const selected = selectOutreachEvidence(
    { opportunity: "Website Development", service: "Business websites", evidence: ["The site is served without HTTPS."] },
    [
      { rule: "missing-title", line: "No page title detected." },
      { rule: "missing-meta-description", line: "No meta description detected." },
      { rule: "missing-h1", line: "No H1 detected." },
    ],
  );

  assert.deepEqual(selected.primary, ["The site is served without HTTPS."]);
  assert.equal(selected.supporting, null, "no SEO finding may support a build opportunity");
});

test("an SEO email cites its own observations and no layout one", async () => {
  const scan = await scanOf(SEO_GAPS);
  const draft = mustDraft(outreachFromView(toScanView(scan, detectOpportunity(scan))));

  assert.match(draft.body, /no page title, no meta description and no main heading/);
  assert.doesNotMatch(draft.body, /fixed-width|viewport|phone/i);
});

test("an e-commerce email uses only the evidence its own rule fired on", () => {
  const selected = selectOutreachEvidence(
    {
      opportunity: "E-commerce",
      service: "E-commerce",
      evidence: ["Storefront platform detected: Shopify.", "No obvious call to action detected in the page text."],
    },
    [
      { rule: "missing-primary-cta", line: "No obvious call to action detected in the page text." },
      { rule: "missing-title", line: "No page title detected." },
      { rule: "missing-canonical", line: "No canonical URL declared." },
    ],
  );

  assert.deepEqual(selected.primary, ["No obvious call to action detected in the page text."]);
  assert.equal(selected.supporting, null, "SEO findings never support a commerce opportunity");
});

test("a supporting observation is added only when there is a single primary one", () => {
  const observations = [{ rule: "missing-canonical", line: "No canonical URL declared." }];

  const many = selectOutreachEvidence(
    {
      opportunity: "SEO",
      service: "SEO",
      evidence: ["No page title detected.", "No meta description detected.", "No H1 detected."],
    },
    observations,
  );
  assert.equal(many.supporting, null, "three observations are already enough");

  const one = selectOutreachEvidence(
    { opportunity: "SEO", service: "SEO", evidence: ["No page title detected."] },
    observations,
  );
  assert.equal(one.supporting, "No canonical URL declared.");
});

test("the supporting observation never repeats one the rule already cited", () => {
  const selected = selectOutreachEvidence(
    { opportunity: "Website Development", service: "Business websites", evidence: ["A large fixed-width layout was detected."] },
    [{ rule: "fixed-width-layout", line: "A large fixed-width layout was detected." }],
  );
  assert.equal(selected.supporting, null);
});

test("a human-selected opportunity draws no supporting observation from a scan", () => {
  for (const manual of ["Automation", "Web Application", "Integration"] as const) {
    const selected = selectOutreachEvidence(
      { opportunity: manual, service: "Business automation", evidence: ["Something a person recorded."] },
      [{ rule: "missing-canonical", line: "No canonical URL declared." }],
    );
    assert.equal(selected.supporting, null, manual);
  }
});

test("a page full of unrelated findings still produces a focused email", async () => {
  const scan = await scanOf(VANGUARD);
  const draft = mustDraft(outreachFromView(toScanView(scan, detectOpportunity(scan))));

  // At most two observation sentences reach the reader, however much the scan saw.
  const observed = (draft.body.match(/I (also )?noticed/g) ?? []).length;
  assert.ok(observed <= 2, `${observed} observation sentences`);
});

test("the email no longer falls back on a generic closing observation", async () => {
  for (const html of [VANGUARD, SEO_GAPS, STORE_WITH_OBSTACLE]) {
    const scan = await scanOf(html);
    const result = outreachFromView(toScanView(scan, detectOpportunity(scan)));
    if (result.kind !== "draft") continue;
    assert.doesNotMatch(result.draft.body, /a few things worth looking at around/i, html.slice(0, 30));
  }
});

test("every phrase and supporting rule names something the scanner can actually produce", async () => {
  // Guards the two string-keyed maps against a typo that would silently stop
  // matching. Each key must be a line `observationFor` really emits.
  const scan = await scanOf(VANGUARD);
  const produced = new Set<string>();
  for (const rule of new Set(scan.findings.map((f) => f.rule))) {
    const line = observationFor(rule, scan);
    if (line) produced.add(rule);
  }
  for (const rule of ["fixed-width-layout", "missing-image-dimensions", "duplicate-title", "missing-canonical"]) {
    assert.ok(produced.has(rule), `${rule} should be produced by this fixture`);
  }
});
