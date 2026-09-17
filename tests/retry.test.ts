import assert from "node:assert/strict";
import test from "node:test";
import { describeError, isTransient, withRetry } from "../src/lib/retry.ts";

const noWait = async () => undefined;

/** The shape Neon's HTTP driver throws against a suspended instance. */
function connectTimeout(): Error {
  return new Error("Error connecting to database: TypeError: fetch failed", {
    cause: Object.assign(new Error("Connect Timeout Error"), { code: "UND_ERR_CONNECT_TIMEOUT" }),
  });
}

test("a transient failure is retried until it succeeds", async () => {
  let calls = 0;
  const waits: number[] = [];
  const result = await withRetry(
    async () => {
      calls += 1;
      if (calls < 3) throw connectTimeout();
      return "ok";
    },
    3,
    async (ms) => {
      waits.push(ms);
    },
  );

  assert.equal(result, "ok");
  assert.equal(calls, 3);
  assert.deepEqual(waits, [300, 600]);
});

test("a non-transient failure is thrown at once", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(
      async () => {
        calls += 1;
        throw new Error('relation "prospects" does not exist');
      },
      3,
      noWait,
    ),
    /does not exist/,
  );
  assert.equal(calls, 1);
});

test("retries are bounded and the last error is thrown", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(
      async () => {
        calls += 1;
        throw connectTimeout();
      },
      3,
      noWait,
    ),
    /fetch failed/,
  );
  assert.equal(calls, 3);
});

test("isTransient reads the cause as well as the message", () => {
  assert.equal(isTransient(new Error("query failed", { cause: new Error("ECONNRESET") })), true);
  assert.equal(isTransient(new Error('syntax error at or near "SELEC"')), false);
  assert.equal(isTransient("fetch failed"), false);
});

test("describeError is one line and names the cause", () => {
  assert.equal(
    describeError(connectTimeout()),
    "Error connecting to database: TypeError: fetch failed (cause: Connect Timeout Error)",
  );
  assert.equal(describeError(new Error("line one\n    at stack")), "line one at stack");
  assert.equal(describeError("plain"), "plain");
});
