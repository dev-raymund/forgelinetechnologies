/**
 * The prospecting screen's data (Phase 4).
 *
 * The project has no DOM test harness — every test here is plain `node:test`
 * — so all of the screen's decisions live in `toScanView`, which these tests
 * cover, and the React component is left as a renderer with nothing to decide.
 * What a component cannot be tested for, a component should not contain.
 *
 * Scans are produced by running the real scanner over real HTML, so a view
 * built on a field the scanner does not populate fails here.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { runAuditJob, type AuditJobDependencies } from "../src/lib/prospecting/runner.ts";
import { quickScanDependencies, scanWebsite } from "../src/lib/prospecting/run.ts";
import { failedQuickScan, type QuickScanResult } from "../src/lib/prospecting/quick-scan.ts";
import { detectOpportunity } from "../src/lib/prospecting/opportunity.ts";
import { hostOf, toScanView } from "../src/lib/prospecting/scan-view.ts";
import type { BoundedPageResponse } from "../src/lib/prospecting/fetch.ts";

async function scanOf(
  html: string,
  options: { finalUrl?: string; requestedUrl?: string; status?: number } = {},
): Promise<QuickScanResult> {
  const page: BoundedPageResponse = {
    requestedUrl: options.requestedUrl ?? "https://acme.example/",
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

const viewOf = async (html: string, options = {}) => {
  const scan = await scanOf(html, options);
  return toScanView(scan, detectOpportunity(scan));
};

const HEAD = (extra: string) => `<!doctype html><html><head>${extra}</head>`;

const HEALTHY = `${HEAD(`
  <title>Acme Plumbing — Sydney</title>
  <meta name="description" content="Licensed plumbers.">
  <meta name="viewport" content="width=device-width">`)}
  <body><h1>Acme Plumbing</h1><img src="/a.jpg" alt="Team">
  <form><button type="submit">Send</button></form>
  <a href="/contact">Contact us</a></body></html>`;

const SEO_GAPS = `${HEAD(`<meta name="viewport" content="width=device-width">`)}
  <body><p>Welcome</p><a href="/contact">Contact us</a></body></html>`;

/* ------------------------------------------------------- website identity */

test("the view names the site from its own title, and always shows the domain", async () => {
  const view = await viewOf(HEALTHY);

  // The title reads "Acme Plumbing — Sydney"; the SEO tail is cut off.
  assert.equal(view.siteName, "Acme Plumbing");
  assert.equal(view.domain, "acme.example");
  assert.equal(view.requestedUrl, "https://acme.example/");
  assert.equal(view.finalUrl, "https://acme.example/");
  assert.equal(view.httpStatus, 200);
  assert.equal(view.https, true);
  assert.equal(view.reached, true);
});

test("with no title the view shows the domain rather than inventing a business name", async () => {
  const view = await viewOf(`${HEAD("")}<body><p>Hello</p></body></html>`);

  assert.equal(view.siteName, "acme.example");
  assert.doesNotMatch(view.siteName, /ltd|pty|inc|plumbing/i);
});

test("a redirect is reported as one, with both URLs kept", async () => {
  const view = await viewOf(HEALTHY, {
    requestedUrl: "https://acme.example/",
    finalUrl: "https://www.acme.example/home",
  });

  assert.equal(view.redirected, true);
  assert.equal(view.finalUrl, "https://www.acme.example/home");
  assert.equal(view.domain, "acme.example", "www. is stripped for display");
});

test("hostOf lower-cases, strips www, and survives an unparseable value", () => {
  assert.equal(hostOf("https://WWW.Acme.Example/path"), "acme.example");
  assert.equal(hostOf("https://acme.example"), "acme.example");
  assert.equal(hostOf("not a url"), "");
  assert.equal(hostOf(null), "");
});

/* -------------------------------------------------------- the opportunity */

test("an SEO result carries the opportunity, service, reason and evidence", async () => {
  const view = await viewOf(SEO_GAPS);

  assert.equal(view.opportunity, "SEO");
  assert.equal(view.service, "SEO");
  assert.match(view.reason, /missing a page title, a meta description and an H1/);
  assert.deepEqual(view.evidence, [
    "No page title detected.",
    "No meta description detected.",
    "No H1 detected.",
  ]);
});

test("the reason and evidence are passed through untouched from the detector", async () => {
  const scan = await scanOf(SEO_GAPS);
  const detected = detectOpportunity(scan);
  const view = toScanView(scan, detected);

  assert.equal(view.reason, detected.reason, "the view must not reword the reason");
  assert.deepEqual(view.evidence, detected.evidence, "the view must not edit the evidence");
});

test("a website development result shows the project's own service name", async () => {
  const view = await viewOf(HEALTHY, { finalUrl: "http://acme.example/" });

  assert.equal(view.opportunity, "Website Development");
  assert.equal(view.service, "Business websites");
  assert.equal(view.https, false);
});

/* ------------------------------------------------- no clear opportunity */

test("a clean site shows No Clear Opportunity and no service at all", async () => {
  const view = await viewOf(HEALTHY);

  assert.equal(view.opportunity, "No Clear Opportunity");
  assert.equal(view.service, null, "there must be no service to render");
  assert.deepEqual(view.evidence, []);
  assert.ok(view.reason.length > 0, "a clean result still explains itself");
});

/* ----------------------------------------------------- needs manual review */

test("a failed scan shows Needs Manual Review with no service and nothing invented", () => {
  const scan = failedQuickScan("https://acme.example/", "Fetch exceeded the 10000ms timeout.");
  const view = toScanView(scan, detectOpportunity(scan));

  assert.equal(view.opportunity, "Needs Manual Review");
  assert.equal(view.service, null);
  assert.equal(view.reached, false);
  assert.equal(view.finalUrl, null);
  assert.equal(view.httpStatus, null);
  assert.equal(view.https, false);
  assert.deepEqual(view.quickFindings, [], "a scan that read nothing has nothing to list");
  assert.equal(view.siteName, "acme.example", "the domain still identifies what was attempted");
});

test("a blocked private address reaches the screen as a reviewable result, not a crash", () => {
  const scan = failedQuickScan("https://internal.example/", "Audit URL resolves to an unsafe or private address.");
  const view = toScanView(scan, detectOpportunity(scan));

  assert.equal(view.opportunity, "Needs Manual Review");
  assert.match(view.evidence.join(" "), /unsafe or private/i);
});

/* ----------------------------------------------------------- quick findings */

test("quick findings come from the prepared summary, not from raw findings", async () => {
  const view = await viewOf(SEO_GAPS);

  assert.ok(view.quickFindings.includes("No page title detected."));
  assert.ok(view.quickFindings.length <= 6, "the list stays readable");
  for (const line of view.quickFindings) {
    assert.equal(typeof line, "string");
    assert.doesNotMatch(line, /\{|\}|\[object/, "no raw scanner structure reaches the screen");
  }
});

/* ------------------------------------------------- the scanner boundary */

test("the screen's scan path requests quick mode and probes nothing", async () => {
  const pageFetches: string[] = [];
  const resourceFetches: string[] = [];
  const dependencies: AuditJobDependencies = {
    markRunning: async () => undefined,
    fetchPage: async (url) => {
      pageFetches.push(url);
      return {
        requestedUrl: url,
        finalUrl: url,
        status: 200,
        headers: { "content-type": "text/html" },
        contentType: "text/html",
        body: HEALTHY,
        bytes: Buffer.byteLength(HEALTHY),
        elapsedMs: 100,
        redirectChain: [],
      };
    },
    fetchResource: async (url) => {
      resourceFetches.push(url);
      throw new Error("a quick scan must not probe");
    },
    saveResult: async () => undefined,
    saveFailure: async () => undefined,
  };

  const scan = await scanWebsite("https://acme.example/", dependencies);

  assert.deepEqual(pageFetches, ["https://acme.example/"]);
  assert.deepEqual(resourceFetches, [], "the screen must never trigger the full audit");
  assert.equal(scan.httpStatus, 200);
});

test("the production scan dependencies carry no resource fetcher at all", () => {
  // Belt and braces alongside `mode: "quick"`: with no `fetchResource`, even a
  // future change to the mode branch cannot make this path probe a second URL.
  assert.equal(quickScanDependencies().fetchResource, undefined);
});

test("the scan path writes nothing, so its persistence hooks are inert", async () => {
  const calls: string[] = [];
  await scanWebsite("https://acme.example/", {
    markRunning: async () => {
      calls.push("markRunning");
    },
    fetchPage: async (url) => ({
      requestedUrl: url,
      finalUrl: url,
      status: 200,
      headers: { "content-type": "text/html" },
      contentType: "text/html",
      body: HEALTHY,
      bytes: Buffer.byteLength(HEALTHY),
      elapsedMs: 100,
      redirectChain: [],
    }),
    saveResult: async () => {
      calls.push("saveResult");
    },
    saveFailure: async () => {
      calls.push("saveFailure");
    },
  });

  // The hooks are called; what matters is that the production ones are no-ops,
  // which is what keeps this path free of any database write.
  assert.ok(calls.includes("saveResult"));
  assert.equal(await quickScanDependencies().saveResult({} as never), undefined);
  assert.equal(await quickScanDependencies().markRunning(0), undefined);
});

/* ------------------------------------------------------- claim discipline */

test("no view ever carries a score, band, or a claim the scan cannot support", async () => {
  const views = [
    await viewOf(HEALTHY),
    await viewOf(SEO_GAPS),
    await viewOf(HEALTHY, { finalUrl: "http://acme.example/" }),
    toScanView(
      failedQuickScan("https://acme.example/", "timeout"),
      detectOpportunity(failedQuickScan("https://acme.example/", "timeout")),
    ),
  ];

  for (const view of views) {
    const text = `${view.reason} ${view.evidence.join(" ")} ${view.quickFindings.join(" ")}`;
    assert.doesNotMatch(
      text,
      /losing (leads|customers|money|revenue)|needs a (rebuild|redesign)|hurting|costing them|is bad|poor conversion/i,
    );
    assert.doesNotMatch(JSON.stringify(view), /"score"|"band"|"confidence"|"total"/i);
  }
});
