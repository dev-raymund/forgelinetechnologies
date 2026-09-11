import { test } from "node:test";
import assert from "node:assert/strict";
// Relative, not the "@/*" alias: Node's test runner does not read tsconfig
// path mappings.
import {
  inquirySchema,
  formatIssues,
  PROJECT_TYPES,
  BUDGETS,
  TIMELINES,
} from "../src/lib/validation.ts";

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  company: "Analytical Ltd",
  website: "example.com",
  projectType: "Web application",
  budget: "$5,000 – $15,000",
  message: "We need an internal portal for tracking client onboarding.",
  companyWebsite: "",
};

const withOverride = (o: Record<string, unknown>) => ({ ...valid, ...o });

test("accepts a complete valid payload", () => {
  const r = inquirySchema.safeParse(valid);
  assert.equal(r.success, true);
});

test("accepts a payload with only the required fields", () => {
  const r = inquirySchema.safeParse({
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "A short but sufficiently long description of the project.",
  });
  assert.equal(r.success, true);
  // optionals default to empty strings rather than undefined
  if (r.success) {
    assert.equal(r.data.company, "");
    assert.equal(r.data.projectType, "");
  }
});

test("rejects an invalid email and reports it on the email field", () => {
  const r = inquirySchema.safeParse(withOverride({ email: "not-an-email" }));
  assert.equal(r.success, false);
  if (!r.success) {
    assert.equal(formatIssues(r.error).email, "Enter a valid email address.");
  }
});

test("rejects a missing message", () => {
  const r = inquirySchema.safeParse(withOverride({ message: "" }));
  assert.equal(r.success, false);
  if (!r.success) assert.ok(formatIssues(r.error).message);
});

test("rejects a name shorter than two characters", () => {
  const r = inquirySchema.safeParse(withOverride({ name: "A" }));
  assert.equal(r.success, false);
});

test("rejects an over-length message", () => {
  const r = inquirySchema.safeParse(withOverride({ message: "x".repeat(5001) }));
  assert.equal(r.success, false);
});

test("rejects an over-length name", () => {
  const r = inquirySchema.safeParse(withOverride({ name: "x".repeat(151) }));
  assert.equal(r.success, false);
});

test("trims surrounding whitespace", () => {
  const r = inquirySchema.safeParse(withOverride({ name: "  Ada Lovelace  " }));
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.name, "Ada Lovelace");
});

test("accepts a bare domain, a full URL, or no website", () => {
  for (const website of ["example.com", "https://example.com/x", ""]) {
    const r = inquirySchema.safeParse(withOverride({ website }));
    assert.equal(r.success, true, `expected ${JSON.stringify(website)} to pass`);
  }
});

test("rejects a malformed website", () => {
  const r = inquirySchema.safeParse(withOverride({ website: "not a url" }));
  assert.equal(r.success, false);
});

test("accepts every declared project type, and the empty choice", () => {
  for (const projectType of [...PROJECT_TYPES, ""]) {
    const r = inquirySchema.safeParse(withOverride({ projectType }));
    assert.equal(r.success, true, `expected ${projectType || "(empty)"} to pass`);
  }
});

test("accepts every declared budget, and the empty choice", () => {
  for (const budget of [...BUDGETS, ""]) {
    const r = inquirySchema.safeParse(withOverride({ budget }));
    assert.equal(r.success, true, `expected ${budget || "(empty)"} to pass`);
  }
});

test("accepts every declared timeline, and the empty choice", () => {
  for (const timeline of [...TIMELINES, ""]) {
    const r = inquirySchema.safeParse(withOverride({ timeline }));
    assert.equal(r.success, true, `expected ${timeline || "(empty)"} to pass`);
  }
});

test("rejects values outside the declared enums", () => {
  assert.equal(inquirySchema.safeParse(withOverride({ budget: "$1 billion" })).success, false);
  assert.equal(inquirySchema.safeParse(withOverride({ projectType: "Skywriting" })).success, false);
  assert.equal(inquirySchema.safeParse(withOverride({ timeline: "Yesterday" })).success, false);
});

test("a populated honeypot still PARSES — it must not signal detection", () => {
  // The pipeline drops it after parsing. A validation error here would tell
  // a bot it had been caught.
  const r = inquirySchema.safeParse(withOverride({ companyWebsite: "http://spam.example" }));
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.companyWebsite, "http://spam.example");
});
