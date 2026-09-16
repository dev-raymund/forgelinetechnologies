import assert from "node:assert/strict";
import test from "node:test";
import { classifyContact } from "../src/lib/prospecting/contact.ts";

test("role-based mailboxes are accepted and normalized", () => {
  for (const local of ["info", "hello", "contact", "enquiries", "sales", "office"]) {
    const result = classifyContact(`${local}@Example.com`);
    assert.deepEqual(result, { ok: true, kind: "role-email", value: `${local}@example.com` });
  }
});

test("a named individual is rejected with a reason the reviewer can act on", () => {
  const result = classifyContact("jane.smith@example.com");
  assert.equal(result.ok, false);
  assert.match(result.ok === false ? result.reason : "", /Named-individual/);
});

test("contact pages and switchboard numbers are accepted", () => {
  assert.deepEqual(classifyContact("https://example.com/contact"), {
    ok: true,
    kind: "url",
    value: "https://example.com/contact",
  });
  assert.deepEqual(classifyContact("+61 2 9000 1234"), {
    ok: true,
    kind: "phone",
    value: "+61 2 9000 1234",
  });
});

test("anything else is rejected rather than guessed at", () => {
  assert.equal(classifyContact("").ok, false);
  assert.equal(classifyContact("   ").ok, false);
  assert.equal(classifyContact("ask for Dave").ok, false);
  assert.equal(classifyContact("info@nodomain").ok, false);
  assert.equal(classifyContact("ftp://example.com").ok, false);
});
