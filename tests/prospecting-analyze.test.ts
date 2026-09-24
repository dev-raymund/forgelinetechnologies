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
    // The fixed width sits on the body, which is what a fixed-width layout
    // means. It used to sit on the image, and the rule fired on that — which
    // was the false positive that twenty real sites exposed.
    body: "<html><head><title>A</title><title>B</title><meta name=description content='a'><meta name=description content='b'></head><body style='width: 1600px'><img src='/large.jpg'></body></html>",
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

function indicatorsFor(body: string) {
  return analyzePage({
    pageUrl: "https://shop.example/",
    finalUrl: "https://shop.example/",
    status: 200,
    headers: {},
    body,
    bytes: Buffer.byteLength(body),
    elapsedMs: 10,
  }).technologyIndicators;
}

test("WooCommerce is detected from its generator tag even after WordPress's", () => {
  // WordPress prints its own generator first, so reading only the first
  // generator tag would never see WooCommerce's.
  const found = indicatorsFor(`<html><head>
    <meta name="generator" content="WordPress 6.6">
    <meta name="generator" content="WooCommerce 9.1.2">
  </head><body></body></html>`);

  assert.deepEqual(
    found.find((indicator) => indicator.name === "WooCommerce"),
    { name: "WooCommerce", signal: "generator:WooCommerce 9.1.2", confidence: "high" },
  );
});

test("WooCommerce is detected from its plugin asset path", () => {
  const found = indicatorsFor(`<html><head>
    <meta name="generator" content="WordPress 6.6">
    <link rel="stylesheet" href="https://shop.example/wp-content/plugins/woocommerce/assets/css/woocommerce.css">
  </head><body></body></html>`);

  assert.deepEqual(
    found.find((indicator) => indicator.name === "WooCommerce"),
    { name: "WooCommerce", signal: "asset-path:/wp-content/plugins/woocommerce/", confidence: "high" },
  );
});

test("a plain WordPress site is not reported as WooCommerce", () => {
  const found = indicatorsFor(`<html><head>
    <meta name="generator" content="WordPress 6.6">
    <script src="/wp-content/plugins/contact-form-7/includes/js/index.js"></script>
  </head><body></body></html>`);

  assert.ok(found.some((indicator) => indicator.name === "WordPress"));
  assert.equal(found.some((indicator) => indicator.name === "WooCommerce"), false);
});

test("an intrinsic image width no longer counts as a fixed-width layout", () => {
  // The exact fixture this file used to assert against. It must now be clean:
  // an image declaring its own size is correct practice, and is what
  // `missing-image-dimensions` asks for.
  const result = analyzePage({
    pageUrl: "https://example.com/",
    finalUrl: "https://example.com/",
    status: 200,
    headers: {},
    body: "<html><head><title>A</title></head><body><img src='/large.jpg' style='width: 1600px' width='1600'></body></html>",
    bytes: 900,
    elapsedMs: 100,
  });

  const rules = new Set(result.findings.map((finding) => finding.rule));
  assert.equal(rules.has("fixed-width-layout"), false);
});
