/**
 * The quick/full audit distinction (Phase 2).
 *
 * Quick mode is one primary page fetch and the existing deterministic
 * analysis, and nothing else. These tests are the contract: they count every
 * request the runner makes, so a future change that reintroduces a probe into
 * quick mode fails here rather than in production against someone's website.
 *
 * Full mode keeps the Phase 1 behaviour unchanged.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { runAuditJob, type AuditJobDependencies } from "../src/lib/prospecting/runner.ts";
import { fetchBoundedPage, type BoundedPageResponse } from "../src/lib/prospecting/fetch.ts";
import type { HostResolver } from "../src/lib/prospecting/url-safety.ts";

const HTML = `<!doctype html>
<html><head>
  <title>Harbour Marine Services</title>
  <meta name="description" content="Boat servicing in Sydney.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index,follow">
  <meta name="generator" content="Shopify">
  <link rel="canonical" href="https://harbour.example/">
  <link rel="stylesheet" href="/a.css">
  <link rel="stylesheet" href="/b.css">
  <script type="application/ld+json">{"@type":"LocalBusiness"}</script>
  <script src="/app.js"></script>
</head><body>
  <h1>Harbour Marine Services</h1>
  <img src="/one.jpg" alt="A boat">
  <img src="/two.jpg">
  <img src="/three.jpg">
  <form><button type="submit">Send</button></form>
  <a href="/contact">Contact us</a>
  <a href="/quote">Get a quote</a>
  <a href="https://external.example/">External</a>
</body></html>`;

/** A page with nothing a scanner can find. Exercises the null/false side. */
const SPARSE_HTML = `<html><body><p>Coming soon</p></body></html>`;

function pageResponse(body: string, overrides: Partial<BoundedPageResponse> = {}): BoundedPageResponse {
  return {
    requestedUrl: "https://harbour.example/",
    finalUrl: "https://harbour.example/",
    status: 200,
    headers: { "content-type": "text/html" },
    contentType: "text/html",
    body,
    bytes: Buffer.byteLength(body),
    elapsedMs: 240,
    redirectChain: [],
    ...overrides,
  };
}

/** Records every request the runner makes, by kind. */
function tracking(body = HTML, overrides: Partial<AuditJobDependencies> = {}) {
  const pageFetches: string[] = [];
  const resourceFetches: string[] = [];
  const saved: { persistence?: unknown } = {};

  const dependencies: AuditJobDependencies = {
    markRunning: async () => undefined,
    fetchPage: async (url) => {
      pageFetches.push(url);
      return pageResponse(body);
    },
    fetchResource: async (url) => {
      resourceFetches.push(url);
      return pageResponse("", { finalUrl: url, requestedUrl: url });
    },
    saveResult: async (input) => {
      saved.persistence = input;
    },
    saveFailure: async () => undefined,
    ...overrides,
  };

  return { dependencies, pageFetches, resourceFetches, saved };
}

/* ------------------------------------------------------- 1. quick analyses */

test("quick mode runs the existing deterministic analysis on the primary page", async () => {
  const { dependencies } = tracking();
  const result = await runAuditJob(
    { auditId: 1, requestedUrl: "https://harbour.example/", mode: "quick" },
    dependencies,
  );

  assert.equal(result.status, "completed");
  assert.equal(result.scan.requestedUrl, "https://harbour.example/");
  assert.equal(result.scan.finalUrl, "https://harbour.example/");
  assert.equal(result.scan.httpStatus, 200);
  assert.equal(result.scan.https, true);
  assert.equal(result.scan.responseTimeMs, 240);
});

test("quick mode exposes the observed page facts, not just findings", async () => {
  const { dependencies } = tracking();
  const { scan } = await runAuditJob(
    { auditId: 1, requestedUrl: "https://harbour.example/", mode: "quick" },
    dependencies,
  );

  assert.deepEqual(scan.page, {
    title: "Harbour Marine Services",
    metaDescription: "Boat servicing in Sydney.",
    h1: "Harbour Marine Services",
    canonical: "https://harbour.example/",
    viewport: true,
    robotsMeta: true,
    sitemapLink: false,
    jsonLd: true,
  });
});

test("quick mode counts the conversion and weight signals", async () => {
  const { dependencies } = tracking();
  const { scan } = await runAuditJob(
    { auditId: 1, requestedUrl: "https://harbour.example/", mode: "quick" },
    dependencies,
  );

  assert.deepEqual(scan.signals, {
    forms: 1,
    ctas: 2,
    images: 3,
    imagesWithoutAlt: 2,
    scripts: 2,
    stylesheets: 2,
    htmlBytes: Buffer.byteLength(HTML),
    ecommerce: true,
  });
  assert.deepEqual(scan.technologies, ["Shopify"]);
});

test("an empty page reports absence as null and false, never as invention", async () => {
  const { dependencies } = tracking(SPARSE_HTML);
  const { scan } = await runAuditJob(
    { auditId: 1, requestedUrl: "https://harbour.example/", mode: "quick" },
    dependencies,
  );

  assert.deepEqual(scan.page, {
    title: null,
    metaDescription: null,
    h1: null,
    canonical: null,
    viewport: false,
    robotsMeta: false,
    sitemapLink: false,
    jsonLd: false,
  });
  assert.equal(scan.signals.ecommerce, false);
  assert.deepEqual(scan.technologies, []);
});

/* ------------------------------------------- 2 & 7. quick probes nothing */

test("quick mode fetches the primary page exactly once and nothing else", async () => {
  const { dependencies, pageFetches, resourceFetches } = tracking();
  await runAuditJob(
    { auditId: 1, requestedUrl: "https://harbour.example/", mode: "quick" },
    dependencies,
  );

  assert.deepEqual(pageFetches, ["https://harbour.example/"]);
  assert.deepEqual(resourceFetches, [], "quick mode must not probe any resource");
});

test("quick mode ignores fetchResource even when the caller supplies one", async () => {
  // The production dependencies always carry `fetchResource`. Quick mode must
  // be decided by the mode, never by whether a dependency happens to exist.
  const { dependencies, resourceFetches } = tracking();
  assert.ok(dependencies.fetchResource, "the fixture supplies fetchResource");

  await runAuditJob(
    { auditId: 1, requestedUrl: "https://harbour.example/", mode: "quick" },
    dependencies,
  );

  assert.equal(resourceFetches.length, 0);
});

test("quick mode raises no robots.txt or sitemap.xml finding it did not check", async () => {
  const { dependencies } = tracking();
  const { scan } = await runAuditJob(
    { auditId: 1, requestedUrl: "https://harbour.example/", mode: "quick" },
    dependencies,
  );

  const rules = new Set(scan.findings.map((finding) => finding.rule));
  for (const unchecked of ["missing-robots-txt", "invalid-robots", "missing-sitemap", "invalid-sitemap", "broken-link"]) {
    assert.equal(rules.has(unchecked), false, `${unchecked} was reported without being checked`);
  }
});

/* --------------------------------------------------- 3. full is unchanged */

test("full mode still probes robots.txt, sitemap.xml and the bounded links", async () => {
  const { dependencies, pageFetches, resourceFetches } = tracking();
  await runAuditJob(
    { auditId: 2, requestedUrl: "https://harbour.example/", mode: "full" },
    dependencies,
  );

  assert.deepEqual(pageFetches, ["https://harbour.example/"]);
  assert.ok(resourceFetches.includes("https://harbour.example/robots.txt"));
  assert.ok(resourceFetches.includes("https://harbour.example/sitemap.xml"));
  assert.ok(resourceFetches.includes("https://harbour.example/contact"));
  assert.ok(resourceFetches.includes("https://external.example/"));
  assert.equal(resourceFetches.length, 5, "robots, sitemap and the three discovered links");
});

test("an audit with no mode still runs the full audit, so existing callers are unchanged", async () => {
  const { dependencies, resourceFetches } = tracking();
  await runAuditJob({ auditId: 3, requestedUrl: "https://harbour.example/" }, dependencies);

  assert.ok(resourceFetches.length > 0, "the default must remain the deeper audit");
});

test("full mode still carries the scan projection, so one consumer shape serves both", async () => {
  const { dependencies } = tracking();
  const { scan } = await runAuditJob(
    { auditId: 2, requestedUrl: "https://harbour.example/", mode: "full" },
    dependencies,
  );

  assert.equal(scan.page.title, "Harbour Marine Services");
  assert.equal(scan.signals.ecommerce, true);
});

/* ------------------------------------- 5. deterministic findings survive */

test("quick mode still reports the existing deterministic findings", async () => {
  const { dependencies } = tracking();
  const { scan } = await runAuditJob(
    { auditId: 1, requestedUrl: "https://harbour.example/", mode: "quick" },
    dependencies,
  );

  const rules = new Set(scan.findings.map((finding) => finding.rule));
  assert.ok(rules.has("missing-image-alt"), "per-image alt findings are still produced");
  assert.ok(scan.findings.length > 0);
});

test("a quick scan states observations and never a business conclusion", async () => {
  const { dependencies } = tracking();
  const { scan } = await runAuditJob(
    { auditId: 1, requestedUrl: "https://harbour.example/", mode: "quick" },
    dependencies,
  );

  assert.doesNotMatch(
    JSON.stringify(scan),
    /losing (leads|customers|revenue)|needs (a )?(seo|rebuild|redesign)|poor conversion|conversion rate is/i,
  );
});

/* ------------------------------------------------ 4. URL safety enforced */

test("quick mode still refuses a host that resolves to a private address", async () => {
  const privateResolver: HostResolver = async () => [{ address: "127.0.0.1", family: 4 }];
  const result = await runAuditJob(
    { auditId: 4, requestedUrl: "https://internal.example/", mode: "quick" },
    {
      markRunning: async () => undefined,
      // The production wiring: the real bounded fetch, which asserts safety on
      // the request and on every redirect hop.
      fetchPage: (url) => fetchBoundedPage(url, { resolveHost: privateResolver }),
      saveResult: async () => undefined,
      saveFailure: async () => undefined,
    },
  );

  assert.equal(result.status, "failed");
  assert.match(result.error, /unsafe or private/i);
});

/* ------------------------------------- 6. failures behave as they always did */

test("a failed quick fetch is recorded exactly as the existing audit records one", async () => {
  const calls: string[] = [];
  const result = await runAuditJob(
    { auditId: 5, requestedUrl: "https://harbour.example/", mode: "quick" },
    {
      markRunning: async () => calls.push("running"),
      fetchPage: async () => {
        throw new Error("network unavailable");
      },
      saveResult: async () => calls.push("result"),
      saveFailure: async (_id, detail) => calls.push(`failed:${detail}`),
    },
  );

  assert.equal(result.status, "failed");
  assert.deepEqual(calls, ["running", "failed:network unavailable"]);
});

test("a failed quick scan still returns a usable scan shape carrying the error", async () => {
  const result = await runAuditJob(
    { auditId: 5, requestedUrl: "https://harbour.example/", mode: "quick" },
    {
      markRunning: async () => undefined,
      fetchPage: async () => {
        throw new Error("network unavailable");
      },
      saveResult: async () => undefined,
      saveFailure: async () => undefined,
    },
  );

  assert.equal(result.scan.error, "network unavailable");
  assert.equal(result.scan.requestedUrl, "https://harbour.example/");
  assert.equal(result.scan.finalUrl, null);
  assert.equal(result.scan.httpStatus, null);
  assert.equal(result.scan.https, false);
  assert.deepEqual(result.scan.findings, []);
  assert.deepEqual(result.scan.technologies, []);
});
