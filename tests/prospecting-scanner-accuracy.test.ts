/**
 * Scanner accuracy, from a twenty-site validation against real businesses.
 *
 * The `fixed-width-layout` rule produced twelve findings across those sites
 * and not one was true. Every fixture below is the structure that actually
 * caused one, copied from the page it was found on, so the regression cannot
 * come back quietly.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "cheerio";
import { analyzePage, fixedWidthLayout } from "../src/lib/prospecting/analyze.ts";
import { detectOpportunity } from "../src/lib/prospecting/opportunity.ts";
import { runAuditJob } from "../src/lib/prospecting/runner.ts";
import { toScanView, cleanSiteName } from "../src/lib/prospecting/scan-view.ts";
import { outreachFromView } from "../src/lib/prospecting/outreach.ts";
import type { QuickScanResult } from "../src/lib/prospecting/quick-scan.ts";

const fires = (html: string) => fixedWidthLayout(load(html)) !== null;

const HEAD = `<title>Acme Roofing</title>
  <meta name="description" content="Roofing.">
  <meta name="viewport" content="width=device-width">`;

async function scanOf(
  html: string,
  options: { elapsedMs?: number; bytes?: number; finalUrl?: string } = {},
): Promise<QuickScanResult> {
  const page = {
    requestedUrl: "https://acme.example/",
    finalUrl: options.finalUrl ?? "https://acme.example/",
    status: 200,
    headers: { "content-type": "text/html" },
    contentType: "text/html",
    body: html,
    bytes: options.bytes ?? Buffer.byteLength(html),
    elapsedMs: options.elapsedMs ?? 250,
    redirectChain: [],
  };
  const result = await runAuditJob(
    { auditId: 0, requestedUrl: page.requestedUrl, mode: "quick" },
    {
      markRunning: async () => undefined,
      fetchPage: async () => page,
      saveResult: async () => undefined,
      saveFailure: async () => undefined,
    },
  );
  return result.scan;
}

const draftFor = async (html: string, options = {}) => {
  const scan = await scanOf(html, options);
  return outreachFromView(toScanView(scan, detectOpportunity(scan)));
};

function body(result: Awaited<ReturnType<typeof draftFor>>): string {
  assert.equal(result.kind, "draft", `expected a draft: ${JSON.stringify(result)}`);
  if (result.kind !== "draft") throw new Error("unreachable");
  return result.draft.body;
}

/* ================================================================== */
/* The twelve false positives, by the structure that caused each      */
/* ================================================================== */

test("an intrinsic image width is not a fixed-width layout", () => {
  // theroofingcompanynorthwest.co.uk, theaccountancy.co.uk, dentalelite.co.uk,
  // cavitydentalstaff.co.uk — all flagged on exactly this.
  for (const width of [1258, 1280, 1365, 1400, 1600, 1692, 1941]) {
    assert.equal(
      fires(`<html><body><img src="/hero.jpg" width="${width}" height="900" alt="Hero"></body></html>`),
      false,
      `<img width="${width}"> must not fire`,
    );
  }
});

test("an intrinsic SVG width is not a fixed-width layout", () => {
  assert.equal(fires(`<html><body><svg width="1280" height="720"><rect/></svg></body></html>`), false);
});

test("other replaced elements are not layout either", () => {
  for (const tag of ["canvas", "video", "iframe", "embed"]) {
    assert.equal(fires(`<html><body><${tag} width="1920" height="1080"></${tag}></body></html>`), false, tag);
  }
});

test("a WordPress placeholder custom property is not a width declaration", () => {
  // jdpropertyservices.co.uk, verbatim.
  const html = `<html><body><img src="/a.jpg" width="1941" height="1090"
    style="--smush-placeholder-width: 1941px; --smush-placeholder-aspect-ratio: 1941/1090;"></body></html>`;
  assert.equal(fires(html), false);
});

test("min-width and max-width are not a fixed layout width", () => {
  assert.equal(fires(`<html><body><div style="min-width: 1200px">x</div></body></html>`), false);
  assert.equal(fires(`<html><body><div style="max-width: 1400px">x</div></body></html>`), false);
});

test("a carousel track is not a layout defect", () => {
  // medmatch.co.uk, verbatim: an absurd width plus a positioning transform.
  const html = `<html><body><div class="swiper-wrapper"
    style="width: 17100px; transform: translate3d(-1140px, 0px, 0px);">
    <div class="swiper-slide" style="width: 1090px;">one</div>
    <div class="swiper-slide" style="width: 1090px;">two</div>
  </div></body></html>`;
  assert.equal(fires(html), false);
});

test("a slide inside a slider is not the page layout, even at a plausible width", () => {
  const html = `<html><body><div class="carousel-inner">
    <div class="carousel-item" style="width: 1200px;">one</div>
  </div></body></html>`;
  assert.equal(fires(html), false);
});

test("a repeated card deep in the tree is not the page layout", () => {
  const html = `<html><body><main><section><div class="grid"><div class="card">
    <div style="width: 1100px">content</div>
  </div></div></section></main></body></html>`;
  assert.equal(fires(html), false);
});

/* ================================================================== */
/* What may still legitimately fire                                    */
/* ================================================================== */

test("a body pinned to a pixel width is still detected", () => {
  assert.equal(fires(`<html><body style="width: 1200px"><p>Hello</p></body></html>`), true);
});

test("a top-level wrapper pinned to a pixel width is still detected", () => {
  const html = `<html><body><div id="wrapper" style="width: 1024px"><p>Hello</p></div></body></html>`;
  assert.equal(fires(html), true);
  assert.deepEqual(fixedWidthLayout(load(html)), { element: "div", widthPx: 1024 });
});

test("the finding records which element and width it saw", async () => {
  const scan = await scanOf(`<html><head>${HEAD}</head><body style="width: 1280px"><h1>A</h1></body></html>`);
  const found = scan.findings.find((f) => f.rule === "fixed-width-layout");
  assert.ok(found, "the rule still fires on a real fixed layout");
  assert.deepEqual(found.evidence, { element: "body", widthPx: 1280 });
});

test("a responsive page with declared image dimensions produces no layout finding", async () => {
  const imgs = Array.from({ length: 30 }, (_, i) =>
    `<img src="/i${i}.jpg" width="1600" height="900" alt="Roof ${i}">`).join("");
  const scan = await scanOf(`<html><head>${HEAD}</head><body><h1>Acme</h1>${imgs}
    <a href="/contact">Contact us</a><form><button type="submit">Send</button></form></body></html>`);

  assert.equal(scan.findings.some((f) => f.rule === "fixed-width-layout"), false);
  assert.equal(detectOpportunity(scan).opportunity, "No Clear Opportunity");
});

/* ================================================================== */
/* Response time                                                       */
/* ================================================================== */

const SOUND = `<html><head>${HEAD}</head><body><h1>Acme</h1>
  <a href="/contact">Contact us</a><form><button type="submit">Send</button></form></body></html>`;

test("a response inside the threshold produces no opportunity", async () => {
  const scan = await scanOf(SOUND, { elapsedMs: 2_999 });
  assert.equal(scan.findings.some((f) => f.rule === "slow-response"), false);
  assert.equal(detectOpportunity(scan).opportunity, "No Clear Opportunity");
});

test("a response past the threshold is a Website Development opportunity", async () => {
  // tradesmeninleeds.co.uk answered in 6,366 ms; dentistjobs.co.uk in 4,265 ms.
  const scan = await scanOf(SOUND, { elapsedMs: 6_366 });
  const detected = detectOpportunity(scan);

  assert.equal(detected.opportunity, "Website Development");
  assert.equal(detected.service, "Business websites");
  assert.ok(detected.evidence.some((e) => /Response time: 6,366 ms/.test(e)));
});

test("the email states the measured time and ties it to the scan", async () => {
  const text = body(await draftFor(SOUND, { elapsedMs: 6_366 }));

  assert.match(text, /took about 6\.4 seconds to respond when I checked/);
  assert.doesNotMatch(text, /your (website|site) is slow/i);
  assert.doesNotMatch(text, /losing (visitors|customers|leads)/i);
});

/* ================================================================== */
/* HTML size                                                           */
/* ================================================================== */

test("a payload inside the threshold produces no opportunity", async () => {
  const scan = await scanOf(SOUND, { bytes: 499_999 });
  assert.equal(scan.findings.some((f) => f.rule === "oversized-html"), false);
  assert.equal(detectOpportunity(scan).opportunity, "No Clear Opportunity");
});

test("a payload past the threshold is a Website Development opportunity", async () => {
  // a-wise.co.uk returned 1,082,939 bytes of HTML.
  const scan = await scanOf(SOUND, { bytes: 1_082_939 });
  const detected = detectOpportunity(scan);

  assert.equal(detected.opportunity, "Website Development");
  assert.ok(detected.evidence.some((e) => /HTML size: 1,082,939 bytes/.test(e)));
});

test("the email states the measured size without a consequence claim", async () => {
  const text = body(await draftFor(SOUND, { bytes: 1_082_939 }));

  assert.match(text, /returned about 1\.1 MB of HTML when I checked/);
  assert.doesNotMatch(text, /bloated|hurting|slowing you down|costing/i);
  assert.doesNotMatch(text, /SEO|conversion/i);
});

/* ================================================================== */
/* Forms                                                               */
/* ================================================================== */

const NO_SUBMIT = `<html><head>${HEAD}</head><body><h1>Acme</h1>
  <a href="/contact">Contact us</a>
  <form><input name="email"><input name="message"></form></body></html>`;

test("a form without a submit control is a Website Development opportunity off a storefront", async () => {
  // dentalrecruitnetwork.co.uk — a recruitment site, so E-commerce cannot apply.
  const scan = await scanOf(NO_SUBMIT);
  const detected = detectOpportunity(scan);

  assert.equal(scan.signals.ecommerce, false);
  assert.equal(detected.opportunity, "Website Development");
  assert.equal(detected.service, "Business websites");
});

test("a form with a submit control triggers nothing", async () => {
  const scan = await scanOf(SOUND);
  assert.equal(scan.findings.some((f) => f.rule === "form-without-submit-control"), false);
});

test("a storefront with the same form still returns E-commerce", async () => {
  const scan = await scanOf(NO_SUBMIT.replace("<title>", `<meta name="generator" content="Shopify"><title>`));
  const detected = detectOpportunity(scan);

  assert.equal(detected.opportunity, "E-commerce", "precedence is unchanged");
  assert.equal(detected.service, "E-commerce");
});

test("the email describes the form without claiming it is broken", async () => {
  const text = body(await draftFor(NO_SUBMIT));

  assert.match(text, /form without an obvious submit control/);
  assert.doesNotMatch(text, /broken|does not work|doesn't work|missing leads|cannot submit/i);
});

/* ================================================================== */
/* Title cleanup                                                       */
/* ================================================================== */

test("a title is cut at the first decorative separator", () => {
  assert.equal(
    cleanSiteName("The Roofing Company North West | Local Roofing Contractor | Manchester"),
    "The Roofing Company North West",
  );
  assert.equal(cleanSiteName("Builders Manchester – Loft Conversion Manchester"), "Builders Manchester");
  assert.equal(cleanSiteName("Dental Elite — Practice Sales & Recruitment"), "Dental Elite");
});

test("an ASCII hyphen is left alone, because names contain them", () => {
  assert.equal(
    cleanSiteName("Roofing in Charlottesville, VA - Vanguard Roofing"),
    "Roofing in Charlottesville, VA - Vanguard Roofing",
  );
});

test("a title with no separator is untouched, suffix and all", () => {
  assert.equal(cleanSiteName("Acme Plumbing Ltd"), "Acme Plumbing Ltd");
  assert.equal(cleanSiteName("Multihull Central"), "Multihull Central");
});

test("a title that cleans to nothing falls back to the domain", async () => {
  const scan = await scanOf(`<html><head><title> | | </title>
    <meta name="description" content="x"><meta name="viewport" content="width=device-width"></head>
    <body><h1>A</h1><a href="/contact">Contact us</a></body></html>`);
  const view = toScanView(scan, detectOpportunity(scan));

  assert.equal(view.siteName, "acme.example");
});

test("no legal suffix is ever invented", async () => {
  const scan = await scanOf(`<html><head>${HEAD}</head><body style="width: 1200px"><h1>A</h1></body></html>`);
  const view = toScanView(scan, detectOpportunity(scan));

  assert.equal(view.siteName, "Acme Roofing");
  assert.doesNotMatch(view.siteName, /\b(Ltd|Limited|Pty|Inc|Group|Solutions)\b/);
});

/* ================================================================== */
/* Discipline that must survive all of the above                       */
/* ================================================================== */

const FORBIDDEN =
  /losing (customers|leads|money|revenue)|lost revenue|conversion rate|ranking|penalt|urgent|guarantee|bloated|hurting/i;

test("no newly supported opportunity produces an unsupported claim", async () => {
  const cases: [string, Record<string, number>][] = [
    [SOUND, { elapsedMs: 6_366 }],
    [SOUND, { bytes: 1_082_939 }],
    [NO_SUBMIT, {}],
  ];
  for (const [html, options] of cases) {
    const text = body(await draftFor(html, options));
    assert.doesNotMatch(text, FORBIDDEN, html.slice(0, 40));
    const words = text.trim().split(/\s+/).length;
    assert.ok(words >= 80 && words <= 170, `${words} words`);
  }
});

test("the same input still produces the same output", async () => {
  const scan = await scanOf(SOUND, { elapsedMs: 6_366 });
  const view = toScanView(scan, detectOpportunity(scan));
  assert.deepEqual(outreachFromView(view), outreachFromView(view));
});

test("analyzePage stays free of the old broad width check", async () => {
  // A page whose only wide thing is an image must produce no mobile finding.
  const result = analyzePage({
    pageUrl: "https://acme.example/",
    finalUrl: "https://acme.example/",
    status: 200,
    headers: {},
    body: `<html><head>${HEAD}</head><body><h1>A</h1><img src="/a.jpg" width="1941" height="1090" alt="a"></body></html>`,
    bytes: 900,
    elapsedMs: 100,
  });
  assert.equal(result.findings.some((f) => f.category === "mobile"), false);
});

test("a rule that fired on three things still states at most two", async () => {
  // medmatch.co.uk: slow response, oversized HTML and a form with no submit.
  // All three are true; an email reciting all three is a report.
  const text = body(await draftFor(NO_SUBMIT, { elapsedMs: 3_007, bytes: 515_385 }));

  const stated = (text.match(/I (also )?noticed/g) ?? []).length;
  assert.ok(stated <= 2, `${stated} observation sentences`);
  assert.equal((text.match(/when I checked/g) ?? []).length <= 1, true, "no doubled 'when I checked'");
});

/* ================================================================== */
/* The response-time boundary for outreach                             */
/* ================================================================== */

test("the scanner still reports slow-response at its own threshold", async () => {
  // The finding is unchanged. Only what it may trigger has moved.
  const below = await scanOf(SOUND, { elapsedMs: 2_999 });
  const above = await scanOf(SOUND, { elapsedMs: 3_001 });

  assert.equal(below.findings.some((f) => f.rule === "slow-response"), false);
  assert.equal(above.findings.some((f) => f.rule === "slow-response"), true);
});

test("a borderline response does not create an opportunity on its own", async () => {
  // medmatch.co.uk measured 3,007ms; vanguardroofingva.com 3,163ms. Both were
  // within noise of the finding's threshold and both produced outreach.
  for (const elapsedMs of [2_999, 3_001, 3_007, 3_163, 3_500, 3_999]) {
    const scan = await scanOf(SOUND, { elapsedMs });
    assert.equal(
      detectOpportunity(scan).opportunity,
      "No Clear Opportunity",
      `${elapsedMs}ms must not justify contact on its own`,
    );
  }
});

test("a response at or past four seconds is a Website Development opportunity", async () => {
  for (const elapsedMs of [4_000, 4_001, 5_000, 6_366]) {
    const scan = await scanOf(SOUND, { elapsedMs });
    const detected = detectOpportunity(scan);

    assert.equal(detected.opportunity, "Website Development", `${elapsedMs}ms`);
    assert.equal(detected.service, "Business websites");
    assert.ok(detected.evidence.some((e) => /Response time:/.test(e)), `${elapsedMs}ms cites the measurement`);
  }
});

test("the boundary itself qualifies, and the millisecond below it does not", async () => {
  assert.equal(detectOpportunity(await scanOf(SOUND, { elapsedMs: 3_999 })).opportunity, "No Clear Opportunity");
  assert.equal(detectOpportunity(await scanOf(SOUND, { elapsedMs: 4_000 })).opportunity, "Website Development");
});

test("a borderline response never reaches the evidence of another opportunity", async () => {
  // The site is oversized AND borderline slow. The email may cite the size;
  // the measurement that is within noise must not be the reason given.
  const scan = await scanOf(SOUND, { elapsedMs: 3_100, bytes: 1_082_939 });
  const detected = detectOpportunity(scan);

  assert.equal(detected.opportunity, "Website Development");
  assert.equal(detected.evidence.some((e) => /Response time:/.test(e)), false);
  assert.ok(detected.evidence.some((e) => /HTML size:/.test(e)));
});

test("the other technical triggers are unaffected by the response gate", async () => {
  const cases: [string, Record<string, number | string>, string][] = [
    [SOUND, { bytes: 1_082_939 }, "oversized-html"],
    [NO_SUBMIT, {}, "form-without-submit-control"],
    [SOUND, { finalUrl: "http://acme.example/" }, "no HTTPS"],
    [`<html><head>${HEAD}</head><body style="width: 1280px"><h1>A</h1></body></html>`, {}, "fixed-width-layout"],
  ];
  for (const [html, options, label] of cases) {
    const scan = await scanOf(html, options);
    assert.equal(detectOpportunity(scan).opportunity, "Website Development", label);
  }
});

test("a qualifying slow response still produces factual outreach", async () => {
  const text = body(await draftFor(SOUND, { elapsedMs: 5_071 }));

  assert.match(text, /took about 5\.1 seconds to respond when I checked/);
  assert.doesNotMatch(text, FORBIDDEN);
  assert.doesNotMatch(text, /your (site|website) is slow/i);
  const words = text.trim().split(/\s+/).length;
  assert.ok(words >= 80 && words <= 170, `${words} words`);
});

test("a missing viewport still triggers regardless of how fast the page was", async () => {
  const noViewport = `<html><head><title>Acme</title><meta name="description" content="x"></head>
    <body><h1>A</h1><a href="/contact">Contact us</a></body></html>`;
  const scan = await scanOf(noViewport, { elapsedMs: 120 });
  assert.equal(detectOpportunity(scan).opportunity, "Website Development");
});
