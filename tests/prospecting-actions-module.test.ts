import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the server action module does not export non-function values", async () => {
  const source = await readFile(
    new URL("../src/lib/prospecting/actions.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /export const auditEventName/);
});

test("the qualification action module is a server module exporting only async functions", async () => {
  const source = await readFile(
    new URL("../src/lib/prospecting/qualification-actions.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /^"use server";/);
  const exported = source.match(/^export .*$/gm) ?? [];
  assert.ok(exported.length >= 7, "expected the seven qualification actions");
  for (const line of exported) assert.match(line, /^export (async function|type) /, line);
});
