import assert from "node:assert/strict";
import test from "node:test";
import { runAuditJob } from "../src/lib/prospecting/runner.ts";

const page = {
  requestedUrl: "https://example.com/",
  finalUrl: "https://example.com/",
  status: 200,
  headers: { "content-type": "text/html", server: "test" },
  contentType: "text/html",
  body: "<html><head><title>Example</title><meta name=viewport content=width=device-width></head><body><h1>Example</h1><a href='/contact'>Contact</a></body></html>",
  bytes: 148,
  elapsedMs: 42,
  redirectChain: [],
};

test("runAuditJob persists observed findings and no score at all", async () => {
  const calls: string[] = [];
  let saved: Record<string, unknown> | undefined;
  const result = await runAuditJob(
    { auditId: 7, requestedUrl: "https://example.com/" },
    {
      markRunning: async (id) => calls.push(`running:${id}`),
      fetchPage: async () => page,
      saveResult: async (input) => {
        calls.push(`result:${input.id}`);
        saved = input as unknown as Record<string, unknown>;
      },
      saveFailure: async () => calls.push("failed"),
    },
  );

  assert.equal(result.status, "completed");
  assert.deepEqual(calls, ["running:7", "result:7"]);
  assert.ok(Array.isArray(saved?.findings));
  // The audit records observations. It no longer produces points of any kind.
  assert.equal("scores" in (saved ?? {}), false);
  assert.equal("totalScore" in (saved ?? {}), false);
});

test("runAuditJob records a bounded failure and does not emit a partial report", async () => {
  const calls: string[] = [];
  const result = await runAuditJob(
    { auditId: 9, requestedUrl: "https://example.com/" },
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
