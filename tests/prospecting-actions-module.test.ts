/**
 * The shape of the one server-action module.
 *
 * A `"use server"` file turns every export into a callable endpoint, so what
 * it exports is a security surface and not just a style question. Each export
 * must be an async function or a type, and each action must carry its own
 * capability check — a guard on the page is not a guard on the action.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function actions() {
  return readFile(new URL("../src/lib/prospecting/actions.ts", import.meta.url), "utf8");
}

test("the action module is a server module exporting only async functions and types", async () => {
  const source = await actions();

  assert.match(source, /^"use server";/);
  const exported = source.match(/^export .*$/gm) ?? [];
  assert.ok(exported.length > 0, "the module exports something");
  for (const line of exported) {
    assert.match(line, /^export (async function|type) /, line);
  }
});

test("every exported action checks the prospecting capability itself", async () => {
  const source = await actions();
  const names = [...source.matchAll(/^export async function (\w+)/gm)].map((m) => m[1]!);
  assert.ok(names.length >= 7, `expected the active actions, found ${names.join(", ")}`);

  // One `authorise("prospecting.manage")` per exported action.
  const guards = source.match(/authorise\("prospecting\.manage"\)/g) ?? [];
  assert.equal(guards.length, names.length, `${names.length} actions, ${guards.length} guards`);
});

test("no action module reference to a retired qualification concept survives", async () => {
  const source = await actions();
  for (const retired of [
    "qualification",
    "totalScore",
    "primaryOpportunity",
    "scoreAdjustments",
    "opportunityOverride",
    "refreshQualificationSnapshot",
  ]) {
    assert.doesNotMatch(source, new RegExp(retired), retired);
  }
});
