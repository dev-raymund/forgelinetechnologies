import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertSafeUrl,
  normalizeAuditUrl,
  type HostResolver,
} from "../src/lib/prospecting/url-safety.ts";

const publicResolver: HostResolver = async () => [{ address: "93.184.216.34", family: 4 }];
const privateResolver: HostResolver = async () => [{ address: "10.0.0.7", family: 4 }];

test("normalizes an HTTPS audit URL without a fragment", async () => {
  const result = await normalizeAuditUrl(" HTTPS://Example.com/path#section ", publicResolver);
  assert.equal(result.url, "https://example.com/path");
  assert.equal(result.origin, "https://example.com");
});

test("rejects unsupported schemes and URL credentials", async () => {
  await assert.rejects(() => normalizeAuditUrl("file:///etc/passwd", publicResolver), /HTTP or HTTPS/);
  await assert.rejects(
    () => normalizeAuditUrl("https://user:password@example.com", publicResolver),
    /credentials/,
  );
});

test("rejects a hostname that resolves to a private address", async () => {
  await assert.rejects(
    () => normalizeAuditUrl("https://internal.example", privateResolver),
    /private|unsafe/i,
  );
});

test("rejects loopback, link-local, and reserved IP literals", async () => {
  for (const host of ["127.0.0.1", "[::1]", "169.254.169.254", "192.168.1.20", "224.0.0.1"]) {
    await assert.rejects(
      () => assertSafeUrl(new URL(`https://${host}`), publicResolver),
      /private|unsafe|reserved/i,
      host,
    );
  }
});

test("rejects an unsafe redirect destination before it is fetched", async () => {
  await assert.rejects(
    () => assertSafeUrl(new URL("http://127.0.0.1/admin"), publicResolver),
    /private|unsafe|reserved/i,
  );
});
