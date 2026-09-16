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
