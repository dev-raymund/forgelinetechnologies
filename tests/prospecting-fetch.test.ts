import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fetchBoundedPage,
  type FetchOptions,
} from "../src/lib/prospecting/fetch.ts";
import type { HostResolver } from "../src/lib/prospecting/url-safety.ts";

const publicResolver: HostResolver = async () => [{ address: "93.184.216.34", family: 4 }];

function options(fetchImpl: NonNullable<FetchOptions["fetchImpl"]>): FetchOptions {
  return {
    fetchImpl,
    resolveHost: publicResolver,
    timeoutMs: 100,
    maxBytes: 100,
    maxRedirects: 2,
  };
}

test("preserves a successful response and records timing and bytes", async () => {
  const result = await fetchBoundedPage(
    "https://example.com/",
    options(async () => new Response("<html>ok</html>", { status: 200, headers: { "content-type": "text/html" } })),
  );

  assert.equal(result.status, 200);
  assert.equal(result.body, "<html>ok</html>");
  assert.equal(result.finalUrl, "https://example.com/");
  assert.deepEqual(result.redirectChain, []);
  assert.equal(result.bytes, 15);
  assert.ok(result.elapsedMs >= 0);
});

test("follows safe redirects and preserves the chain", async () => {
  const seen: string[] = [];
  const result = await fetchBoundedPage(
    "https://example.com/",
    options(async (input) => {
      const url = String(input);
      seen.push(url);
      if (url === "https://example.com/") {
        return new Response(null, { status: 302, headers: { location: "/home" } });
      }
      return new Response("<html>home</html>", { status: 200, headers: { "content-type": "text/html" } });
    }),
  );

  assert.deepEqual(seen, ["https://example.com/", "https://example.com/home"]);
  assert.deepEqual(result.redirectChain, ["https://example.com/home"]);
  assert.equal(result.finalUrl, "https://example.com/home");
});

test("rejects a response that exceeds the byte limit", async () => {
  await assert.rejects(
    () =>
      fetchBoundedPage(
        "https://example.com/",
        options(
          async () =>
            new Response("x".repeat(101), {
              headers: { "content-type": "text/html" },
            }),
        ),
      ),
    /exceed|byte|size/i,
  );
});

test("rejects unsupported content types before parsing", async () => {
  await assert.rejects(
    () =>
      fetchBoundedPage(
        "https://example.com/",
        options(async () => new Response("%PDF", { status: 200, headers: { "content-type": "application/pdf" } })),
      ),
    /content type/i,
  );
});

test("aborts a fetch that exceeds the timeout", async () => {
  await assert.rejects(
    () =>
      fetchBoundedPage(
        "https://example.com/",
        options((_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
          }),
        ),
      ),
    /timeout|abort/i,
  );
});

/**
 * The default cap, exercised without overriding `maxBytes`. A real audited
 * homepage carries 1.8MB of HTML — 1.36MB of it inside `<head>` — so a cap
 * that refused it made the site unauditable rather than merely heavy, and
 * `analyzePage` never got to score the weight through `oversized-html`.
 */
function defaultCapOptions(fetchImpl: NonNullable<FetchOptions["fetchImpl"]>): FetchOptions {
  return { fetchImpl, resolveHost: publicResolver, timeoutMs: 1_000, maxRedirects: 2 };
}

function htmlOf(bytes: number): string {
  return `<html><body>${"x".repeat(bytes - 26)}</body></html>`;
}

function htmlResponse(body: string): Response {
  return new Response(body, { status: 200, headers: { "content-type": "text/html" } });
}

test("a heavy but realistic page is read whole under the default cap", async () => {
  const body = htmlOf(1_800_000);
  const result = await fetchBoundedPage(
    "https://example.com/",
    defaultCapOptions(async () => htmlResponse(body)),
  );

  assert.equal(result.bytes, 1_800_000);
  assert.equal(result.body.length, 1_800_000);
});

test("the default cap still refuses a response past it", async () => {
  const body = htmlOf(3_500_000);
  await assert.rejects(
    fetchBoundedPage(
      "https://example.com/",
      defaultCapOptions(async () => htmlResponse(body)),
    ),
    /exceeds the 3000000-byte limit/,
  );
});
