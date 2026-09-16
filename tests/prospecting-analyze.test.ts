import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyzePage,
  collectAuditLinks,
} from "../src/lib/prospecting/analyze.ts";

const html = `<!doctype html>
<html><head>
  <title>Example services</title>
  <meta name="generator" content="WordPress 6">
  <meta name="robots" content="index,follow">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="https://example.com/">
  <link rel="stylesheet" href="/styles.css">
  <script type="application/ld+json">{invalid json}</script>
</head><body>
  <h1>Example services</h1>
  <p>We help teams work better.</p>
  <img src="/hero.jpg">
  <form><input name="email"></form>
  <a href="/about">About</a>
  <a href="https://external.example/">External</a>
  <a href="/about#team">About again</a>
</body></html>`;

test("analyzePage reports reproducible HTML findings and no invented business claim", () => {
  const result = analyzePage({
    pageUrl: "https://example.com/",
    finalUrl: "https://example.com/",
    status: 200,
    headers: { server: "example" },
    body: html,
    bytes: Buffer.byteLength(html),
    elapsedMs: 42,
  });

  const rules = new Set(result.findings.map((finding) => finding.rule));
  assert.ok(rules.has("missing-meta-description"));
  assert.ok(rules.has("missing-image-alt"));
  assert.ok(rules.has("invalid-structured-data"));
  assert.ok(rules.has("form-without-submit-control"));
  assert.ok(result.technologyIndicators.some((indicator) => indicator.name === "WordPress"));
  assert.equal(result.performance.htmlBytes, Buffer.byteLength(html));
  assert.doesNotMatch(JSON.stringify(result), /losing customers|revenue loss|conversion loss/i);
});

test("collectAuditLinks resolves, deduplicates, and caps links", () => {
  const links = collectAuditLinks("https://example.com/", html);
  assert.deepEqual(
    links.map((link) => link.url),
    ["https://example.com/about", "https://external.example/"],
  );
  assert.equal(links[0]?.sourceUrl, "https://example.com/");
});

test("analysis records response, crawler, resource, and mobile evidence when supplied", () => {
  const result = analyzePage({
    pageUrl: "https://example.com/",
    finalUrl: "https://example.com/",
    status: 404,
    headers: {},
    body: "<html><head><title>A</title><title>B</title><meta name=description content='a'><meta name=description content='b'></head><body><img src='/large.jpg' style='width: 1600px'></body></html>",
    bytes: 600_000,
    elapsedMs: 4_001,
    redirectChain: ["https://example.com/a", "https://example.com/b", "https://example.com/c", "https://example.com/"],
    robotsTxt: { url: "https://example.com/robots.txt", status: 200, body: "not robots" },
    sitemap: { url: "https://example.com/sitemap.xml", status: 200, body: "not xml" },
  });

  const rules = new Set(result.findings.map((finding) => finding.rule));
  for (const rule of [
    "duplicate-title",
    "duplicate-meta-description",
    "http-response-error",
    "slow-response",
    "oversized-html",
    "redirect-chain-too-long",
    "invalid-robots",
    "invalid-sitemap",
    "missing-image-dimensions",
    "fixed-width-layout",
  ]) {
    assert.ok(rules.has(rule), `expected ${rule}`);
  }
});
