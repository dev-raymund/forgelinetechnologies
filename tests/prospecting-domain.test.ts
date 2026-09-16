import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDomain, websiteUrlForDomain } from "../src/lib/prospecting/domain.ts";

test("normalizeDomain reduces a business URL to its deduplication key", () => {
  assert.equal(normalizeDomain("https://www.Example.com/contact?x=1"), "example.com");
  assert.equal(normalizeDomain("example.com"), "example.com");
  assert.equal(normalizeDomain("  HTTP://EXAMPLE.COM:8080/  "), "example.com");
  assert.equal(normalizeDomain("sub.example.co.uk"), "sub.example.co.uk");
  assert.equal(normalizeDomain("example.com."), "example.com");
  assert.equal(normalizeDomain("EXAMPLE.COM.."), "example.com");
  assert.equal(normalizeDomain("my-firm.co.nz"), "my-firm.co.nz");
});

test("normalizeDomain rejects what the audit engine cannot treat as a business site", () => {
  assert.equal(normalizeDomain(""), null);
  assert.equal(normalizeDomain("   "), null);
  assert.equal(normalizeDomain("localhost"), null);
  assert.equal(normalizeDomain("ftp://example.com"), null);
  assert.equal(normalizeDomain("mailto:info@example.com"), null);
  assert.equal(normalizeDomain("https://user:pass@example.com"), null);
  assert.equal(normalizeDomain("192.168.0.1"), null);
  assert.equal(normalizeDomain("https://[::1]/"), null);
  assert.equal(normalizeDomain("not a domain"), null);
  assert.equal(normalizeDomain("example..com"), null);
  assert.equal(normalizeDomain("-example.com"), null);
  assert.equal(normalizeDomain("example-.com"), null);
  assert.equal(normalizeDomain(".example.com"), null);
});

test("websiteUrlForDomain produces the canonical URL handed to the audit engine", () => {
  assert.equal(websiteUrlForDomain("example.com"), "https://example.com/");
});
