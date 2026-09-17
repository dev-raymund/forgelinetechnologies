import { test } from "node:test";
import assert from "node:assert/strict";
import { roleHas } from "../src/lib/auth/capabilities.ts";

/**
 * The capability matrix decides every admin action. The UI hides what a role
 * cannot do, but this is the thing that actually refuses — so it is tested
 * directly rather than only through a browser.
 */

test("admin holds every capability", () => {
  for (const c of [
    "users.manage",
    "posts.manage",
    "works.manage",
    "reviews.manage",
    "inquiries.manage",
    "audit.read",
    "prospecting.manage",
  ] as const) {
    assert.equal(roleHas("admin", c), true, `admin should hold ${c}`);
  }
});

test("editor manages content but never accounts", () => {
  assert.equal(roleHas("editor", "posts.manage"), true);
  assert.equal(roleHas("editor", "works.manage"), true);
  assert.equal(roleHas("editor", "reviews.manage"), true);
  assert.equal(roleHas("editor", "inquiries.manage"), true);

  assert.equal(roleHas("editor", "users.manage"), false, "editors must not manage users");
  assert.equal(roleHas("editor", "audit.read"), false, "the audit log is admin-only");
  assert.equal(roleHas("editor", "prospecting.manage"), false, "prospecting must be admin-only");
});

test("an unknown role holds nothing", () => {
  // A role is a varchar. A typo, or a value written straight into the
  // database, must fail closed rather than be treated as privileged.
  for (const role of ["", "administrator", "ADMIN", "superuser", "owner", "null"]) {
    assert.equal(roleHas(role, "users.manage"), false, `"${role}" should hold nothing`);
    assert.equal(roleHas(role, "posts.manage"), false, `"${role}" should hold nothing`);
  }
});

test("capability names are matched exactly", () => {
  // @ts-expect-error — deliberately not a declared capability
  assert.equal(roleHas("admin", "users.manage "), false);
  // @ts-expect-error — deliberately not a declared capability
  assert.equal(roleHas("admin", "everything"), false);
});

test("media is managed by admins and editors, like posts and works", () => {
  assert.equal(roleHas("admin", "media.manage"), true);
  assert.equal(roleHas("editor", "media.manage"), true);
  assert.equal(roleHas("unknown", "media.manage"), false);
});
