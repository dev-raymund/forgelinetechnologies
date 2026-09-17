# Prospecting Phase 3 — Prospect Qualification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn an audited prospect into a reviewed qualification: an evidence-backed 100-point score, primary and secondary opportunities, a score band with its required action, and a reversible reviewer decision (Qualified or Dismissed).

**Architecture:** A pure `qualifyProspect` recomputes everything from three stored inputs: the latest usable audit's findings and technology indicators, the prospect's own fields (scored by the fixed rules in `fit.ts`), and reviewer adjustments and an opportunity override kept as jsonb on `prospects`. A database module loads those inputs, writes the list's `total_score` / `primary_opportunity` snapshot on every path that can change them, and stores the decision in its own columns. New server actions and a Qualification panel on the prospect detail page expose it, and the list gains Band and Decision columns and filters.

**Tech Stack:** Next.js 16 App Router, TypeScript, Neon PostgreSQL, Drizzle ORM 0.45, `node:test` with `--experimental-strip-types`. No new runtime dependencies.

**Spec:** [`docs/superpowers/specs/2026-09-17-prospecting-phase3-design.md`](../specs/2026-09-17-prospecting-phase3-design.md)

## Global Constraints

- **No new runtime dependencies.**
- **Never fabricate.** No score comes from inference over free text. Anything a rule cannot match scores 0 and says why.
- **No personal data.** The decision-maker adjustment asks for a role and where the company publishes it, never a person's name. Reasons are capped at 300 characters.
- **Imports:** modules under `src/lib/prospecting/`, `src/db/` and `scripts/` use relative imports with explicit `.ts` extensions (`from "./fit.ts"`). `src/lib/retry.ts` imports nothing. Files under `src/app/` and `src/components/`, `src/lib/queries.ts`, and `"use server"` action modules use the `@/` alias without extensions.
- **Tests:** `node:test` + `node:assert/strict`, one file per module in `tests/`, no Neon and no network in any test. A test imports source with an explicit `.ts` extension.
- **Additive migration only.** No existing column is altered and no table is dropped. **No task applies migration 0003 to any database.** The controller asks the owner first.
- **The decision lives in its own columns.** A snapshot write touches only `total_score` and `primary_opportunity`, never `status`, `suppressed_at` or the decision columns.
- **Every new server action** authorises `prospecting.manage`, validates its input on the server, writes `audit_logs`, and revalidates both `/admin/prospecting/prospects` and `/admin/prospecting/prospects/<id>`.
- **Commit style:** plain imperative sentence case, no `feat:` prefix. Commit with two `-m` flags, the second being exactly `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- **Do not push, merge, or touch `main`.**
- **Baseline:** 114 tests pass before Task 1. Use `npm test`, `npx tsc --noEmit` and `npm run lint` after every task. Run `npm run build` after Tasks 9 and 10.

## File map

| File | Responsibility | Task |
| --- | --- | --- |
| `src/lib/retry.ts` (new) | Import-free `withRetry`, `isTransient`, `describeError` | 1 |
| `src/lib/queries.ts` | Re-exports `withRetry` from `@/lib/retry` | 1 |
| `scripts/drain-prospecting.mts` | One readable failure line | 1 |
| `src/lib/prospecting/analyze.ts` | WooCommerce detection | 2 |
| `src/lib/prospecting/fit.ts` (new) | Business-fit and contact rules | 3 |
| `src/lib/prospecting/types.ts` | `OPPORTUNITIES`, component keys, adjustment, override and decision types | 4 |
| `src/lib/prospecting/score.ts` | Exports `CAPS`, `MIN_FINDING_TOTAL`, `pointsForFinding`, `componentFor`, `classify` | 4 |
| `src/lib/prospecting/qualify.ts` (new) | Pure `qualifyProspect`, `COMPONENTS`, `BANDS`, `bandFor`, `qualificationSnapshot` | 4 |
| `src/lib/prospecting/review-input.ts` (new) | Server-side validation of reviewer input | 5 |
| `src/db/schema.ts`, `drizzle/0003_prospect_qualification.sql`, `src/lib/auth/audit.ts` | Columns, migration, audit actions | 6 |
| `src/lib/prospecting/qualification.ts` (new) | Load inputs, refresh the snapshot, write adjustments, override, decision | 7 |
| `src/lib/prospecting/queue.ts`, `prospects.ts`, `actions.ts`, `import-form.tsx` | Refresh after audit and re-import | 7 |
| `scripts/requalify-prospects.mts` (new) | One-off and after-rule-change snapshot backfill | 7 |
| `src/lib/prospecting/queue.ts`, `prospects.ts` | Dismissed guard on enqueue; decision and band list filters | 8 |
| `src/lib/prospecting/qualification-actions.ts` (new) | Seven `"use server"` actions | 9 |
| `src/components/admin/prospecting/qualification-panel.tsx`, `score-adjust-controls.tsx`, `opportunity-controls.tsx`, `decision-controls.tsx` (new) | Detail-page UI | 9 |
| `src/app/admin/prospecting/prospects/[id]/page.tsx`, `src/components/admin/ui.tsx` | Detail page wiring, status tones | 9 |
| `src/app/admin/prospecting/prospects/page.tsx`, `docs/prospecting-engine.md` | List columns and filters, docs | 10 |

---

### Task 1: Retry outside `server-only`, and a drain CLI that survives a cold database

**Files:**
- Create: `src/lib/retry.ts`
- Modify: `src/lib/queries.ts:1-45`
- Modify: `src/lib/prospecting/queue.ts` (the three drain reads)
- Modify: `scripts/drain-prospecting.mts`
- Test: `tests/retry.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `withRetry<T>(fn: () => Promise<T>, attempts?: number, wait?: (ms: number) => Promise<void>): Promise<T>`, `isTransient(err: unknown): boolean`, `describeError(error: unknown): string`, all from `src/lib/retry.ts`. `@/lib/queries` keeps exporting `withRetry`.

- [ ] **Step 1: Write the failing test**

Create `tests/retry.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types tests/retry.test.ts`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/lib/retry.ts`.

- [ ] **Step 3: Create `src/lib/retry.ts`**

```ts
/**
 * Retries for Neon cold starts.
 *
 * This lives in its own import-free module so the plain-Node CLIs can use it.
 * `src/lib/queries.ts` is `server-only`, which only Next.js can import, and a
 * CLI that imports it fails before it runs.
 *
 * Neon's serverless tier suspends after inactivity, and the first query
 * against a cold instance can exceed the driver's connect timeout. Those
 * failures are transient, so retry them briefly.
 *
 * Only connection-level failures retry. A genuine SQL error throws
 * immediately, because retrying bad SQL just delays the same failure.
 */
const TRANSIENT =
  /fetch failed|ConnectTimeout|UND_ERR_CONNECT_TIMEOUT|ECONNRESET|ETIMEDOUT|socket hang up|terminated/i;

export function isTransient(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const cause = (err as { cause?: unknown }).cause;
  const source = (err as { sourceError?: unknown }).sourceError;
  return TRANSIENT.test(
    [err.message, err.name, String(cause ?? ""), String(source ?? "")].join(" "),
  );
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  wait: (ms: number) => Promise<void> = sleep,
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isTransient(err) || i === attempts - 1) throw err;
      // 300ms, then 600ms — enough for a suspended instance to wake.
      await wait(300 * 2 ** i);
    }
  }
  throw last;
}

/**
 * One line an operator can act on. Neon wraps the real cause, usually a
 * connect timeout, inside a generic "fetch failed", so the cause is named
 * alongside the message rather than left in a stack trace.
 */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error).replace(/\s+/g, " ").trim();
  const { cause, sourceError } = error as { cause?: unknown; sourceError?: unknown };
  const inner = cause ?? sourceError;
  const innerText =
    inner instanceof Error ? inner.message : inner === undefined || inner === null ? "" : String(inner);
  const text =
    innerText && !error.message.includes(innerText)
      ? `${error.message} (cause: ${innerText})`
      : error.message;
  return text.replace(/\s+/g, " ").trim();
}
```

- [ ] **Step 4: Point `src/lib/queries.ts` at it**

Replace lines 1-45 of `src/lib/queries.ts` (from `import "server-only";` down to the closing `}` of `withRetry`) with:

```ts
import "server-only";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { getDb, projects, posts, inquiries, type Project, type Post } from "@/db";
import { withRetry } from "@/lib/retry";

/**
 * `withRetry` lives in `@/lib/retry` so the plain-Node CLIs can import it.
 * It is re-exported here because every page already imports it from this
 * module.
 */
export { withRetry };
```

Leave the rest of the file unchanged.

- [ ] **Step 5: Retry the drain's reads, and only its reads**

In `src/lib/prospecting/queue.ts`, add `import { withRetry } from "../retry.ts";` after the existing imports. Then wrap exactly these three reads. Writes stay unwrapped: the claim is a compare-and-swap, and retrying a write whose first attempt may already have committed would turn one audit into a lost claim.

In `listQueuedAuditIds`, replace `const rows = await getDb()` … `.limit(limit);` with:

```ts
      const rows = await withRetry(() =>
        getDb()
          .select({ id: prospectAudits.id })
          .from(prospectAudits)
          .where(
            or(
              eq(prospectAudits.status, "queued"),
              and(
                eq(prospectAudits.status, "running"),
                lt(prospectAudits.startedAt, new Date(Date.now() - STALE_CLAIM_MS)),
              ),
            ),
          )
          .orderBy(asc(prospectAudits.id))
          .limit(limit),
      );
```

In `claimAudit`, replace the first `const [row] = await getDb()` … `.limit(1);` with:

```ts
      const [row] = await withRetry(() =>
        getDb()
          .select({
            requestedUrl: prospectAudits.requestedUrl,
            prospectId: prospectAudits.prospectId,
            status: prospectAudits.status,
            startedAt: prospectAudits.startedAt,
          })
          .from(prospectAudits)
          .where(eq(prospectAudits.id, id))
          .limit(1),
      );
```

In `applyResult`, replace `const [prospect] = await getDb()` … `.limit(1);` with:

```ts
      const [prospect] = await withRetry(() =>
        getDb()
          .select({ suppressedAt: prospects.suppressedAt })
          .from(prospects)
          .where(eq(prospects.id, prospectId))
          .limit(1),
      );
```

- [ ] **Step 6: Make the CLI fail in one readable line**

Replace everything in `scripts/drain-prospecting.mts` from `import { drainAuditQueue }` to the end of the file with:

```ts
import { drainAuditQueue } from "../src/lib/prospecting/drain.ts";
import { productionDrainDependencies } from "../src/lib/prospecting/queue.ts";
import { describeError } from "../src/lib/retry.ts";

const flag = process.argv.indexOf("--limit");
const limit = flag === -1 ? 500 : Number(process.argv[flag + 1]);

if (!Number.isSafeInteger(limit) || limit < 1) {
  console.error("--limit must be a positive whole number");
  process.exit(1);
}

console.log(`Draining up to ${limit} queued audits. Ctrl-C to stop.`);

try {
  const summary = await drainAuditQueue(
    { limit, budgetMs: Number.MAX_SAFE_INTEGER, perAuditMs: 0, pauseMs: 2_000 },
    productionDrainDependencies(),
  );

  console.log(
    `Done: ${summary.completed} completed, ${summary.failed} failed, ` +
      `${summary.skipped} already claimed (stopped: ${summary.stoppedBecause}).`,
  );
} catch (error) {
  // The reads have already been retried. What reaches here is a real failure,
  // and the operator needs its cause, not a stack trace.
  console.error(`Drain stopped: ${describeError(error)}`);
  process.exitCode = 1;
}
```

Keep the file's opening doc comment.

- [ ] **Step 7: Run the checks**

Run: `node --test --experimental-strip-types tests/retry.test.ts`
Expected: PASS, 5 tests.

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: 119 tests pass; typecheck and lint exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/lib/retry.ts src/lib/queries.ts src/lib/prospecting/queue.ts scripts/drain-prospecting.mts tests/retry.test.ts
git commit -m "Retry the drain's reads so the CLI survives a cold database" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Detect WooCommerce

**Files:**
- Modify: `src/lib/prospecting/analyze.ts:126-148` (`technologyIndicators`)
- Test: `tests/prospecting-analyze.test.ts` (append)

**Interfaces:**
- Consumes: nothing new.
- Produces: `analyzePage(...).technologyIndicators` may now include `{ name: "WooCommerce", signal: "generator:<content>" | "asset-path:/wp-content/plugins/woocommerce/", confidence: "high" }`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/prospecting-analyze.test.ts`:

```ts
function indicatorsFor(body: string) {
  return analyzePage({
    pageUrl: "https://shop.example/",
    finalUrl: "https://shop.example/",
    status: 200,
    headers: {},
    body,
    bytes: Buffer.byteLength(body),
    elapsedMs: 10,
  }).technologyIndicators;
}

test("WooCommerce is detected from its generator tag even after WordPress's", () => {
  // WordPress prints its own generator first, so reading only the first
  // generator tag would never see WooCommerce's.
  const found = indicatorsFor(`<html><head>
    <meta name="generator" content="WordPress 6.6">
    <meta name="generator" content="WooCommerce 9.1.2">
  </head><body></body></html>`);

  assert.deepEqual(
    found.find((indicator) => indicator.name === "WooCommerce"),
    { name: "WooCommerce", signal: "generator:WooCommerce 9.1.2", confidence: "high" },
  );
});

test("WooCommerce is detected from its plugin asset path", () => {
  const found = indicatorsFor(`<html><head>
    <meta name="generator" content="WordPress 6.6">
    <link rel="stylesheet" href="https://shop.example/wp-content/plugins/woocommerce/assets/css/woocommerce.css">
  </head><body></body></html>`);

  assert.deepEqual(
    found.find((indicator) => indicator.name === "WooCommerce"),
    { name: "WooCommerce", signal: "asset-path:/wp-content/plugins/woocommerce/", confidence: "high" },
  );
});

test("a plain WordPress site is not reported as WooCommerce", () => {
  const found = indicatorsFor(`<html><head>
    <meta name="generator" content="WordPress 6.6">
    <script src="/wp-content/plugins/contact-form-7/includes/js/index.js"></script>
  </head><body></body></html>`);

  assert.ok(found.some((indicator) => indicator.name === "WordPress"));
  assert.equal(found.some((indicator) => indicator.name === "WooCommerce"), false);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test --experimental-strip-types tests/prospecting-analyze.test.ts`
Expected: the two detection tests FAIL (`undefined` is not the expected indicator). The plain-WordPress test passes.

- [ ] **Step 3: Add the detection**

In `src/lib/prospecting/analyze.ts`, inside `technologyIndicators`, insert this block directly after the Shopify `if` block:

```ts
  // WordPress prints its own generator tag first, so every generator tag is
  // read here: `attr()` on the selection above returns only the first.
  const wooGenerator = $("meta[name='generator']")
    .map((_, element) => $(element).attr("content") ?? "")
    .get()
    .find((content) => content.toLowerCase().includes("woocommerce"));
  const wooAsset =
    $(
      "script[src*='/wp-content/plugins/woocommerce/'], link[href*='/wp-content/plugins/woocommerce/']",
    ).length > 0;
  if (wooGenerator) {
    indicators.push({ name: "WooCommerce", signal: `generator:${wooGenerator}`, confidence: "high" });
  } else if (wooAsset) {
    indicators.push({
      name: "WooCommerce",
      signal: "asset-path:/wp-content/plugins/woocommerce/",
      confidence: "high",
    });
  }
```

- [ ] **Step 4: Run the checks**

Run: `node --test --experimental-strip-types tests/prospecting-analyze.test.ts`
Expected: PASS.

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: 122 tests pass; typecheck and lint exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/prospecting/analyze.ts tests/prospecting-analyze.test.ts
git commit -m "Detect WooCommerce from its generator tag or plugin assets" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---
### Task 3: Business-fit and contact rules

**Files:**
- Create: `src/lib/prospecting/fit.ts`
- Test: `tests/prospecting-fit.test.ts`

**Interfaces:**
- Consumes: `classifyContact(raw: string): ContactResult` and `type ContactKind` from `src/lib/prospecting/contact.ts`.
- Produces: `type RuleScore = { points: number; evidence: string[] }`, `normalizeIndustry(raw: string): string`, `targetIndustry(raw: string): string | null`, `scoreBusinessFit(p: { country: string; industry: string }): RuleScore`, `scoreContact(p: { contactChannel: string; contactProvenance: string }): RuleScore`, `REVIEWER_ONLY_ROLE: string`.

- [ ] **Step 1: Write the failing test**

Create `tests/prospecting-fit.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  REVIEWER_ONLY_ROLE,
  normalizeIndustry,
  scoreBusinessFit,
  scoreContact,
  targetIndustry,
} from "../src/lib/prospecting/fit.ts";

// Copied from the spec rather than imported, so a silent edit to the table in
// code fails here.
const SYNONYMS: [string, string[]][] = [
  ["Accounting", ["accounting", "accountant", "accountants", "accountancy", "bookkeeping", "tax accounting"]],
  ["Real estate", ["real estate", "property", "property management", "realty", "estate agents", "real estate agency"]],
  ["Recruitment", ["recruitment", "recruiting", "recruitment agency", "staffing", "employment agency"]],
  ["Consulting", ["consulting", "consultancy", "management consulting"]],
  ["Professional services", ["professional services"]],
  ["Construction", ["construction", "builders", "building contractors", "civil construction"]],
  ["Healthcare", ["healthcare", "health care", "medical", "medical practice", "dental", "allied health"]],
  ["Education", ["education", "training", "tutoring", "schools", "higher education"]],
];

test("every target market scores 5 and names the market", () => {
  const markets: [string, string][] = [
    ["AU", "Australia"],
    ["GB", "United Kingdom"],
    ["UK", "United Kingdom"],
    ["US", "United States"],
    ["CA", "Canada"],
  ];
  for (const [code, name] of markets) {
    const result = scoreBusinessFit({ country: code, industry: "" });
    assert.equal(result.points, 5, code);
    assert.equal(result.evidence[0], `${code} — target market (${name})`);
  }
});

test("a non-target or missing country scores 0 and says why", () => {
  assert.deepEqual(scoreBusinessFit({ country: "FR", industry: "" }).evidence[0], "FR — not a target market");
  assert.equal(scoreBusinessFit({ country: "FR", industry: "" }).points, 0);
  assert.deepEqual(scoreBusinessFit({ country: "", industry: "" }).evidence[0], "no country recorded");
  assert.equal(scoreBusinessFit({ country: "", industry: "" }).points, 0);
});

test("every canonical industry and every synonym matches", () => {
  for (const [canonical, synonyms] of SYNONYMS) {
    assert.equal(targetIndustry(canonical), canonical, canonical);
    for (const synonym of synonyms) assert.equal(targetIndustry(synonym), canonical, synonym);
  }
});

test("case, whitespace and punctuation do not stop a match", () => {
  assert.equal(normalizeIndustry("  ACCOUNTANTS. "), "accountants");
  assert.equal(targetIndustry("  ACCOUNTANTS. "), "Accounting");
  assert.equal(targetIndustry("Real   Estate"), "Real estate");
  assert.equal(targetIndustry("Health-care"), "Healthcare");
  assert.equal(targetIndustry("Property Management!"), "Real estate");
  assert.equal(targetIndustry("Building   Contractors,"), "Construction");
});

test("near-misses never match: there is no substring or keyword matching", () => {
  for (const industry of [
    "Rebuild Church Ministries",
    "Accounting software",
    "Construction supplies",
    "Bookkeeping & tax",
    "",
  ]) {
    assert.equal(targetIndustry(industry), null, industry);
  }
});

test("industry evidence quotes what was recorded", () => {
  assert.deepEqual(scoreBusinessFit({ country: "AU", industry: "Accountants" }), {
    points: 10,
    evidence: ["AU — target market (Australia)", "'Accountants' → Accounting"],
  });
  assert.equal(
    scoreBusinessFit({ country: "AU", industry: "Bookkeeping & tax" }).evidence[1],
    "'Bookkeeping & tax' — industry not recognised",
  );
  assert.equal(scoreBusinessFit({ country: "AU", industry: "" }).evidence[1], "no industry recorded");
});

test("a classified channel with provenance earns 5", () => {
  assert.deepEqual(
    scoreContact({ contactChannel: "info@acme.com.au", contactProvenance: "website footer" }),
    { points: 5, evidence: ["role email info@acme.com.au — website footer", REVIEWER_ONLY_ROLE] },
  );
  assert.equal(
    scoreContact({ contactChannel: "https://acme.com.au/contact", contactProvenance: "site navigation" }).evidence[0],
    "contact page https://acme.com.au/contact — site navigation",
  );
  assert.equal(
    scoreContact({ contactChannel: "+61 7 3000 0000", contactProvenance: "contact page" }).evidence[0],
    "phone +61 7 3000 0000 — contact page",
  );
});

test("a channel without provenance, empty, or no longer classifying earns nothing", () => {
  assert.deepEqual(scoreContact({ contactChannel: "info@acme.com.au", contactProvenance: " " }), {
    points: 0,
    evidence: ["contact channel has no recorded provenance", REVIEWER_ONLY_ROLE],
  });
  assert.deepEqual(scoreContact({ contactChannel: "", contactProvenance: "footer" }), {
    points: 0,
    evidence: ["no public contact channel recorded", REVIEWER_ONLY_ROLE],
  });

  const named = scoreContact({ contactChannel: "jane.smith@acme.com.au", contactProvenance: "footer" });
  assert.equal(named.points, 0);
  assert.match(named.evidence[0]!, /^stored contact no longer qualifies: /);
  // The evidence explains the rule without repeating a named person's address.
  assert.doesNotMatch(named.evidence.join(" "), /jane/i);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types tests/prospecting-fit.test.ts`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `fit.ts`.

- [ ] **Step 3: Create `src/lib/prospecting/fit.ts`**

```ts
/**
 * Business fit and decision-maker availability.
 *
 * Both are scored by fixed rules over the prospect's own record, never by
 * inference from free text. Anything a rule cannot match scores 0 and says
 * why, so a reviewer can award it with a reason instead.
 */
import { classifyContact, type ContactKind } from "./contact.ts";

export type RuleScore = { points: number; evidence: string[] };

/** `UK` sits beside `GB`: Phase 2 stores the two letters as typed, and `UK` is what people type. */
const TARGET_MARKETS = new Map([
  ["AU", "Australia"],
  ["GB", "United Kingdom"],
  ["UK", "United Kingdom"],
  ["US", "United States"],
  ["CA", "Canada"],
]);

/**
 * The target industries from the project's CLAUDE.md, each with the exact
 * values accepted after `normalizeIndustry`. Matching is by whole string only:
 * "Rebuild Church Ministries" must never score as Construction. Extending the
 * table is a one-line reviewed change.
 */
const INDUSTRY_SYNONYMS: Record<string, readonly string[]> = {
  Accounting: ["accounting", "accountant", "accountants", "accountancy", "bookkeeping", "tax accounting"],
  "Real estate": ["real estate", "property", "property management", "realty", "estate agents", "real estate agency"],
  Recruitment: ["recruitment", "recruiting", "recruitment agency", "staffing", "employment agency"],
  Consulting: ["consulting", "consultancy", "management consulting"],
  "Professional services": ["professional services"],
  Construction: ["construction", "builders", "building contractors", "civil construction"],
  Healthcare: ["healthcare", "health care", "medical", "medical practice", "dental", "allied health"],
  Education: ["education", "training", "tutoring", "schools", "higher education"],
};

const CANONICAL_BY_SYNONYM = new Map(
  Object.entries(INDUSTRY_SYNONYMS).flatMap(([canonical, synonyms]) =>
    synonyms.map((synonym) => [synonym, canonical] as const),
  ),
);

const CONTACT_LABEL: Record<ContactKind, string> = {
  "role-email": "role email",
  url: "contact page",
  phone: "phone",
};

/** Why contact can never reach 10 on its own. */
export const REVIEWER_ONLY_ROLE = "the other 5 need a reviewer to confirm a published decision-making role";

/** Lower-cased, punctuation other than `&` removed, whitespace collapsed and trimmed. */
export function normalizeIndustry(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s&]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function targetIndustry(raw: string): string | null {
  return CANONICAL_BY_SYNONYM.get(normalizeIndustry(raw)) ?? null;
}

export function scoreBusinessFit(prospect: { country: string; industry: string }): RuleScore {
  const evidence: string[] = [];
  let points = 0;

  const country = prospect.country.trim().toUpperCase();
  const market = TARGET_MARKETS.get(country);
  if (!country) {
    evidence.push("no country recorded");
  } else if (market) {
    points += 5;
    evidence.push(`${country} — target market (${market})`);
  } else {
    evidence.push(`${country} — not a target market`);
  }

  const industry = prospect.industry.trim();
  const canonical = industry ? targetIndustry(industry) : null;
  if (!industry) {
    evidence.push("no industry recorded");
  } else if (canonical) {
    points += 5;
    evidence.push(`'${industry}' → ${canonical}`);
  } else {
    evidence.push(`'${industry}' — industry not recognised`);
  }

  return { points, evidence };
}

/**
 * A public business channel earns 5. The channel is re-classified at read
 * time, so a bad value that somehow reached the database earns nothing. The
 * other 5 are never automatic: a generic `info@` must not pretend to reach a
 * decision-maker.
 */
export function scoreContact(prospect: { contactChannel: string; contactProvenance: string }): RuleScore {
  const channel = prospect.contactChannel.trim();
  const provenance = prospect.contactProvenance.trim();

  if (!channel) return { points: 0, evidence: ["no public contact channel recorded", REVIEWER_ONLY_ROLE] };
  if (!provenance) {
    return { points: 0, evidence: ["contact channel has no recorded provenance", REVIEWER_ONLY_ROLE] };
  }

  const classified = classifyContact(channel);
  if (!classified.ok) {
    // `reason` describes the rule and never echoes the stored value.
    return {
      points: 0,
      evidence: [`stored contact no longer qualifies: ${classified.reason}`, REVIEWER_ONLY_ROLE],
    };
  }

  return {
    points: 5,
    evidence: [`${CONTACT_LABEL[classified.kind]} ${classified.value} — ${provenance}`, REVIEWER_ONLY_ROLE],
  };
}
```

- [ ] **Step 4: Run the checks**

Run: `node --test --experimental-strip-types tests/prospecting-fit.test.ts`
Expected: PASS, 8 tests.

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: 130 tests pass; typecheck and lint exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/prospecting/fit.ts tests/prospecting-fit.test.ts
git commit -m "Score business fit and contact by fixed rules" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: The pure qualification model

**Files:**
- Modify: `src/lib/prospecting/types.ts` (append)
- Modify: `src/lib/prospecting/score.ts` (export helpers; no behaviour change)
- Create: `src/lib/prospecting/qualify.ts`
- Test: `tests/prospecting-qualify.test.ts`

**Interfaces:**
- Consumes: `scoreBusinessFit`, `scoreContact`, `type RuleScore` from `fit.ts` (Task 3); `type TechnologyIndicator` from `analyze.ts`.
- Produces, from `types.ts`: `OPPORTUNITIES: readonly Opportunity[]`, `type ComponentKey`, `type FindingComponentKey`, `type ScoreAdjustment`, `type ScoreAdjustments`, `type OpportunityOverride`, `type ProspectDecision`.
- Produces, from `score.ts`: `CAPS`, `MIN_FINDING_TOTAL`, `pointsForFinding(f: AuditFinding): number`, `componentFor(c: FindingCategory): FindingComponentKey | null`, `type FindingTotals`, `classify(t: FindingTotals): Opportunity`.
- Produces, from `qualify.ts`: `type QualifyInput`, `type ComponentDefinition`, `COMPONENTS`, `type ComponentQualification`, `type BandKey`, `type Band`, `BANDS`, `bandFor(total: number): Band`, `type SuggestedOpportunity`, `type Qualification`, `qualifyProspect(input: QualifyInput): Qualification`, `qualificationSnapshot(q: Qualification): { totalScore: number; primaryOpportunity: string }`.

- [ ] **Step 1: Write the failing test**

Create `tests/prospecting-qualify.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  BANDS,
  bandFor,
  qualificationSnapshot,
  qualifyProspect,
  type QualifyInput,
} from "../src/lib/prospecting/qualify.ts";
import { scoreReport } from "../src/lib/prospecting/score.ts";
import type {
  AuditFinding,
  ComponentKey,
  FindingCategory,
  FindingComponentKey,
  FindingSeverity,
  ScoreAdjustment,
  ScoreAdjustments,
} from "../src/lib/prospecting/types.ts";

const blank = { country: "", industry: "", contactChannel: "", contactProvenance: "" };
const wellMatched = {
  country: "AU",
  industry: "Accountants",
  contactChannel: "info@acme.com.au",
  contactProvenance: "website footer",
};

function finding(rule: string, category: FindingCategory, severity: FindingSeverity): AuditFinding {
  return {
    id: rule,
    category,
    rule,
    severity,
    pageUrl: "https://acme.com.au/",
    evidence: {},
    recommendation: "Review this observed signal.",
    confidence: "high",
    observedAt: "2026-09-17T00:00:00.000Z",
  };
}

function audit(id: number, extra: Partial<NonNullable<QualifyInput["audit"]>> = {}) {
  return { id, findings: [], technologyIndicators: [], ...extra };
}

function adjustment(points: number, auditId: number | null): ScoreAdjustment {
  return {
    points,
    reason: "Reviewed against the evidence.",
    byUserId: 1,
    byEmail: "reviewer@example.com",
    at: "2026-09-17T00:00:00.000Z",
    auditId,
  };
}

function qualify(overrides: Partial<QualifyInput> = {}) {
  return qualifyProspect({ audit: null, prospect: blank, adjustments: {}, opportunityOverride: null, ...overrides });
}

function component(q: ReturnType<typeof qualify>, key: ComponentKey) {
  return q.components.find((c) => c.key === key)!;
}

/** Effective finding-based points set exactly, via adjustments pinned to audit 1. */
function withPoints(
  points: Partial<Record<FindingComponentKey, number>>,
  technologyIndicators: NonNullable<QualifyInput["audit"]>["technologyIndicators"] = [],
) {
  const adjustments: ScoreAdjustments = {};
  for (const key of Object.keys(points) as FindingComponentKey[]) {
    adjustments[key] = adjustment(points[key] ?? 0, 1);
  }
  return qualify({ audit: audit(1, { technologyIndicators }), adjustments });
}

test("with no usable audit, the website components are 0 and fit and contact still score", () => {
  const q = qualify({ prospect: wellMatched });

  for (const key of ["websiteUx", "seo", "technical", "conversion"] as const) {
    assert.equal(component(q, key).automatic, 0);
    assert.deepEqual(component(q, key).evidence, ["no completed audit yet"]);
  }
  assert.equal(component(q, "businessFit").effective, 10);
  assert.equal(component(q, "decisionMakerAvailability").effective, 5);
  assert.equal(q.effectiveTotal, 15);
  assert.equal(q.auditId, null);
  assert.equal(q.automaticOpportunities.primary, null);
  assert.deepEqual(q.automaticOpportunities.secondary, []);
  assert.deepEqual(qualificationSnapshot(q), { totalScore: 15, primaryOpportunity: "" });
});

test("finding components match scoreReport and show the rules behind them", () => {
  const findings = [
    finding("missing-meta-description", "seo", "medium"),
    finding("missing-title", "metadata", "high"),
    finding("missing-canonical", "seo", "low"),
    finding("missing-viewport", "mobile", "high"),
    finding("broken-link", "links", "medium"),
    finding("broken-link", "links", "medium"),
    finding("missing-primary-cta", "conversion", "low"),
    finding("noindex-hint", "technical", "informational"),
  ];
  const q = qualify({ audit: audit(7, { findings }) });
  const expected = scoreReport({
    findings,
    businessFit: { status: "not_assessed", points: 0 },
    decisionMakerAvailability: { status: "not_assessed", points: 0 },
  });

  for (const key of ["websiteUx", "seo", "technical", "conversion"] as const) {
    assert.equal(component(q, key).automatic, expected[key], key);
  }
  assert.deepEqual(component(q, "seo").evidence, [
    "missing-meta-description (+10)",
    "missing-title (+10)",
    "missing-canonical (+5)",
    "capped at 20 from 25",
  ]);
  assert.deepEqual(component(q, "technical").evidence, ["broken-link ×2 (+10)"]);
  assert.deepEqual(component(q, "conversion").evidence, ["missing-primary-cta (+5)"]);
  assert.equal(q.auditId, 7);
  assert.equal(q.automaticOpportunities.primary, "SEO");
  assert.deepEqual(q.automaticOpportunities.secondary, [
    { opportunity: "Website Improvement", evidence: "Website / UX 8/25" },
  ]);
});

test("an audit with no findings in a category says so", () => {
  assert.deepEqual(component(qualify({ audit: audit(3) }), "seo").evidence, ["no findings in this category"]);
});

test("a finding-based adjustment applies to its own audit and goes stale after a newer one", () => {
  const adjustments = { seo: adjustment(12, 14) };

  const current = component(qualify({ audit: audit(14), adjustments }), "seo");
  assert.equal(current.effective, 12);
  assert.equal(current.adjustmentApplies, true);

  const stale = component(qualify({ audit: audit(19), adjustments }), "seo");
  assert.equal(stale.automatic, 0);
  assert.equal(stale.effective, 0);
  assert.equal(stale.adjustmentApplies, false);
  assert.deepEqual(stale.adjustment, adjustments.seo);

  assert.equal(component(qualify({ audit: null, adjustments }), "seo").adjustmentApplies, false);
});

test("fit and contact adjustments persist across audits", () => {
  const adjustments = {
    businessFit: adjustment(10, null),
    decisionMakerAvailability: adjustment(10, null),
  };
  for (const current of [null, audit(14), audit(19)]) {
    const q = qualify({ audit: current, prospect: wellMatched, adjustments });
    assert.equal(component(q, "businessFit").automatic, 10);
    assert.equal(component(q, "decisionMakerAvailability").automatic, 5);
    assert.equal(component(q, "decisionMakerAvailability").effective, 10);
    assert.equal(q.automaticTotal, 15);
    assert.equal(q.effectiveTotal, 20);
  }
});

test("a stored adjustment outside its cap is clamped", () => {
  const q = qualify({ adjustments: { businessFit: adjustment(15, null) } });
  assert.equal(component(q, "businessFit").effective, 10);
});

test("a well-matched business with a sound website stays at Build Audit", () => {
  const q = qualify({ audit: audit(1), prospect: wellMatched });
  assert.equal(q.effectiveTotal, 15);
  assert.equal(q.automaticOpportunities.primary, "Build Audit");
  assert.deepEqual(q.automaticOpportunities.secondary, []);
  assert.equal(q.band.key, "insufficient");
});

function secondaries(q: ReturnType<typeof qualify>) {
  return q.automaticOpportunities.secondary.map((s) => s.opportunity);
}

test("SEO becomes secondary at 8 and not at 7", () => {
  const at = withPoints({ seo: 8, technical: 14, websiteUx: 8 });
  assert.equal(at.automaticOpportunities.primary, "Website Rebuild");
  assert.deepEqual(secondaries(at), ["SEO", "Website Improvement"]);

  const below = withPoints({ seo: 7, technical: 14, websiteUx: 8 });
  assert.equal(below.automaticOpportunities.primary, "Website Rebuild");
  assert.deepEqual(secondaries(below), ["Website Improvement"]);
});

test("Website Rebuild becomes secondary at technical 14 and not at 13", () => {
  const at = withPoints({ seo: 20, technical: 14, websiteUx: 8 });
  assert.equal(at.automaticOpportunities.primary, "SEO");
  assert.deepEqual(secondaries(at), ["Website Rebuild", "Website Improvement"]);
  assert.equal(at.automaticOpportunities.secondary[0]!.evidence, "Technical 14/20, Website / UX 8/25");

  assert.deepEqual(secondaries(withPoints({ seo: 20, technical: 13, websiteUx: 8 })), ["Website Improvement"]);
});

test("Website Improvement becomes secondary at UX 8 or conversion 8, and not at 7", () => {
  assert.deepEqual(secondaries(withPoints({ seo: 20, websiteUx: 8 })), ["Website Improvement"]);
  assert.deepEqual(secondaries(withPoints({ seo: 20, websiteUx: 7 })), []);

  const conversion = withPoints({ seo: 20, conversion: 8 });
  assert.deepEqual(conversion.automaticOpportunities.secondary, [
    { opportunity: "Website Improvement", evidence: "Conversion 8/15" },
  ]);
  assert.deepEqual(secondaries(withPoints({ seo: 20, conversion: 7 })), []);
});

test("below 10 finding points there is no prescription, but an observed platform still shows", () => {
  const thin = withPoints({ seo: 8, technical: 1 });
  assert.equal(thin.automaticOpportunities.primary, "Build Audit");
  assert.deepEqual(secondaries(thin), []);

  const shop = withPoints({ seo: 8, technical: 1 }, [
    { name: "WooCommerce", signal: "asset-path:/wp-content/plugins/woocommerce/", confidence: "high" },
  ]);
  assert.deepEqual(shop.automaticOpportunities.secondary, [
    { opportunity: "E-commerce", evidence: "WooCommerce detected (asset-path:/wp-content/plugins/woocommerce/)" },
  ]);

  assert.equal(withPoints({ seo: 8, technical: 2 }).automaticOpportunities.primary, "SEO");
});

test("E-commerce comes from Shopify as well as WooCommerce", () => {
  const q = withPoints({}, [{ name: "Shopify", signal: "generator:Shopify", confidence: "high" }]);
  assert.deepEqual(q.automaticOpportunities.secondary, [
    { opportunity: "E-commerce", evidence: "Shopify detected (generator:Shopify)" },
  ]);
});

test("the primary is never repeated as a secondary", () => {
  const q = withPoints({ seo: 20 });
  assert.equal(q.automaticOpportunities.primary, "SEO");
  assert.deepEqual(secondaries(q), []);
});

test("an override replaces the effective opportunities and leaves the automatic ones visible", () => {
  const q = qualify({
    audit: audit(1),
    adjustments: { seo: adjustment(20, 1) },
    opportunityOverride: {
      primary: "Automation",
      secondary: ["API / Integration"],
      reason: "Owner described a manual quoting process on the About page.",
      byUserId: 1,
      byEmail: "reviewer@example.com",
      at: "2026-09-17T00:00:00.000Z",
    },
  });

  assert.deepEqual(q.effectiveOpportunities, {
    primary: "Automation",
    secondary: ["API / Integration"],
    overridden: true,
  });
  assert.equal(q.automaticOpportunities.primary, "SEO");
  assert.deepEqual(qualificationSnapshot(q), { totalScore: 20, primaryOpportunity: "Automation" });
});

test("bands follow the effective total at every boundary", () => {
  const cases: [number, string][] = [
    [0, "insufficient"],
    [24, "insufficient"],
    [25, "limited"],
    [49, "limited"],
    [50, "judgment"],
    [74, "judgment"],
    [75, "strong"],
    [100, "strong"],
  ];
  for (const [total, key] of cases) assert.equal(bandFor(total).key, key, String(total));

  assert.deepEqual(
    BANDS.map((band) => band.action),
    [
      "Human review before any draft is created.",
      "Review the evidence and improve or dismiss the audit.",
      "Keep only if useful for future research; do not prioritize outreach.",
      "Do not create outreach.",
    ],
  );
  assert.equal(withPoints({ seo: 20, technical: 5 }).band.key, "limited");
});

test("a snapshot carries only the two list columns", () => {
  assert.deepEqual(Object.keys(qualificationSnapshot(qualify())).sort(), ["primaryOpportunity", "totalScore"]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types tests/prospecting-qualify.test.ts`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `qualify.ts`.

- [ ] **Step 3: Add the shared types**

Append to `src/lib/prospecting/types.ts`:

```ts
/** Every opportunity, in the order the admin lists them. */
export const OPPORTUNITIES: readonly Opportunity[] = [
  "Website Improvement",
  "Website Rebuild",
  "SEO",
  "Automation",
  "E-commerce",
  "API / Integration",
  "Custom Software",
  "Build Audit",
];

export type ComponentKey =
  | "websiteUx"
  | "seo"
  | "technical"
  | "conversion"
  | "businessFit"
  | "decisionMakerAvailability";

/** The four components scored from audit findings. */
export type FindingComponentKey = Exclude<ComponentKey, "businessFit" | "decisionMakerAvailability">;

/** A reviewer's value for one score component, with the reason it was set. */
export type ScoreAdjustment = {
  points: number;
  reason: string;
  byUserId: number;
  byEmail: string;
  /** ISO timestamp. */
  at: string;
  /** The audit a finding-based adjustment judged; null for business fit and contact. */
  auditId: number | null;
};

export type ScoreAdjustments = Partial<Record<ComponentKey, ScoreAdjustment>>;

export type OpportunityOverride = {
  primary: Opportunity;
  /** Distinct, and never the primary. */
  secondary: Opportunity[];
  reason: string;
  byUserId: number;
  byEmail: string;
  at: string;
};

/** `""` is undecided. */
export type ProspectDecision = "" | "qualified" | "dismissed";
```

- [ ] **Step 4: Export the scoring helpers from `score.ts`**

In `src/lib/prospecting/score.ts`:

1. Add `FindingComponentKey` to the `import type { ... } from "./types";` list at the top.
2. Change `const CAPS = {` to `export const CAPS = {`.
3. Directly after the `CAPS` object, add:

```ts
/**
 * Below this many finding-based points, the evidence does not justify
 * prescribing a specific solution, so the opportunity is Build Audit.
 */
export const MIN_FINDING_TOTAL = 10;

/** The finding-based points `classify` reads. Extra fields are ignored. */
export type FindingTotals = {
  websiteUx: number;
  seo: number;
  technical: number;
  conversion: number;
  total: number;
};
```

4. Change `function pointsForFinding(` to `export function pointsForFinding(`.
5. Change `function componentFor(category: FindingCategory): keyof typeof CAPS | null {` to `export function componentFor(category: FindingCategory): FindingComponentKey | null {`.
6. Replace the `classify` function's first two lines:

```ts
function classify(score: Omit<AuditScore, "primaryOpportunity">): Opportunity {
  if (score.total < 10) return "Build Audit";
```

with:

```ts
export function classify(score: FindingTotals): Opportunity {
  if (score.total < MIN_FINDING_TOTAL) return "Build Audit";
```

`scoreReport` is unchanged and still calls `classify(base)`.

- [ ] **Step 5: Create `src/lib/prospecting/qualify.ts`**

```ts
/**
 * Prospect qualification.
 *
 * Pure: no database and no network. Everything on a prospect's Qualification
 * panel is computed here from three stored inputs: the latest usable audit,
 * the prospect's own fields, and the reviewer's adjustments and override. A
 * change to a rule re-scores every prospect the next time it is read, and
 * every number can be read back against the evidence that produced it.
 */
import type { TechnologyIndicator } from "./analyze.ts";
import { scoreBusinessFit, scoreContact, type RuleScore } from "./fit.ts";
import { CAPS, MIN_FINDING_TOTAL, classify, componentFor, pointsForFinding } from "./score.ts";
import type {
  AuditFinding,
  ComponentKey,
  FindingComponentKey,
  Opportunity,
  OpportunityOverride,
  ScoreAdjustment,
  ScoreAdjustments,
} from "./types.ts";

export type QualifyInput = {
  audit: { id: number; findings: AuditFinding[]; technologyIndicators: TechnologyIndicator[] } | null;
  prospect: { country: string; industry: string; contactChannel: string; contactProvenance: string };
  adjustments: ScoreAdjustments;
  opportunityOverride: OpportunityOverride | null;
};

export type ComponentDefinition = {
  key: ComponentKey;
  label: string;
  cap: number;
  /** Scored from audit findings, so an adjustment to it is pinned to one audit. */
  findingBased: boolean;
};

export const COMPONENTS: readonly ComponentDefinition[] = [
  { key: "websiteUx", label: "Website / UX", cap: CAPS.websiteUx, findingBased: true },
  { key: "seo", label: "SEO", cap: CAPS.seo, findingBased: true },
  { key: "technical", label: "Technical", cap: CAPS.technical, findingBased: true },
  { key: "conversion", label: "Conversion", cap: CAPS.conversion, findingBased: true },
  { key: "businessFit", label: "Business fit", cap: CAPS.businessFit, findingBased: false },
  {
    key: "decisionMakerAvailability",
    label: "Decision-maker availability",
    cap: CAPS.decisionMakerAvailability,
    findingBased: false,
  },
];

export type ComponentQualification = ComponentDefinition & {
  automatic: number;
  effective: number;
  /** Why the automatic value is what it is. Never hidden by an adjustment. */
  evidence: string[];
  adjustment: ScoreAdjustment | null;
  /** False with no adjustment, or when a finding-based one judged an older audit. */
  adjustmentApplies: boolean;
};

export type BandKey = "strong" | "judgment" | "limited" | "insufficient";

export type Band = {
  key: BandKey;
  label: string;
  min: number;
  max: number;
  meaning: string;
  action: string;
};

/** Highest first, so the first band whose minimum a total reaches is its band. */
export const BANDS: readonly Band[] = [
  {
    key: "strong",
    label: "Strong",
    min: 75,
    max: 100,
    meaning: "Strong observed opportunity and fit",
    action: "Human review before any draft is created.",
  },
  {
    key: "judgment",
    label: "Needs judgment",
    min: 50,
    max: 74,
    meaning: "Potentially relevant but needs judgment",
    action: "Review the evidence and improve or dismiss the audit.",
  },
  {
    key: "limited",
    label: "Limited",
    min: 25,
    max: 49,
    meaning: "Limited or incomplete evidence",
    action: "Keep only if useful for future research; do not prioritize outreach.",
  },
  {
    key: "insufficient",
    label: "Insufficient",
    min: 0,
    max: 24,
    meaning: "Insufficient evidence or poor fit",
    action: "Do not create outreach.",
  },
];

export type SuggestedOpportunity = { opportunity: Opportunity; evidence: string };

export type Qualification = {
  /** The audit the finding-based components were scored from. */
  auditId: number | null;
  components: ComponentQualification[];
  automaticTotal: number;
  effectiveTotal: number;
  band: Band;
  /**
   * What the rules derive. "Automatic" means rule-made, not unadjusted: the
   * rules read the effective finding-based points, so a reviewer's correction
   * to a component flows into the opportunity it implies.
   */
  automaticOpportunities: { primary: Opportunity | null; secondary: SuggestedOpportunity[] };
  /** The reviewer's override when one is set, otherwise the automatic set. */
  effectiveOpportunities: { primary: Opportunity | null; secondary: Opportunity[]; overridden: boolean };
};

const NO_AUDIT = "no completed audit yet";
const ECOMMERCE_PLATFORMS = new Set(["Shopify", "WooCommerce"]);

export function bandFor(total: number): Band {
  return BANDS.find((band) => total >= band.min) ?? BANDS[BANDS.length - 1]!;
}

function findingScore(audit: NonNullable<QualifyInput["audit"]>, key: FindingComponentKey): RuleScore {
  const rules = new Map<string, { count: number; points: number }>();
  for (const finding of audit.findings) {
    if (componentFor(finding.category) !== key) continue;
    const points = pointsForFinding(finding);
    if (!points) continue;
    const entry = rules.get(finding.rule) ?? { count: 0, points: 0 };
    rules.set(finding.rule, { count: entry.count + 1, points: entry.points + points });
  }

  const evidence = [...rules].map(([rule, { count, points }]) =>
    count === 1 ? `${rule} (+${points})` : `${rule} ×${count} (+${points})`,
  );
  const raw = [...rules.values()].reduce((sum, entry) => sum + entry.points, 0);
  const cap = CAPS[key];
  if (raw > cap) evidence.push(`capped at ${cap} from ${raw}`);

  return {
    points: Math.min(cap, raw),
    evidence: evidence.length ? evidence : ["no findings in this category"],
  };
}

function automaticScore(input: QualifyInput, key: ComponentKey): RuleScore {
  switch (key) {
    case "businessFit":
      return scoreBusinessFit(input.prospect);
    case "decisionMakerAvailability":
      return scoreContact(input.prospect);
    default:
      return input.audit ? findingScore(input.audit, key) : { points: 0, evidence: [NO_AUDIT] };
  }
}

/**
 * Business fit and contact are facts about the business, so their
 * adjustments outlive a re-audit. A finding-based adjustment judged one
 * audit's findings and stops applying once a newer audit replaces them.
 */
function adjustmentApplies(
  definition: ComponentDefinition,
  adjustment: ScoreAdjustment,
  auditId: number | null,
): boolean {
  if (typeof adjustment.points !== "number" || !Number.isFinite(adjustment.points)) return false;
  return !definition.findingBased || (auditId !== null && adjustment.auditId === auditId);
}

function suggestOpportunities(
  audit: QualifyInput["audit"],
  points: Record<ComponentKey, number>,
): Qualification["automaticOpportunities"] {
  // Opportunities describe what the website needs, which business fit and
  // contact say nothing about. With no usable audit there is nothing to
  // describe at all.
  if (!audit) return { primary: null, secondary: [] };

  const { websiteUx, seo, technical, conversion } = points;
  const total = websiteUx + seo + technical + conversion;
  const primary = classify({ websiteUx, seo, technical, conversion, total });
  const suggestions: SuggestedOpportunity[] = [];

  // Explicit thresholds rather than "the primary's rule also holds": the SEO
  // rule in `classify` requires SEO to outscore technical and UX, which would
  // make it the primary, so reusing it would mean SEO could never be secondary.
  if (total >= MIN_FINDING_TOTAL) {
    if (seo >= 8) suggestions.push({ opportunity: "SEO", evidence: `SEO ${seo}/${CAPS.seo}` });
    if (technical >= 14 && websiteUx >= 8) {
      suggestions.push({
        opportunity: "Website Rebuild",
        evidence: `Technical ${technical}/${CAPS.technical}, Website / UX ${websiteUx}/${CAPS.websiteUx}`,
      });
    }
    const improvement = [
      websiteUx >= 8 ? `Website / UX ${websiteUx}/${CAPS.websiteUx}` : null,
      conversion >= 8 ? `Conversion ${conversion}/${CAPS.conversion}` : null,
    ].filter((line): line is string => line !== null);
    if (improvement.length) {
      suggestions.push({ opportunity: "Website Improvement", evidence: improvement.join(", ") });
    }
  }

  // An observed platform rather than a scoring inference, so it needs no gate.
  const platform = audit.technologyIndicators.find((indicator) => ECOMMERCE_PLATFORMS.has(indicator.name));
  if (platform) {
    suggestions.push({ opportunity: "E-commerce", evidence: `${platform.name} detected (${platform.signal})` });
  }

  return { primary, secondary: suggestions.filter((s) => s.opportunity !== primary) };
}

export function qualifyProspect(input: QualifyInput): Qualification {
  const auditId = input.audit?.id ?? null;

  const components = COMPONENTS.map((definition): ComponentQualification => {
    const automatic = automaticScore(input, definition.key);
    const adjustment = input.adjustments[definition.key] ?? null;
    const applies = adjustment !== null && adjustmentApplies(definition, adjustment, auditId);
    return {
      ...definition,
      automatic: automatic.points,
      effective:
        adjustment && applies
          ? Math.min(definition.cap, Math.max(0, Math.round(adjustment.points)))
          : automatic.points,
      evidence: automatic.evidence,
      adjustment,
      adjustmentApplies: applies,
    };
  });

  const points = Object.fromEntries(components.map((c) => [c.key, c.effective])) as Record<ComponentKey, number>;
  const automaticTotal = components.reduce((sum, c) => sum + c.automatic, 0);
  const effectiveTotal = components.reduce((sum, c) => sum + c.effective, 0);
  const automaticOpportunities = suggestOpportunities(input.audit, points);
  const override = input.opportunityOverride;

  return {
    auditId,
    components,
    automaticTotal,
    effectiveTotal,
    band: bandFor(effectiveTotal),
    automaticOpportunities,
    effectiveOpportunities: override
      ? {
          primary: override.primary,
          secondary: override.secondary.filter((o) => o !== override.primary),
          overridden: true,
        }
      : {
          primary: automaticOpportunities.primary,
          secondary: automaticOpportunities.secondary.map((s) => s.opportunity),
          overridden: false,
        },
  };
}

/**
 * The list's two sort and filter columns, and only those. A snapshot write
 * must never touch status, suppression or the decision.
 */
export function qualificationSnapshot(q: Qualification): { totalScore: number; primaryOpportunity: string } {
  return { totalScore: q.effectiveTotal, primaryOpportunity: q.effectiveOpportunities.primary ?? "" };
}
```

- [ ] **Step 6: Run the checks**

Run: `node --test --experimental-strip-types tests/prospecting-qualify.test.ts`
Expected: PASS, 16 tests.

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: 146 tests pass (the existing score tests unchanged); typecheck and lint exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/lib/prospecting/types.ts src/lib/prospecting/score.ts src/lib/prospecting/qualify.ts tests/prospecting-qualify.test.ts
git commit -m "Compute a prospect's qualification from stored evidence" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---
### Task 5: Server-side validation of reviewer input

**Files:**
- Create: `src/lib/prospecting/review-input.ts`
- Test: `tests/prospecting-review-input.test.ts`

**Interfaces:**
- Consumes: `COMPONENTS` from `qualify.ts`, `OPPORTUNITIES` and types from `types.ts` (Task 4).
- Produces: `REASON_MAX = 300`, `type Validated<T> = { ok: true; value: T } | { ok: false; error: string }`, `validateProspectId(raw: unknown): Validated<number>`, `validateComponentKey(raw: unknown): Validated<ComponentKey>`, `validateAdjustment(input: { component: unknown; points: unknown; reason: unknown }): Validated<{ component: ComponentKey; points: number; reason: string }>`, `validateOverride(input: { primary: unknown; secondary: unknown; reason: unknown }): Validated<{ primary: Opportunity; secondary: Opportunity[]; reason: string }>`, `validateDecision(input: { decision: unknown; reason: unknown }): Validated<{ decision: "qualified" | "dismissed"; reason: string }>`.

Every validator takes `unknown`. A server action's arguments arrive from the network, whatever its TypeScript signature says.

- [ ] **Step 1: Write the failing test**

Create `tests/prospecting-review-input.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  REASON_MAX,
  validateAdjustment,
  validateComponentKey,
  validateDecision,
  validateOverride,
  validateProspectId,
} from "../src/lib/prospecting/review-input.ts";

const reason = "Checked on the live site.";

test("a prospect id must be a positive safe integer", () => {
  assert.deepEqual(validateProspectId(12), { ok: true, value: 12 });
  for (const bad of [0, -1, 1.5, "12", Number.NaN, null]) {
    assert.equal(validateProspectId(bad).ok, false, String(bad));
  }
});

test("a component key must be one of the six", () => {
  assert.deepEqual(validateComponentKey("businessFit"), { ok: true, value: "businessFit" });
  assert.equal(validateComponentKey("total").ok, false);
  assert.equal(validateComponentKey(undefined).ok, false);
});

test("an adjustment within its cap is accepted with a trimmed reason", () => {
  assert.deepEqual(validateAdjustment({ component: "seo", points: 20, reason: `  ${reason}  ` }), {
    ok: true,
    value: { component: "seo", points: 20, reason },
  });
  assert.equal(validateAdjustment({ component: "seo", points: 0, reason }).ok, true);
});

test("an adjustment over its cap, negative, fractional or not a number is rejected", () => {
  for (const points of [21, -1, 7.5, "7", Number.NaN, null]) {
    const result = validateAdjustment({ component: "seo", points, reason });
    assert.equal(result.ok, false, String(points));
  }
  assert.deepEqual(validateAdjustment({ component: "seo", points: 21, reason }), {
    ok: false,
    error: "SEO must be a whole number from 0 to 20.",
  });
  assert.equal(validateAdjustment({ component: "conversion", points: 16, reason }).ok, false);
  assert.equal(validateAdjustment({ component: "unknown", points: 1, reason }).ok, false);
});

test("an adjustment needs a reason of at most 300 characters", () => {
  assert.equal(validateAdjustment({ component: "seo", points: 5, reason: "   " }).ok, false);
  assert.equal(validateAdjustment({ component: "seo", points: 5, reason: undefined }).ok, false);
  assert.equal(validateAdjustment({ component: "seo", points: 5, reason: "x".repeat(REASON_MAX) }).ok, true);
  assert.equal(validateAdjustment({ component: "seo", points: 5, reason: "x".repeat(REASON_MAX + 1) }).ok, false);
});

test("an override accepts any known opportunities that are distinct from the primary", () => {
  assert.deepEqual(
    validateOverride({ primary: "Automation", secondary: ["API / Integration", "Custom Software"], reason }),
    { ok: true, value: { primary: "Automation", secondary: ["API / Integration", "Custom Software"], reason } },
  );
  assert.equal(validateOverride({ primary: "Automation", secondary: [], reason }).ok, true);
});

test("an override is rejected for unknown, repeated or missing values", () => {
  const cases = [
    { primary: "Marketing", secondary: [], reason },
    { primary: "SEO", secondary: "Automation", reason },
    { primary: "SEO", secondary: ["Branding"], reason },
    { primary: "SEO", secondary: ["Automation", "Automation"], reason },
    { primary: "SEO", secondary: ["SEO"], reason },
    { primary: "SEO", secondary: [], reason: " " },
    { primary: "SEO", secondary: [], reason: "x".repeat(REASON_MAX + 1) },
  ];
  for (const input of cases) assert.equal(validateOverride(input).ok, false, JSON.stringify(input));
});

test("dismissing needs a reason and qualifying does not", () => {
  assert.equal(validateDecision({ decision: "dismissed", reason: "" }).ok, false);
  assert.deepEqual(validateDecision({ decision: "dismissed", reason: " Not a fit. " }), {
    ok: true,
    value: { decision: "dismissed", reason: "Not a fit." },
  });
  assert.deepEqual(validateDecision({ decision: "qualified", reason: "" }), {
    ok: true,
    value: { decision: "qualified", reason: "" },
  });
});

test("a decision reason over 300 characters or an unknown decision is rejected", () => {
  const long = "x".repeat(REASON_MAX + 1);
  assert.equal(validateDecision({ decision: "qualified", reason: long }).ok, false);
  assert.equal(validateDecision({ decision: "dismissed", reason: long }).ok, false);
  assert.equal(validateDecision({ decision: "", reason }).ok, false);
  assert.equal(validateDecision({ decision: "suppressed", reason }).ok, false);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types tests/prospecting-review-input.test.ts`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `review-input.ts`.

- [ ] **Step 3: Create `src/lib/prospecting/review-input.ts`**

```ts
/**
 * Validation for everything a reviewer submits.
 *
 * It runs on the server, inside each action. The admin forms check the same
 * things only to save a round trip. Phase 2's review found a reason check
 * that existed only in the browser, which a direct call to the action skips.
 */
import { COMPONENTS } from "./qualify.ts";
import { OPPORTUNITIES, type ComponentKey, type Opportunity } from "./types.ts";

export const REASON_MAX = 300;

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

function validateReason(raw: unknown, required: boolean, purpose: string): Validated<string> {
  const reason = typeof raw === "string" ? raw.trim() : "";
  if (required && !reason) return { ok: false, error: `Give a reason for ${purpose}.` };
  if (reason.length > REASON_MAX) {
    return { ok: false, error: `Keep the reason to ${REASON_MAX} characters.` };
  }
  return { ok: true, value: reason };
}

function isOpportunity(value: unknown): value is Opportunity {
  return typeof value === "string" && (OPPORTUNITIES as readonly string[]).includes(value);
}

export function validateProspectId(raw: unknown): Validated<number> {
  return typeof raw === "number" && Number.isSafeInteger(raw) && raw > 0
    ? { ok: true, value: raw }
    : { ok: false, error: "That prospect could not be found." };
}

export function validateComponentKey(raw: unknown): Validated<ComponentKey> {
  const definition = COMPONENTS.find((component) => component.key === raw);
  return definition ? { ok: true, value: definition.key } : { ok: false, error: "Unknown score component." };
}

export function validateAdjustment(input: {
  component: unknown;
  points: unknown;
  reason: unknown;
}): Validated<{ component: ComponentKey; points: number; reason: string }> {
  const definition = COMPONENTS.find((component) => component.key === input.component);
  if (!definition) return { ok: false, error: "Unknown score component." };

  const { points } = input;
  if (typeof points !== "number" || !Number.isInteger(points) || points < 0 || points > definition.cap) {
    return { ok: false, error: `${definition.label} must be a whole number from 0 to ${definition.cap}.` };
  }

  const reason = validateReason(input.reason, true, "this adjustment");
  if (!reason.ok) return reason;

  return { ok: true, value: { component: definition.key, points, reason: reason.value } };
}

export function validateOverride(input: {
  primary: unknown;
  secondary: unknown;
  reason: unknown;
}): Validated<{ primary: Opportunity; secondary: Opportunity[]; reason: string }> {
  const { primary, secondary } = input;
  if (!isOpportunity(primary)) return { ok: false, error: "Choose a primary opportunity from the list." };
  if (!Array.isArray(secondary) || !secondary.every(isOpportunity)) {
    return { ok: false, error: "Secondary opportunities must come from the list." };
  }
  if (new Set(secondary).size !== secondary.length) {
    return { ok: false, error: "List each secondary opportunity once." };
  }
  if (secondary.includes(primary)) {
    return { ok: false, error: "The primary opportunity cannot also be a secondary one." };
  }

  const reason = validateReason(input.reason, true, "this override");
  if (!reason.ok) return reason;

  return { ok: true, value: { primary, secondary, reason: reason.value } };
}

export function validateDecision(input: {
  decision: unknown;
  reason: unknown;
}): Validated<{ decision: "qualified" | "dismissed"; reason: string }> {
  const { decision } = input;
  if (decision !== "qualified" && decision !== "dismissed") return { ok: false, error: "Unknown decision." };

  const reason = validateReason(input.reason, decision === "dismissed", "dismissing this prospect");
  if (!reason.ok) return reason;

  return { ok: true, value: { decision, reason: reason.value } };
}
```

- [ ] **Step 4: Run the checks**

Run: `node --test --experimental-strip-types tests/prospecting-review-input.test.ts`
Expected: PASS, 9 tests.

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: 155 tests pass; typecheck and lint exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/prospecting/review-input.ts tests/prospecting-review-input.test.ts
git commit -m "Validate reviewer adjustments, overrides and decisions on the server" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Qualification columns, migration 0003, and audit actions

**Files:**
- Modify: `src/db/schema.ts` (imports, the `prospects` table and its doc comment)
- Create: `drizzle/0003_prospect_qualification.sql`
- Modify: `src/lib/auth/audit.ts:29-31` (the `AuditAction` union)
- Test: `tests/prospecting-migration.test.ts`

**Interfaces:**
- Consumes: `type ScoreAdjustments`, `type OpportunityOverride` from `src/lib/prospecting/types.ts` (Task 4).
- Produces: on `Prospect`: `scoreAdjustments: ScoreAdjustments`, `opportunityOverride: OpportunityOverride | null`, `decision: string`, `decisionReason: string`, `decidedBy: number | null`, `decidedAt: Date | null`. `AuditAction` gains `"prospect.dismiss" | "prospect.qualify" | "prospect.decision.clear" | "prospect.score.adjust" | "prospect.score.clear" | "prospect.opportunity.set" | "prospect.opportunity.clear"`.

**Do not apply this migration to any database.** Applying it to production needs the owner's explicit go-ahead, and the controller handles that outside this task.

- [ ] **Step 1: Write the failing test**

Create `tests/prospecting-migration.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getTableColumns } from "drizzle-orm";
import { prospects } from "../src/db/schema.ts";

function migration() {
  return readFile(new URL("../drizzle/0003_prospect_qualification.sql", import.meta.url), "utf8");
}

test("migration 0003 adds every qualification column the schema declares, idempotently", async () => {
  const sql = await migration();
  const columns = getTableColumns(prospects);

  for (const key of [
    "scoreAdjustments",
    "opportunityOverride",
    "decision",
    "decisionReason",
    "decidedBy",
    "decidedAt",
  ] as const) {
    assert.match(sql, new RegExp(`ADD COLUMN IF NOT EXISTS "${columns[key].name}"`), key);
  }
  assert.match(sql, /CREATE INDEX IF NOT EXISTS "prospects_decision_idx" ON "prospects" \("decision"\)/);
  assert.match(sql, /"prospects_decided_by_fk"[\s\S]*REFERENCES "users"\("id"\) ON DELETE SET NULL/);
});

test("migration 0003 is additive and leaves existing rows valid", async () => {
  const sql = await migration();
  assert.doesNotMatch(sql, /\bDROP\b/i);
  assert.doesNotMatch(sql, /\bALTER COLUMN\b/i);
  assert.doesNotMatch(sql, /\bRENAME\b/i);
  assert.doesNotMatch(sql, /\bTRUNCATE\b/i);
  assert.doesNotMatch(sql, /\bDELETE\s+FROM\b/i);
  assert.doesNotMatch(sql, /^\s*UPDATE\b/im);
  // Every added NOT NULL column carries a default, so existing rows stay valid.
  for (const line of sql.split("\n").filter((l) => /ADD COLUMN/.test(l) && /NOT NULL/.test(l))) {
    assert.match(line, /DEFAULT/, line);
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types tests/prospecting-migration.test.ts`
Expected: FAIL with `ENOENT` for `0003_prospect_qualification.sql`.

- [ ] **Step 3: Write the migration**

Create `drizzle/0003_prospect_qualification.sql`:

```sql
-- Phase 3 prospect qualification.
-- Additive and idempotent: adds six columns and one index to "prospects",
-- alters no existing column, and leaves every existing row valid.

BEGIN;

ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "score_adjustments" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "opportunity_override" jsonb;
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "decision" varchar(16) DEFAULT '' NOT NULL;
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "decision_reason" text DEFAULT '' NOT NULL;
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "decided_by" integer;
ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "decided_at" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "prospects_decision_idx" ON "prospects" ("decision");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prospects_decided_by_fk') THEN
    ALTER TABLE "prospects" ADD CONSTRAINT "prospects_decided_by_fk"
      FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
```

- [ ] **Step 4: Update the Drizzle schema**

In `src/db/schema.ts`, add this line directly after the `from "drizzle-orm/pg-core";` import:

```ts
import type { OpportunityOverride, ScoreAdjustments } from "../lib/prospecting/types.ts";
```

Replace the `prospects` doc comment paragraph that begins `` * `totalScore` and `primaryOpportunity` are denormalized snapshots `` and ends `` * Phase 3 (Prospect Qualification), which rebuilds this surface anyway. `` with:

```ts
 * `totalScore` and `primaryOpportunity` are denormalized snapshots so the list
 * can sort and filter in SQL. They hold the effective qualification — the
 * latest usable audit's findings, business fit, contact, and any reviewer
 * adjustment or override — and `refreshQualificationSnapshot` rewrites them on
 * every path that can change one. The detail page never reads them for the
 * breakdown: it recomputes.
 *
 * `decision` is the reviewer's judgement and has its own columns, never a
 * value of `status`. The drain writes `status` after every audit, and Phase
 * 2's worst defect was a pipeline write overwriting a human decision held
 * there. Suppression stays separate too: it is the business's opt-out, while
 * dismissal is ForgeLine's judgement.
```

In the `prospects` column list, insert directly after the `primaryOpportunity` column:

```ts
    scoreAdjustments: jsonb("score_adjustments").$type<ScoreAdjustments>().notNull().default({}),
    opportunityOverride: jsonb("opportunity_override").$type<OpportunityOverride>(),
    /** `""` (undecided), `qualified` or `dismissed`. */
    decision: varchar("decision", { length: 16 }).notNull().default(""),
    decisionReason: text("decision_reason").notNull().default(""),
    decidedBy: integer("decided_by").references(() => users.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
```

In the `prospects` index list, add after `index("prospects_industry_idx").on(t.industry),`:

```ts
    index("prospects_decision_idx").on(t.decision),
```

- [ ] **Step 5: Add the audit actions**

In `src/lib/auth/audit.ts`, replace:

```ts
  | "prospect.unsuppress"
  | "media.upload" | "media.delete";
```

with:

```ts
  | "prospect.unsuppress"
  | "prospect.qualify" | "prospect.dismiss" | "prospect.decision.clear"
  | "prospect.score.adjust" | "prospect.score.clear"
  | "prospect.opportunity.set" | "prospect.opportunity.clear"
  | "media.upload" | "media.delete";
```

- [ ] **Step 6: Run the checks**

Run: `node --test --experimental-strip-types tests/prospecting-migration.test.ts`
Expected: PASS, 2 tests.

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: 157 tests pass; typecheck and lint exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/db/schema.ts drizzle/0003_prospect_qualification.sql src/lib/auth/audit.ts tests/prospecting-migration.test.ts
git commit -m "Add qualification columns to prospects in an additive migration" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---
### Task 7: Qualification storage, and keeping the list snapshot honest

**Files:**
- Create: `src/lib/prospecting/qualification.ts`
- Modify: `src/lib/prospecting/queue.ts` (`applyResult`)
- Modify: `src/lib/prospecting/prospects.ts` (`buildUpsertValues`, `upsertProspects`, `UpsertSummary`)
- Modify: `src/lib/prospecting/actions.ts` (`ImportResult`, `commitImport`'s audit detail)
- Modify: `src/components/admin/prospecting/import-form.tsx` (the "Import complete" block)
- Create: `scripts/requalify-prospects.mts`
- Modify: `package.json` (one script)
- Test: `tests/prospecting-qualification-store.test.ts` (new), `tests/prospecting-upsert.test.ts` (update)

**Interfaces:**
- Consumes: `qualifyProspect`, `qualificationSnapshot`, `type Qualification`, `type QualifyInput` (Task 4); the new `Prospect` columns (Task 6); `withRetry`, `describeError` (Task 1).
- Produces, from `qualification.ts`: `toObservedFinding(row: StoredAuditFinding): AuditFinding`, `storedTechnologyIndicators(report: Record<string, unknown>): TechnologyIndicator[]`, `decisionValues(input: { decision: "qualified" | "dismissed"; reason: string; userId: number } | null, now: Date): { decision: string; decisionReason: string; decidedBy: number | null; decidedAt: Date | null }`, `latestUsableAudit(prospectId: number): Promise<QualifyInput["audit"]>`, `loadQualification(prospectId: number): Promise<{ prospect: Prospect; qualification: Qualification } | null>`, `refreshQualificationSnapshot(prospectId: number): Promise<void>`, `setScoreAdjustment(prospectId: number, component: ComponentKey, adjustment: ScoreAdjustment): Promise<boolean>`, `clearScoreAdjustment(prospectId: number, component: ComponentKey): Promise<boolean>`, `setOpportunityOverride(prospectId: number, override: OpportunityOverride): Promise<boolean>`, `clearOpportunityOverride(prospectId: number): Promise<boolean>`, `setDecision(prospectId: number, input: { decision: "qualified" | "dismissed"; reason: string; userId: number }): Promise<boolean>`, `clearDecision(prospectId: number): Promise<boolean>`. Each `Promise<boolean>` is `false` when no row matched.
- Produces, from `prospects.ts`: `qualificationInputsChanged(before, after): boolean` over `{ country, industry, contactChannel, contactProvenance }`; `UpsertSummary` gains `staleScores: number`.
- Produces: `npm run prospecting:requalify`.

- [ ] **Step 1: Write the failing tests**

Create `tests/prospecting-qualification-store.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  decisionValues,
  storedTechnologyIndicators,
  toObservedFinding,
} from "../src/lib/prospecting/qualification.ts";

test("a stored finding row reads back in the shape the scorer uses", () => {
  const observed = toObservedFinding({
    id: 41,
    auditId: 7,
    category: "seo",
    rule: "missing-title",
    severity: "high",
    pageUrl: "https://acme.com.au/",
    evidence: { selector: "title" },
    recommendation: "Add a descriptive title.",
    confidence: "high",
    observedAt: new Date("2026-09-17T01:02:03.000Z"),
    createdAt: new Date("2026-09-17T01:02:04.000Z"),
  });

  assert.deepEqual(observed, {
    id: "41",
    category: "seo",
    rule: "missing-title",
    severity: "high",
    pageUrl: "https://acme.com.au/",
    evidence: { selector: "title" },
    recommendation: "Add a descriptive title.",
    confidence: "high",
    observedAt: "2026-09-17T01:02:03.000Z",
  });
});

test("only well-formed technology indicators are read from a stored report", () => {
  assert.deepEqual(
    storedTechnologyIndicators({
      technologyIndicators: [
        { name: "Shopify", signal: "generator:Shopify", confidence: "high" },
        { name: "Broken" },
        "WordPress",
        null,
        { name: "WooCommerce", signal: "asset-path:/wp-content/plugins/woocommerce/", confidence: "certain" },
      ],
    }),
    [{ name: "Shopify", signal: "generator:Shopify", confidence: "high" }],
  );
  assert.deepEqual(storedTechnologyIndicators({}), []);
  assert.deepEqual(storedTechnologyIndicators({ technologyIndicators: "Shopify" }), []);
});

test("setting a decision records attribution and clearing resets reason and attribution", () => {
  const at = new Date("2026-09-17T00:00:00.000Z");
  assert.deepEqual(decisionValues({ decision: "dismissed", reason: "Not a fit.", userId: 3 }, at), {
    decision: "dismissed",
    decisionReason: "Not a fit.",
    decidedBy: 3,
    decidedAt: at,
  });
  assert.deepEqual(decisionValues(null, at), {
    decision: "",
    decisionReason: "",
    decidedBy: null,
    decidedAt: null,
  });
});
```

In `tests/prospecting-upsert.test.ts`, change the import line to:

```ts
import { buildUpsertValues, qualificationInputsChanged } from "../src/lib/prospecting/prospects.ts";
```

Replace the test `"buildUpsertValues never sets lifecycle or score fields"` with:

```ts
test("buildUpsertValues never sets lifecycle or suppression fields", () => {
  const [value] = buildUpsertValues([row], source, 4);
  assert.equal(value!.status, undefined);
  assert.equal(value!.suppressedAt, undefined);
  assert.equal(value!.lastAuditId, undefined);
  assert.equal(value!.decision, undefined);
  assert.equal(value!.scoreAdjustments, undefined);
});

test("a new prospect's list snapshot is its business fit and contact score", () => {
  // AU (5) + Accounting (5) + a role email with provenance (5). No audit yet,
  // so no opportunity.
  const [value] = buildUpsertValues([row], source, 4);
  assert.equal(value!.totalScore, 15);
  assert.equal(value!.primaryOpportunity, "");
});

test("only a change to what fit or contact is scored from counts as a qualification change", () => {
  const before = {
    country: "AU",
    industry: "Accounting",
    contactChannel: "info@acme.com",
    contactProvenance: "website footer",
  };
  const renamed = { ...row, companyName: "Acme Pty Ltd", location: "Sydney" };
  assert.equal(qualificationInputsChanged(before, row), false);
  assert.equal(qualificationInputsChanged(before, renamed), false);
  assert.equal(qualificationInputsChanged(before, { ...row, country: "NZ" }), true);
  assert.equal(qualificationInputsChanged(before, { ...row, industry: "Consulting" }), true);
  assert.equal(qualificationInputsChanged(before, { ...row, contactChannel: "hello@acme.com" }), true);
  assert.equal(qualificationInputsChanged(before, { ...row, contactProvenance: "contact page" }), true);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test --experimental-strip-types tests/prospecting-qualification-store.test.ts tests/prospecting-upsert.test.ts`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `qualification.ts`, and the upsert file failing on the missing `qualificationInputsChanged` export.

- [ ] **Step 3: Create `src/lib/prospecting/qualification.ts`**

```ts
/**
 * Qualification storage.
 *
 * Loads what `qualifyProspect` needs, keeps the list's snapshot columns in
 * step with it, and writes the reviewer's adjustments, override and decision.
 * The rules live in `qualify.ts`, which has no database access.
 */
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  auditFindings,
  getDb,
  prospectAudits,
  prospects,
  type AuditFinding as StoredAuditFinding,
  type Prospect,
} from "../../db/index.ts";
import type { TechnologyIndicator } from "./analyze.ts";
import {
  qualificationSnapshot,
  qualifyProspect,
  type Qualification,
  type QualifyInput,
} from "./qualify.ts";
import type {
  AuditFinding,
  ComponentKey,
  Confidence,
  FindingCategory,
  FindingSeverity,
  JsonValue,
  OpportunityOverride,
  ScoreAdjustment,
} from "./types.ts";

const CONFIDENCES: readonly string[] = ["low", "medium", "high"];

type DecisionInput = { decision: "qualified" | "dismissed"; reason: string; userId: number };

/** Pure: a stored finding row back in the shape the scorer reads. */
export function toObservedFinding(row: StoredAuditFinding): AuditFinding {
  return {
    id: String(row.id),
    category: row.category as FindingCategory,
    rule: row.rule,
    severity: row.severity as FindingSeverity,
    pageUrl: row.pageUrl,
    evidence: row.evidence as Record<string, JsonValue>,
    recommendation: row.recommendation,
    confidence: row.confidence as Confidence,
    observedAt: row.observedAt.toISOString(),
  };
}

/**
 * Pure: the technology indicators in a stored report. The report is untyped
 * jsonb, so anything that is not a well-formed indicator is dropped rather
 * than trusted.
 */
export function storedTechnologyIndicators(report: Record<string, unknown>): TechnologyIndicator[] {
  const raw = report.technologyIndicators;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is TechnologyIndicator => {
    if (typeof item !== "object" || item === null) return false;
    const { name, signal, confidence } = item as Record<string, unknown>;
    return (
      typeof name === "string" &&
      typeof signal === "string" &&
      typeof confidence === "string" &&
      CONFIDENCES.includes(confidence)
    );
  });
}

/** Pure: the decision columns for a decision, or for clearing one. */
export function decisionValues(
  input: DecisionInput | null,
  now: Date,
): { decision: string; decisionReason: string; decidedBy: number | null; decidedAt: Date | null } {
  return input
    ? { decision: input.decision, decisionReason: input.reason, decidedBy: input.userId, decidedAt: now }
    : { decision: "", decisionReason: "", decidedBy: null, decidedAt: null };
}

/**
 * The prospect's most recent audit that produced findings. It is looked up
 * directly rather than through `last_audit_id`, which Phase 2 deliberately
 * leaves pointing at a failed run so its error stays readable.
 */
export async function latestUsableAudit(prospectId: number): Promise<QualifyInput["audit"]> {
  const [audit] = await getDb()
    .select({ id: prospectAudits.id, report: prospectAudits.report })
    .from(prospectAudits)
    .where(
      and(
        eq(prospectAudits.prospectId, prospectId),
        inArray(prospectAudits.status, ["completed", "partial"]),
      ),
    )
    .orderBy(desc(prospectAudits.id))
    .limit(1);
  if (!audit) return null;

  const rows = await getDb()
    .select()
    .from(auditFindings)
    .where(eq(auditFindings.auditId, audit.id))
    .orderBy(asc(auditFindings.id));

  return {
    id: audit.id,
    findings: rows.map(toObservedFinding),
    technologyIndicators: storedTechnologyIndicators(audit.report),
  };
}

export async function loadQualification(
  prospectId: number,
): Promise<{ prospect: Prospect; qualification: Qualification } | null> {
  const [prospect] = await getDb().select().from(prospects).where(eq(prospects.id, prospectId)).limit(1);
  if (!prospect) return null;

  const audit = await latestUsableAudit(prospectId);
  const qualification = qualifyProspect({
    audit,
    prospect: {
      country: prospect.country,
      industry: prospect.industry,
      contactChannel: prospect.contactChannel,
      contactProvenance: prospect.contactProvenance,
    },
    adjustments: prospect.scoreAdjustments ?? {},
    opportunityOverride: prospect.opportunityOverride ?? null,
  });
  return { prospect, qualification };
}

/**
 * Recomputes the list's `total_score` and `primary_opportunity` and writes
 * those two columns only. Never `status`, `suppressed_at` or the decision:
 * those belong to the pipeline and the reviewer.
 */
export async function refreshQualificationSnapshot(prospectId: number): Promise<void> {
  const loaded = await loadQualification(prospectId);
  if (!loaded) return;
  await getDb()
    .update(prospects)
    .set(qualificationSnapshot(loaded.qualification))
    .where(eq(prospects.id, prospectId));
}

export async function setScoreAdjustment(
  prospectId: number,
  component: ComponentKey,
  adjustment: ScoreAdjustment,
): Promise<boolean> {
  // `||` merges one key into the stored object in a single statement, so two
  // reviewers adjusting different components cannot overwrite each other.
  const rows = await getDb()
    .update(prospects)
    .set({
      scoreAdjustments: sql`${prospects.scoreAdjustments} || ${JSON.stringify({ [component]: adjustment })}::jsonb`,
      updatedAt: new Date(),
    })
    .where(eq(prospects.id, prospectId))
    .returning({ id: prospects.id });
  return rows.length > 0;
}

export async function clearScoreAdjustment(prospectId: number, component: ComponentKey): Promise<boolean> {
  const rows = await getDb()
    .update(prospects)
    .set({
      scoreAdjustments: sql`${prospects.scoreAdjustments} - ${component}::text`,
      updatedAt: new Date(),
    })
    .where(eq(prospects.id, prospectId))
    .returning({ id: prospects.id });
  return rows.length > 0;
}

export async function setOpportunityOverride(
  prospectId: number,
  override: OpportunityOverride,
): Promise<boolean> {
  const rows = await getDb()
    .update(prospects)
    .set({ opportunityOverride: override, updatedAt: new Date() })
    .where(eq(prospects.id, prospectId))
    .returning({ id: prospects.id });
  return rows.length > 0;
}

export async function clearOpportunityOverride(prospectId: number): Promise<boolean> {
  const rows = await getDb()
    .update(prospects)
    .set({ opportunityOverride: null, updatedAt: new Date() })
    .where(eq(prospects.id, prospectId))
    .returning({ id: prospects.id });
  return rows.length > 0;
}

/**
 * A suppressed prospect cannot be qualified. Suppression is the business's
 * opt-out, and the Qualified shortlist is what later outreach draws from. The
 * guard is in the UPDATE so a suppression that commits while the reviewer is
 * deciding still wins.
 */
export async function setDecision(prospectId: number, input: DecisionInput): Promise<boolean> {
  const rows = await getDb()
    .update(prospects)
    .set({ ...decisionValues(input, new Date()), updatedAt: new Date() })
    .where(
      and(
        eq(prospects.id, prospectId),
        input.decision === "qualified" ? isNull(prospects.suppressedAt) : undefined,
      ),
    )
    .returning({ id: prospects.id });
  return rows.length > 0;
}

export async function clearDecision(prospectId: number): Promise<boolean> {
  const rows = await getDb()
    .update(prospects)
    .set({ ...decisionValues(null, new Date()), updatedAt: new Date() })
    .where(eq(prospects.id, prospectId))
    .returning({ id: prospects.id });
  return rows.length > 0;
}
```

- [ ] **Step 4: Refresh the snapshot after an audit is applied**

In `src/lib/prospecting/queue.ts`, add `import { refreshQualificationSnapshot } from "./qualification.ts";` after the existing imports.

Replace the whole `applyResult` property (from `applyResult: async ({ prospectId, auditId, result }) => {` to its closing `},`) with:

```ts
    applyResult: async ({ prospectId, auditId, result }) => {
      if (prospectId === null) return;

      const [prospect] = await withRetry(() =>
        getDb()
          .select({ suppressedAt: prospects.suppressedAt })
          .from(prospects)
          .where(eq(prospects.id, prospectId))
          .limit(1),
      );
      if (!prospect) return;

      // A failed audit returns the prospect to `new` so it can be queued again,
      // while still pointing at the failed run so the error is readable.
      //
      // A suppressed prospect keeps its status. Writing `audited` here would
      // hide the opt-out from the list, and writing `new` after a failure would
      // hand the prospect straight back to "Queue all new" and have it audited
      // again, forever. The audit links are still written so the run that was
      // already in flight stays traceable.
      const lifecycle =
        prospect.suppressedAt === null
          ? { status: result.status === "failed" ? "new" : "audited" }
          : {};

      await getDb()
        .update(prospects)
        .set({
          ...lifecycle,
          lastAuditId: auditId,
          lastAuditedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(prospects.id, prospectId));

      // The score and opportunity are recomputed rather than copied from this
      // result. After a failed run, an earlier completed audit is still the
      // evidence, and business fit, contact and reviewer adjustments belong in
      // the total too.
      await refreshQualificationSnapshot(prospectId);
    },
```

- [ ] **Step 5: Snapshot new prospects and refresh changed ones on import**

In `src/lib/prospecting/prospects.ts`:

1. Add these imports after the existing ones:

```ts
import { refreshQualificationSnapshot } from "./qualification.ts";
import { qualificationSnapshot, qualifyProspect } from "./qualify.ts";
```

2. Change `export type UpsertSummary = { inserted: number; updated: number; skippedSuppressed: number };` to:

```ts
export type UpsertSummary = {
  inserted: number;
  updated: number;
  skippedSuppressed: number;
  /** Updated prospects whose list score could not be refreshed. */
  staleScores: number;
};
```

3. Replace `buildUpsertValues`, including its doc comment, with:

```ts
/**
 * Pure: turns parsed rows into insert values. Deliberately sets no lifecycle,
 * suppression or decision field — those belong to the row that already exists
 * and must survive a re-import untouched.
 *
 * The score snapshot is set because a new prospect has no audit and no
 * reviewer input yet, so its qualification is exactly its business fit and
 * contact. It reaches inserted rows only: the conflict `set` in
 * `upsertProspects` names its columns and leaves an existing row's snapshot
 * alone.
 */
export function buildUpsertValues(
  rows: ParsedProspect[],
  source: ProspectSource,
  createdBy: number | null,
): NewProspect[] {
  return rows.map((row) => ({
    companyName: row.companyName,
    domain: row.domain,
    websiteUrl: row.websiteUrl,
    industry: row.industry,
    country: row.country,
    location: row.location,
    contactChannel: row.contactChannel,
    contactProvenance: row.contactProvenance,
    sources: [source],
    createdBy,
    ...qualificationSnapshot(
      qualifyProspect({ audit: null, prospect: row, adjustments: {}, opportunityOverride: null }),
    ),
  }));
}

type QualificationFields = {
  country: string;
  industry: string;
  contactChannel: string;
  contactProvenance: string;
};

/** Pure: whether a re-import changed anything business fit or contact is scored from. */
export function qualificationInputsChanged(before: QualificationFields, after: QualificationFields): boolean {
  return (
    before.country !== after.country ||
    before.industry !== after.industry ||
    before.contactChannel !== after.contactChannel ||
    before.contactProvenance !== after.contactProvenance
  );
}
```

4. In `upsertProspects`, change the empty-input return to `return { inserted: 0, updated: 0, skippedSuppressed: 0, staleScores: 0 };`.

5. Replace the `before` query and the two lines after it:

```ts
  const before = await getDb()
    .select({ domain: prospects.domain, suppressedAt: prospects.suppressedAt })
    .from(prospects)
    .where(inArray(prospects.domain, values.map((v) => v.domain!)));

  const existing = new Set(before.map((r) => r.domain));
```

with:

```ts
  const before = await getDb()
    .select({
      id: prospects.id,
      domain: prospects.domain,
      suppressedAt: prospects.suppressedAt,
      country: prospects.country,
      industry: prospects.industry,
      contactChannel: prospects.contactChannel,
      contactProvenance: prospects.contactProvenance,
    })
    .from(prospects)
    .where(inArray(prospects.domain, values.map((v) => v.domain!)));

  const existing = new Map(before.map((r) => [r.domain, r]));
```

(The `suppressed` line below it is unchanged.)

6. Replace the function's final block, from `const touched = new Set(returned.map((r) => r.domain));` to the end of the function, with:

```ts
  const touched = new Set(returned.map((r) => r.domain));

  // The upsert is one statement and cannot recompute a score, so a re-import
  // that changed what business fit or contact is scored from refreshes those
  // snapshots here. Suppressed prospects never reach this: the conflict
  // `setWhere` refuses them, so they are not in `touched`.
  let staleScores = 0;
  for (const row of rows) {
    const previous = existing.get(row.domain);
    if (!previous || !touched.has(row.domain) || !qualificationInputsChanged(previous, row)) continue;
    try {
      await refreshQualificationSnapshot(previous.id);
    } catch (error) {
      // The rows are already saved, so this must not read as a failed import.
      // The list keeps this prospect's old score until the next refresh; the
      // detail page is unaffected because it always recomputes.
      console.error("[prospecting] snapshot refresh after import failed", previous.id, error);
      staleScores += 1;
    }
  }

  return {
    inserted: [...touched].filter((d) => !existing.has(d)).length,
    updated: [...touched].filter((d) => existing.has(d)).length,
    skippedSuppressed: [...suppressed].filter((d) => !touched.has(d)).length,
    staleScores,
  };
```

- [ ] **Step 6: Report unrefreshed scores on the import screen**

In `src/lib/prospecting/actions.ts`, change the `ImportResult` type's second arm to:

```ts
  | {
      status: "imported";
      inserted: number;
      updated: number;
      skippedSuppressed: number;
      staleScores: number;
    };
```

and change the `detail:` line inside `commitImport`'s `audit({ action: "prospect.import", ... })` call to:

```ts
    detail: `${sourceName}: ${summary.inserted} new, ${summary.updated} updated, ${summary.skippedSuppressed} suppressed${
      summary.staleScores ? `, ${summary.staleScores} scores not refreshed` : ""
    }`,
```

In `src/components/admin/prospecting/import-form.tsx`, insert directly after the closing `</dl>` of the "Import complete" block:

```tsx
          {result.staleScores > 0 ? (
            <p role="status" className="mt-4 text-[0.875rem] text-muted">
              {result.staleScores} list {result.staleScores === 1 ? "score" : "scores"} could not be
              refreshed. Run <code className="font-mono">npm run prospecting:requalify</code> to update
              them.
            </p>
          ) : null}
```

- [ ] **Step 7: Add the requalify CLI**

Create `scripts/requalify-prospects.mts`:

```ts
/**
 * Recomputes every prospect's list snapshot from its latest usable audit,
 * its own fields and its reviewer inputs.
 *
 *   npm run prospecting:requalify
 *
 * Run it once after applying migration 0003, and again after any change to
 * the qualification rules. The list sorts on the stored snapshot, and nothing
 * else rewrites a row that no audit, adjustment or import has touched since.
 */
import { asc } from "drizzle-orm";
import { getDb, prospects } from "../src/db/index.ts";
import { refreshQualificationSnapshot } from "../src/lib/prospecting/qualification.ts";
import { describeError, withRetry } from "../src/lib/retry.ts";

try {
  const rows = await withRetry(() =>
    getDb().select({ id: prospects.id }).from(prospects).orderBy(asc(prospects.id)),
  );
  for (const row of rows) await refreshQualificationSnapshot(row.id);
  console.log(`Requalified ${rows.length} ${rows.length === 1 ? "prospect" : "prospects"}.`);
} catch (error) {
  console.error(`Requalify stopped: ${describeError(error)}`);
  process.exitCode = 1;
}
```

In `package.json` `scripts`, add after the `prospecting:drain` line:

```json
    "prospecting:requalify": "node --env-file=.env ./node_modules/tsx/dist/cli.mjs scripts/requalify-prospects.mts",
```

Do not run this script. Migration 0003 is not applied yet.

- [ ] **Step 8: Run the checks**

Run: `node --test --experimental-strip-types tests/prospecting-qualification-store.test.ts tests/prospecting-upsert.test.ts`
Expected: PASS.

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: 162 tests pass; typecheck and lint exit 0.

- [ ] **Step 9: Commit**

```bash
git add src/lib/prospecting/qualification.ts src/lib/prospecting/queue.ts src/lib/prospecting/prospects.ts src/lib/prospecting/actions.ts src/components/admin/prospecting/import-form.tsx scripts/requalify-prospects.mts package.json tests/prospecting-qualification-store.test.ts tests/prospecting-upsert.test.ts
git commit -m "Store qualification inputs and refresh the list snapshot on every path that changes it" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---
### Task 8: Dismissed prospects cannot be queued, and the list filters by decision and band

**Files:**
- Modify: `src/lib/prospecting/queue.ts` (`productionEnqueueDependencies`, `enqueueProspects` doc comment)
- Modify: `src/lib/prospecting/prospects.ts` (`ProspectFilter`, `listProspects`)
- Modify: `src/lib/prospecting/actions.ts` (`queueAllNew` comment only)
- Test: `tests/prospecting-queue.test.ts` (append), `tests/prospecting-list-filter.test.ts` (new)

**Interfaces:**
- Consumes: `prospects.decision` (Task 6); `BANDS` from `qualify.ts` (Task 4).
- Produces, from `queue.ts`: `queueableWhere(ids: number[]): SQL | undefined`, `markQueuedWhere(ids: number[]): SQL | undefined`.
- Produces, from `prospects.ts`: `ProspectFilter` gains `decision?: string; band?: string`; `DECISION_FILTERS = ["undecided", "qualified", "dismissed"] as const`; `prospectListWhere(filter: ProspectFilter): SQL | undefined`. `listProspects(filter)` keeps its signature and hides dismissed prospects unless `filter.decision === "dismissed"`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/prospecting-queue.test.ts`. First add these imports at the top of the file, beside the existing ones:

```ts
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
```

and add `markQueuedWhere` and `queueableWhere` to the existing import from `../src/lib/prospecting/queue.ts`. Then append:

```ts
function render(where: SQL | undefined) {
  assert.ok(where, "expected a where clause");
  return new PgDialect().sqlToQuery(where);
}

/** Asserts `column <> 'dismissed'` with the value bound to its own placeholder. */
function assertExcludesDismissed(query: { sql: string; params: unknown[] }) {
  const index = query.params.indexOf("dismissed");
  assert.notEqual(index, -1, "dismissed is not a bound parameter");
  assert.ok(
    query.sql.includes(`"prospects"."decision" <> $${index + 1}`),
    `no decision guard in: ${query.sql}`,
  );
}

test("the queueable SELECT refuses dismissed and suppressed prospects", () => {
  const query = render(queueableWhere([1, 2]));
  assertExcludesDismissed(query);
  assert.match(query.sql, /"prospects"\."suppressed_at" is null/);
  assert.match(query.sql, /"prospects"\."status" = \$\d+/);
});

test("the queueing UPDATE repeats the dismissed and suppressed guards at write time", () => {
  // A dismissal that commits between the read and the write must still win,
  // exactly as a suppression does.
  const query = render(markQueuedWhere([1, 2]));
  assertExcludesDismissed(query);
  assert.match(query.sql, /"prospects"\."suppressed_at" is null/);
});
```

Create `tests/prospecting-list-filter.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { PgDialect } from "drizzle-orm/pg-core";
import { prospectListWhere, type ProspectFilter } from "../src/lib/prospecting/prospects.ts";

function render(filter: ProspectFilter) {
  const where = prospectListWhere(filter);
  assert.ok(where, "expected a where clause");
  return new PgDialect().sqlToQuery(where);
}

test("dismissed prospects are hidden when no decision filter is chosen", () => {
  const query = render({});
  const index = query.params.indexOf("dismissed");
  assert.ok(query.sql.includes(`"prospects"."decision" <> $${index + 1}`), query.sql);
});

test("an unknown decision filter falls back to hiding dismissed prospects", () => {
  assert.match(render({ decision: "maybe" }).sql, /"prospects"\."decision" <> \$\d+/);
});

test("each decision filter selects exactly that decision", () => {
  for (const [decision, value] of [
    ["qualified", "qualified"],
    ["dismissed", "dismissed"],
    ["undecided", ""],
  ] as const) {
    const query = render({ decision });
    const index = query.params.indexOf(value);
    assert.ok(query.sql.includes(`"prospects"."decision" = $${index + 1}`), `${decision}: ${query.sql}`);
    assert.doesNotMatch(query.sql, /"prospects"\."decision" <>/);
  }
});

test("a band filter selects its score range and an unknown band is ignored", () => {
  const limited = render({ band: "limited" });
  assert.match(limited.sql, /"prospects"\."total_score" between \$\d+ and \$\d+/);
  assert.ok(limited.params.includes(25) && limited.params.includes(49));

  assert.doesNotMatch(render({ band: "excellent" }).sql, /between/);
});

test("the existing filters still apply alongside the new ones", () => {
  const query = render({ status: "audited", country: "AU", decision: "qualified", band: "strong" });
  assert.match(query.sql, /"prospects"\."status" = /);
  assert.match(query.sql, /"prospects"\."country" = /);
  assert.ok(query.params.includes("audited") && query.params.includes("AU"));
  assert.ok(query.params.includes(75) && query.params.includes(100));
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test --experimental-strip-types tests/prospecting-queue.test.ts tests/prospecting-list-filter.test.ts`
Expected: FAIL — `queueableWhere`, `markQueuedWhere` and `prospectListWhere` are not exported.

- [ ] **Step 3: Guard enqueueing**

In `src/lib/prospecting/queue.ts`, add `ne` to the `drizzle-orm` import (`import { and, asc, eq, inArray, isNull, lt, ne, or } from "drizzle-orm";`). Add these two functions directly above `productionEnqueueDependencies`:

```ts
/**
 * What `enqueueProspects` may select: still at `new`, not suppressed, and not
 * dismissed. Dismissal is enforced here and in `markQueuedWhere`, not just by
 * hiding a button, so a direct call to the action cannot queue one either.
 */
export function queueableWhere(ids: number[]) {
  return and(
    inArray(prospects.id, ids),
    eq(prospects.status, "new"),
    isNull(prospects.suppressedAt),
    ne(prospects.decision, "dismissed"),
  );
}

/** The write-time guard: the opt-out and dismissal checks again, at the UPDATE. */
export function markQueuedWhere(ids: number[]) {
  return and(
    inArray(prospects.id, ids),
    isNull(prospects.suppressedAt),
    ne(prospects.decision, "dismissed"),
  );
}
```

In `productionEnqueueDependencies`, replace the `selectQueueable` `.where(and(...))` argument with `.where(queueableWhere(ids))`, and the `markQueued` `.where(and(inArray(prospects.id, ids), isNull(prospects.suppressedAt)))` with `.where(markQueuedWhere(ids))`. Update the `EnqueueDependencies.selectQueueable` doc comment to `/** Prospects that may be queued: still at \`new\`, not suppressed, not dismissed. */`.

In the doc comment on `enqueueProspects`, append this paragraph before the closing `*/`:

```ts
 *
 * A dismissed prospect is refused by the same two statements, for the same
 * reason: a dismissal committing between the read and the write must win.
```

- [ ] **Step 4: Filter the list by decision and band**

In `src/lib/prospecting/prospects.ts`, change the `drizzle-orm` import to `import { and, between, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";`, and add `BANDS` to the existing `./qualify.ts` import (`import { BANDS, qualificationSnapshot, qualifyProspect } from "./qualify.ts";`).

Replace `ProspectFilter` and `listProspects` with:

```ts
export type ProspectFilter = {
  status?: string;
  opportunity?: string;
  country?: string;
  industry?: string;
  /** One of `DECISION_FILTERS`. Anything else hides dismissed prospects. */
  decision?: string;
  /** A `BandKey`. Anything else is ignored. */
  band?: string;
};

export const DECISION_FILTERS = ["undecided", "qualified", "dismissed"] as const;

/**
 * Dismissed prospects are hidden unless asked for by name: a dismissal is the
 * reviewer saying "stop showing me this".
 */
function decisionClause(decision: string | undefined) {
  switch (decision) {
    case "qualified":
    case "dismissed":
      return eq(prospects.decision, decision);
    case "undecided":
      return eq(prospects.decision, "");
    default:
      return ne(prospects.decision, "dismissed");
  }
}

export function prospectListWhere(filter: ProspectFilter) {
  const band = BANDS.find((candidate) => candidate.key === filter.band);
  return and(
    filter.status ? eq(prospects.status, filter.status) : undefined,
    filter.opportunity ? eq(prospects.primaryOpportunity, filter.opportunity) : undefined,
    filter.country ? eq(prospects.country, filter.country) : undefined,
    filter.industry ? eq(prospects.industry, filter.industry) : undefined,
    decisionClause(filter.decision),
    // Bands are read from the stored effective total, which is exactly what
    // the list shows in its Score column.
    band ? between(prospects.totalScore, band.min, band.max) : undefined,
  );
}

export async function listProspects(filter: ProspectFilter = {}): Promise<Prospect[]> {
  return getDb()
    .select()
    .from(prospects)
    .where(prospectListWhere(filter))
    .orderBy(desc(prospects.totalScore), desc(prospects.id))
    .limit(200);
}
```

- [ ] **Step 5: Note the behaviour where "Queue all new" relies on it**

In `src/lib/prospecting/actions.ts`, inside `queueAllNew`, put this comment directly above `const ids = (await listProspects({ status: "new" })).map((p) => p.id);`:

```ts
  // `listProspects` hides dismissed prospects by default, and
  // `enqueueProspects` refuses them again in SQL, so neither the list nor a
  // stale id can queue one.
```

- [ ] **Step 6: Run the checks**

Run: `node --test --experimental-strip-types tests/prospecting-queue.test.ts tests/prospecting-list-filter.test.ts`
Expected: PASS.

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: 169 tests pass; typecheck and lint exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/lib/prospecting/queue.ts src/lib/prospecting/prospects.ts src/lib/prospecting/actions.ts tests/prospecting-queue.test.ts tests/prospecting-list-filter.test.ts
git commit -m "Refuse to queue dismissed prospects and filter the list by decision and band" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---
### Task 9: Reviewer actions and the Qualification panel

**Files:**
- Create: `src/lib/prospecting/qualification-actions.ts`
- Create: `src/components/admin/prospecting/score-adjust-controls.tsx`
- Create: `src/components/admin/prospecting/opportunity-controls.tsx`
- Create: `src/components/admin/prospecting/decision-controls.tsx`
- Create: `src/components/admin/prospecting/qualification-panel.tsx`
- Modify: `src/app/admin/prospecting/prospects/[id]/page.tsx`
- Modify: `src/components/admin/ui.tsx` (`TONES`)
- Test: `tests/prospecting-actions-module.test.ts` (append)

**Interfaces:**
- Consumes: the validators (Task 5); `COMPONENTS`, `type Qualification` (Task 4); `loadQualification`, `latestUsableAudit`, `refreshQualificationSnapshot`, and the six set and clear functions (Task 7); `OPPORTUNITIES`, `type ComponentKey`, `type Opportunity`, `type OpportunityOverride` (Task 4).
- Produces, all `"use server"` and each returning `Promise<{ ok: true } | { error: string }>`: `adjustScoreAction(prospectId: number, component: string, points: number, reason: string)`, `clearScoreAdjustmentAction(prospectId: number, component: string)`, `setOpportunityOverrideAction(prospectId: number, primary: string, secondary: string[], reason: string)`, `clearOpportunityOverrideAction(prospectId: number)`, `qualifyProspectAction(prospectId: number, reason: string)`, `dismissProspectAction(prospectId: number, reason: string)`, `clearDecisionAction(prospectId: number)`.

UI is verified by typecheck, lint and build, as with the rest of this admin. Record in the task report how each action covers the Global Constraints' action rules.

- [ ] **Step 1: Write the failing module test**

Append to `tests/prospecting-actions-module.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types tests/prospecting-actions-module.test.ts`
Expected: FAIL with `ENOENT` for `qualification-actions.ts`.

- [ ] **Step 3: Create `src/lib/prospecting/qualification-actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { authorise } from "@/lib/auth/guard";
import { audit } from "@/lib/auth/audit";
import { COMPONENTS } from "@/lib/prospecting/qualify";
import {
  clearDecision,
  clearOpportunityOverride,
  clearScoreAdjustment,
  latestUsableAudit,
  refreshQualificationSnapshot,
  setDecision,
  setOpportunityOverride,
  setScoreAdjustment,
} from "@/lib/prospecting/qualification";
import { getProspect } from "@/lib/prospecting/prospects";
import {
  validateAdjustment,
  validateComponentKey,
  validateDecision,
  validateOverride,
  validateProspectId,
} from "@/lib/prospecting/review-input";

export type QualificationActionResult = { ok: true } | { error: string };

const GONE = "That prospect no longer exists.";

/** Both pages show qualification: the list through its snapshot columns. */
function revalidateProspect(id: number) {
  revalidatePath("/admin/prospecting/prospects");
  revalidatePath(`/admin/prospecting/prospects/${id}`);
}

function labelFor(component: string): string {
  return COMPONENTS.find((definition) => definition.key === component)?.label ?? component;
}

export async function adjustScoreAction(
  prospectId: number,
  component: string,
  points: number,
  reason: string,
): Promise<QualificationActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };
  const input = validateAdjustment({ component, points, reason });
  if (!input.ok) return { error: input.error };

  const definition = COMPONENTS.find((c) => c.key === input.value.component);
  let auditId: number | null = null;
  if (definition?.findingBased) {
    // Pinned to the audit whose findings the reviewer judged, so a newer audit
    // makes the adjustment stale instead of letting it outlive its evidence.
    const latest = await latestUsableAudit(id.value);
    if (!latest) return { error: "Run an audit before adjusting a website component." };
    auditId = latest.id;
  }

  const saved = await setScoreAdjustment(id.value, input.value.component, {
    points: input.value.points,
    reason: input.value.reason,
    byUserId: authorised.user.id,
    byEmail: authorised.user.email,
    at: new Date().toISOString(),
    auditId,
  });
  if (!saved) return { error: GONE };

  await refreshQualificationSnapshot(id.value);
  await audit({
    action: "prospect.score.adjust",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
    detail: `${labelFor(input.value.component)} → ${input.value.points}: ${input.value.reason}`,
  });
  revalidateProspect(id.value);
  return { ok: true };
}

export async function clearScoreAdjustmentAction(
  prospectId: number,
  component: string,
): Promise<QualificationActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };
  const key = validateComponentKey(component);
  if (!key.ok) return { error: key.error };

  if (!(await clearScoreAdjustment(id.value, key.value))) return { error: GONE };

  await refreshQualificationSnapshot(id.value);
  await audit({
    action: "prospect.score.clear",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
    detail: labelFor(key.value),
  });
  revalidateProspect(id.value);
  return { ok: true };
}

export async function setOpportunityOverrideAction(
  prospectId: number,
  primary: string,
  secondary: string[],
  reason: string,
): Promise<QualificationActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };
  const input = validateOverride({ primary, secondary, reason });
  if (!input.ok) return { error: input.error };

  const saved = await setOpportunityOverride(id.value, {
    ...input.value,
    byUserId: authorised.user.id,
    byEmail: authorised.user.email,
    at: new Date().toISOString(),
  });
  if (!saved) return { error: GONE };

  await refreshQualificationSnapshot(id.value);
  const chosen = [input.value.primary, ...input.value.secondary].join(", ");
  await audit({
    action: "prospect.opportunity.set",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
    detail: `${chosen}: ${input.value.reason}`,
  });
  revalidateProspect(id.value);
  return { ok: true };
}

export async function clearOpportunityOverrideAction(prospectId: number): Promise<QualificationActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };

  if (!(await clearOpportunityOverride(id.value))) return { error: GONE };

  await refreshQualificationSnapshot(id.value);
  await audit({
    action: "prospect.opportunity.clear",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
  });
  revalidateProspect(id.value);
  return { ok: true };
}

export async function qualifyProspectAction(
  prospectId: number,
  reason: string,
): Promise<QualificationActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };
  const input = validateDecision({ decision: "qualified", reason });
  if (!input.ok) return { error: input.error };

  const prospect = await getProspect(id.value);
  if (!prospect) return { error: GONE };
  if (prospect.suppressedAt !== null) {
    return { error: "This prospect is suppressed. Unsuppress it before qualifying." };
  }

  const saved = await setDecision(id.value, { ...input.value, userId: authorised.user.id });
  if (!saved) {
    return { error: "This prospect was suppressed or removed while you were deciding. Reload and try again." };
  }

  await audit({
    action: "prospect.qualify",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
    detail: input.value.reason,
  });
  revalidateProspect(id.value);
  return { ok: true };
}

export async function dismissProspectAction(
  prospectId: number,
  reason: string,
): Promise<QualificationActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };
  const input = validateDecision({ decision: "dismissed", reason });
  if (!input.ok) return { error: input.error };

  if (!(await setDecision(id.value, { ...input.value, userId: authorised.user.id }))) return { error: GONE };

  await audit({
    action: "prospect.dismiss",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
    detail: input.value.reason,
  });
  revalidateProspect(id.value);
  return { ok: true };
}

export async function clearDecisionAction(prospectId: number): Promise<QualificationActionResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  const id = validateProspectId(prospectId);
  if (!id.ok) return { error: id.error };

  if (!(await clearDecision(id.value))) return { error: GONE };

  await audit({
    action: "prospect.decision.clear",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id.value,
  });
  revalidateProspect(id.value);
  return { ok: true };
}
```

- [ ] **Step 4: Run the module test**

Run: `node --test --experimental-strip-types tests/prospecting-actions-module.test.ts`
Expected: PASS.

- [ ] **Step 5: Create `src/components/admin/prospecting/score-adjust-controls.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import {
  adjustScoreAction,
  clearScoreAdjustmentAction,
} from "@/lib/prospecting/qualification-actions";
import type { ComponentKey } from "@/lib/prospecting/types";

const PLACEHOLDERS: Record<ComponentKey, string> = {
  websiteUx: "e.g. Checked on a phone; the fixed-width finding is real",
  seo: "e.g. Title and description are missing on every page checked",
  technical: "e.g. The broken links point to a retired booking system",
  conversion: "e.g. The enquiry form sits below the fold on the homepage",
  businessFit: "e.g. Industry is property management; target fit",
  decisionMakerAvailability: "e.g. Director listed on the About page",
};

const LINK =
  "text-[0.8125rem] font-medium underline decoration-rule-strong underline-offset-4 hover:decoration-accent disabled:opacity-60";

/**
 * Sets or clears a reviewer's value for one score component. The server
 * re-validates the bounds and the reason; the checks here only save a trip.
 */
export function ScoreAdjustControls({
  prospectId,
  component,
  cap,
  automatic,
  adjusted,
}: {
  prospectId: number;
  component: ComponentKey;
  cap: number;
  automatic: number;
  adjusted: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [points, setPoints] = useState(String(automatic));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    const value = Number(points);
    if (!Number.isInteger(value) || value < 0 || value > cap) {
      setError(`Enter a whole number from 0 to ${cap}.`);
      return;
    }
    if (!reason.trim()) {
      setError("Give a reason for this adjustment.");
      return;
    }
    start(async () => {
      setError(null);
      const result = await adjustScoreAction(prospectId, component, value, reason.trim());
      if ("error" in result) {
        setError(result.error);
      } else {
        setOpen(false);
        setReason("");
      }
    });
  }

  function clear() {
    start(async () => {
      setError(null);
      const result = await clearScoreAdjustmentAction(prospectId, component);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="mt-2">
      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={`adjust-${component}-points`} className="text-[0.8125rem] text-graphite">
              Points
            </label>
            <input
              id={`adjust-${component}-points`}
              type="number"
              min={0}
              max={cap}
              step={1}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-20 rounded-sm border border-rule-strong bg-white px-2 py-1.5 text-[0.875rem] focus:border-ink focus:outline-none"
            />
            <span className="font-mono text-micro text-faint">of {cap}</span>
          </div>
          <label htmlFor={`adjust-${component}-reason`} className="block text-[0.8125rem] text-graphite">
            Reason
          </label>
          <input
            id={`adjust-${component}-reason`}
            value={reason}
            maxLength={300}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder={PLACEHOLDERS[component]}
            className="w-full rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] focus:border-ink focus:outline-none"
          />
          {component === "decisionMakerAvailability" ? (
            <p className="text-[0.75rem] text-faint">
              Name the role and where the company publishes it. Never name the person.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-sm bg-ink px-3 py-1.5 text-[0.8125rem] font-medium text-on-ink transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save adjustment"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="rounded-sm border border-rule-strong px-3 py-1.5 text-[0.8125rem] font-medium transition-colors hover:border-ink disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setOpen(true)} className={LINK}>
            Adjust
          </button>
          {adjusted ? (
            <button type="button" disabled={pending} onClick={clear} className={LINK}>
              {pending ? "Clearing…" : "Clear adjustment"}
            </button>
          ) : null}
        </div>
      )}
      {error ? (
        <p role="alert" className="mt-1 text-[0.8125rem] text-muted">
          {error}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 6: Create `src/components/admin/prospecting/opportunity-controls.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import {
  clearOpportunityOverrideAction,
  setOpportunityOverrideAction,
} from "@/lib/prospecting/qualification-actions";
import { OPPORTUNITIES, type Opportunity } from "@/lib/prospecting/types";

const LINK =
  "text-[0.8125rem] font-medium underline decoration-rule-strong underline-offset-4 hover:decoration-accent disabled:opacity-60";

/**
 * A reviewer's override of the opportunities. It is the only way to reach
 * Automation, API / Integration or Custom Software, which a homepage cannot
 * evidence. Clearing it restores the automatic set.
 */
export function OpportunityControls({
  prospectId,
  overridden,
  primary,
  secondary,
}: {
  prospectId: number;
  overridden: boolean;
  primary: Opportunity | null;
  secondary: Opportunity[];
}) {
  const [open, setOpen] = useState(false);
  const [chosenPrimary, setChosenPrimary] = useState<Opportunity>(primary ?? "Build Audit");
  const [chosenSecondary, setChosenSecondary] = useState<Opportunity[]>(secondary);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    if (!reason.trim()) {
      setError("Give a reason for this override.");
      return;
    }
    start(async () => {
      setError(null);
      const result = await setOpportunityOverrideAction(
        prospectId,
        chosenPrimary,
        chosenSecondary.filter((o) => o !== chosenPrimary),
        reason.trim(),
      );
      if ("error" in result) {
        setError(result.error);
      } else {
        setOpen(false);
        setReason("");
      }
    });
  }

  function clear() {
    start(async () => {
      setError(null);
      const result = await clearOpportunityOverrideAction(prospectId);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="mt-3">
      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-3"
        >
          <div>
            <label htmlFor={`override-primary-${prospectId}`} className="block text-[0.8125rem] text-graphite">
              Primary
            </label>
            <select
              id={`override-primary-${prospectId}`}
              value={chosenPrimary}
              onChange={(e) => setChosenPrimary(e.target.value as Opportunity)}
              className="mt-1 rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] focus:border-ink focus:outline-none"
            >
              {OPPORTUNITIES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend className="text-[0.8125rem] text-graphite">Secondary</legend>
            <div className="mt-1 grid gap-1 sm:grid-cols-2">
              {OPPORTUNITIES.filter((o) => o !== chosenPrimary).map((o) => (
                <label key={o} className="flex items-center gap-2 text-[0.8125rem] text-muted">
                  <input
                    type="checkbox"
                    checked={chosenSecondary.includes(o)}
                    onChange={(e) =>
                      setChosenSecondary((current) =>
                        e.target.checked ? [...current, o] : current.filter((c) => c !== o),
                      )
                    }
                  />
                  {o}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor={`override-reason-${prospectId}`} className="block text-[0.8125rem] text-graphite">
              Reason
            </label>
            <input
              id={`override-reason-${prospectId}`}
              value={reason}
              maxLength={300}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. The About page describes quoting done by hand from spreadsheets"
              className="mt-1 w-full rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] focus:border-ink focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-sm bg-ink px-3 py-1.5 text-[0.8125rem] font-medium text-on-ink transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save override"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="rounded-sm border border-rule-strong px-3 py-1.5 text-[0.8125rem] font-medium transition-colors hover:border-ink disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setOpen(true)} className={LINK}>
            Override opportunities
          </button>
          {overridden ? (
            <button type="button" disabled={pending} onClick={clear} className={LINK}>
              {pending ? "Clearing…" : "Clear override"}
            </button>
          ) : null}
        </div>
      )}
      {error ? (
        <p role="alert" className="mt-1 text-[0.8125rem] text-muted">
          {error}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 7: Create `src/components/admin/prospecting/decision-controls.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import {
  clearDecisionAction,
  dismissProspectAction,
  qualifyProspectAction,
} from "@/lib/prospecting/qualification-actions";

/**
 * Qualify, dismiss, or clear the reviewer's decision. Dismissing needs a
 * reason and qualifying does not. All three are reversible and logged.
 */
export function DecisionControls({
  prospectId,
  decision,
  suppressed,
}: {
  prospectId: number;
  decision: string;
  suppressed: boolean;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const trimmed = reason.trim();

  function run(action: () => Promise<{ ok: true } | { error: string }>) {
    start(async () => {
      setError(null);
      const result = await action();
      if ("error" in result) setError(result.error);
      else setReason("");
    });
  }

  return (
    <div className="mt-4">
      <label htmlFor={`decision-reason-${prospectId}`} className="text-[0.875rem] font-medium">
        Reason
      </label>
      <input
        id={`decision-reason-${prospectId}`}
        value={reason}
        maxLength={300}
        onChange={(e) => {
          setReason(e.target.value);
          if (error) setError(null);
        }}
        placeholder="Required to dismiss, optional to qualify"
        className="mt-1.5 w-full rounded-sm border border-rule-strong bg-white px-3 py-2.5 text-[0.9375rem] focus:border-ink focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || suppressed}
          onClick={() => run(() => qualifyProspectAction(prospectId, trimmed))}
          className="rounded-sm bg-ink px-4 py-2 text-[0.875rem] font-medium text-on-ink transition-colors hover:opacity-90 disabled:opacity-60"
        >
          Qualify
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!trimmed) {
              setError("Give a reason before dismissing this prospect.");
              return;
            }
            run(() => dismissProspectAction(prospectId, trimmed));
          }}
          className="rounded-sm border border-rule-strong px-4 py-2 text-[0.875rem] font-medium transition-colors hover:border-ink disabled:opacity-60"
        >
          Dismiss
        </button>
        {decision ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => clearDecisionAction(prospectId))}
            className="rounded-sm border border-rule-strong px-4 py-2 text-[0.875rem] font-medium transition-colors hover:border-ink disabled:opacity-60"
          >
            Clear decision
          </button>
        ) : null}
      </div>
      {suppressed ? (
        <p className="mt-2 text-[0.75rem] text-faint">A suppressed prospect cannot be qualified.</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-[0.8125rem] text-muted">
          {error}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 8: Create `src/components/admin/prospecting/qualification-panel.tsx`**

```tsx
import { Status, when } from "@/components/admin/ui";
import type { Qualification } from "@/lib/prospecting/qualify";
import type { OpportunityOverride } from "@/lib/prospecting/types";
import { DecisionControls } from "./decision-controls";
import { OpportunityControls } from "./opportunity-controls";
import { ScoreAdjustControls } from "./score-adjust-controls";

/**
 * A prospect's qualification, rendered from a fresh `qualifyProspect` result
 * and never from the list's snapshot columns, so every number can be read
 * back against the evidence beside it.
 */
export function QualificationPanel({
  prospectId,
  qualification,
  override,
  decision,
  suppressed,
}: {
  prospectId: number;
  qualification: Qualification;
  override: OpportunityOverride | null;
  decision: { decision: string; reason: string; decidedBy: number | null; decidedAt: Date | null };
  suppressed: boolean;
}) {
  const { band, automaticOpportunities: automatic, effectiveOpportunities: effective } = qualification;

  return (
    <section className="mt-6 rounded-sm border border-rule bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[1.0625rem] font-semibold">Qualification</h2>
        <p className="font-mono text-micro text-faint">
          {qualification.auditId ? `Scored from audit #${qualification.auditId}` : "No completed audit yet"}
        </p>
      </div>

      <div className="mt-4 border-l-2 border-accent bg-paper px-4 py-3">
        <p className="font-mono text-[1.5rem] font-medium text-graphite">
          {qualification.effectiveTotal}
          <span className="text-[0.875rem] text-muted">/100</span>
          {qualification.effectiveTotal !== qualification.automaticTotal ? (
            <span className="ml-2 text-[0.8125rem] text-muted">automatic {qualification.automaticTotal}</span>
          ) : null}
        </p>
        <p className="mt-1 text-[0.9375rem] font-medium text-graphite">{band.meaning}</p>
        <p className="mt-1 text-[0.875rem] text-muted">Required action: {band.action}</p>
        <p className="mt-2 text-[0.75rem] text-faint">
          A recommendation for review. Only a reviewer qualifies a prospect.
        </p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-rule">
              {["Component", "Automatic", "Effective", "Evidence and adjustment"].map((h) => (
                <th key={h} scope="col" className="px-3 py-2 font-mono text-micro font-normal text-faint">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {qualification.components.map((c) => (
              <tr key={c.key} className="border-b border-rule align-top last:border-b-0">
                <td className="px-3 py-3 text-[0.875rem] font-medium text-graphite">
                  {c.label}
                  <span className="block font-mono text-micro font-normal text-faint">of {c.cap}</span>
                </td>
                <td className="px-3 py-3 font-mono text-[0.875rem] text-muted">{c.automatic}</td>
                <td className="px-3 py-3 font-mono text-[0.875rem] text-graphite">{c.effective}</td>
                <td className="px-3 py-3 text-[0.8125rem] text-muted">
                  <ul className="space-y-0.5">
                    {c.evidence.map((line, index) => (
                      <li key={`${c.key}-${index}`}>{line}</li>
                    ))}
                  </ul>
                  {c.adjustment ? (
                    <div
                      className={`mt-2 border-l-2 pl-2 ${c.adjustmentApplies ? "border-ink" : "border-accent"}`}
                    >
                      <p className="text-graphite">
                        Adjusted to {c.adjustment.points}: {c.adjustment.reason}
                      </p>
                      <p className="font-mono text-micro text-faint">
                        {c.adjustment.byEmail}, {when(new Date(c.adjustment.at))}
                      </p>
                      {c.adjustmentApplies ? null : (
                        <p className="text-graphite">
                          Made against audit #{c.adjustment.auditId}, now{" "}
                          {qualification.auditId ? `#${qualification.auditId}` : "no usable audit"} —
                          re-check. Not applied.
                        </p>
                      )}
                    </div>
                  ) : null}
                  <ScoreAdjustControls
                    prospectId={prospectId}
                    component={c.key}
                    cap={c.cap}
                    automatic={c.automatic}
                    adjusted={c.adjustment !== null}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-6 border-t border-rule pt-5 lg:grid-cols-2">
        <div>
          <h3 className="text-[0.9375rem] font-semibold">Opportunities</h3>
          <dl className="mt-3 space-y-3 text-[0.875rem]">
            <div>
              <dt className="font-mono text-micro text-faint">
                Primary{effective.overridden ? " — set by a reviewer" : ""}
              </dt>
              <dd className="mt-1 text-graphite">{effective.primary ?? "— no completed audit yet"}</dd>
            </div>
            <div>
              <dt className="font-mono text-micro text-faint">Secondary</dt>
              <dd className="mt-1 text-graphite">
                {effective.secondary.length ? effective.secondary.join(", ") : "—"}
              </dd>
            </div>
            {override ? (
              <div>
                <dt className="font-mono text-micro text-faint">Override reason</dt>
                <dd className="mt-1 text-muted">
                  {override.reason}
                  <span className="block font-mono text-micro text-faint">
                    {override.byEmail}, {when(new Date(override.at))}
                  </span>
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="font-mono text-micro text-faint">Automatic</dt>
              <dd className="mt-1 text-muted">
                {automatic.primary ?? "—"}
                {automatic.secondary.length ? (
                  <ul className="mt-1 space-y-0.5">
                    {automatic.secondary.map((s) => (
                      <li key={s.opportunity}>
                        {s.opportunity}: {s.evidence}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </dd>
            </div>
          </dl>
          <OpportunityControls
            prospectId={prospectId}
            overridden={effective.overridden}
            primary={effective.primary}
            secondary={effective.secondary}
          />
        </div>

        <div>
          <h3 className="text-[0.9375rem] font-semibold">Decision</h3>
          <div className="mt-3 text-[0.875rem]">
            {decision.decision ? (
              <>
                <Status value={decision.decision} />
                <p className="mt-2 text-[0.8125rem] text-muted">{decision.reason || "No reason given."}</p>
                <p className="font-mono text-micro text-faint">
                  {when(decision.decidedAt)}
                  {decision.decidedBy !== null ? ` by user #${decision.decidedBy}` : ""}
                </p>
              </>
            ) : (
              <p className="text-muted">Undecided</p>
            )}
          </div>
          <DecisionControls prospectId={prospectId} decision={decision.decision} suppressed={suppressed} />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 9: Give the two decisions a status tone**

In `src/components/admin/ui.tsx`, add to the `TONES` object after `rejected`:

```ts
  qualified: "bg-ink text-on-ink",
  dismissed: "bg-black/[0.06] text-muted",
```

- [ ] **Step 10: Wire the panel into the detail page**

In `src/app/admin/prospecting/prospects/[id]/page.tsx`:

1. Replace `import { getProspect } from "@/lib/prospecting/prospects";` with:

```ts
import { loadQualification } from "@/lib/prospecting/qualification";
```

and add after the `SuppressControls` import:

```ts
import { QualificationPanel } from "@/components/admin/prospecting/qualification-panel";
```

2. Replace:

```ts
  const prospect = await withRetry(() => getProspect(id));
  if (!prospect) notFound();
```

with:

```ts
  // The breakdown is recomputed on every view rather than read from the
  // snapshot columns, so this page can never disagree with the evidence.
  const loaded = await withRetry(() => loadQualification(id));
  if (!loaded) notFound();
  const { prospect, qualification } = loaded;
```

3. In the Details `<dl>`, change the Score `<dd>` content from `{prospect.totalScore}/100` to `{qualification.effectiveTotal}/100`, and the Primary opportunity `<dd>` content from `{prospect.primaryOpportunity || "—"}` to `{qualification.effectiveOpportunities.primary ?? "—"}`.

4. Insert directly after the closing `</div>` of the `grid gap-6 lg:grid-cols-12` block, before the Audit history `<section className="mt-6">`:

```tsx
      <QualificationPanel
        prospectId={prospect.id}
        qualification={qualification}
        override={prospect.opportunityOverride}
        decision={{
          decision: prospect.decision,
          reason: prospect.decisionReason,
          decidedBy: prospect.decidedBy,
          decidedAt: prospect.decidedAt,
        }}
        suppressed={suppressed}
      />
```

- [ ] **Step 11: Run the checks**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: 170 tests pass; typecheck, lint and build exit 0. The build must list `/admin/prospecting/prospects/[id]` as a dynamic route.

- [ ] **Step 12: Commit**

```bash
git add src/lib/prospecting/qualification-actions.ts src/components/admin/prospecting/score-adjust-controls.tsx src/components/admin/prospecting/opportunity-controls.tsx src/components/admin/prospecting/decision-controls.tsx src/components/admin/prospecting/qualification-panel.tsx "src/app/admin/prospecting/prospects/[id]/page.tsx" src/components/admin/ui.tsx tests/prospecting-actions-module.test.ts
git commit -m "Let a reviewer adjust, override and decide on the prospect page" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---
### Task 10: Band and Decision on the prospect list, and the docs

**Files:**
- Modify: `src/app/admin/prospecting/prospects/page.tsx` (full replacement below)
- Modify: `docs/prospecting-engine.md` (the Phase 3 section)

**Interfaces:**
- Consumes: `ProspectFilter.decision` / `.band`, `DECISION_FILTERS` (Task 8); `BANDS`, `bandFor` (Task 4); `OPPORTUNITIES` (Task 4); `Prospect.decision` (Task 6); the `qualified` / `dismissed` tones (Task 9).
- Produces: nothing later tasks use.

- [ ] **Step 1: Replace the list page**

Replace the whole of `src/app/admin/prospecting/prospects/page.tsx` with:

```tsx
import Link from "next/link";
import { requireCapability } from "@/lib/auth/guard";
import { DECISION_FILTERS, listProspects } from "@/lib/prospecting/prospects";
import { BANDS, bandFor } from "@/lib/prospecting/qualify";
import { OPPORTUNITIES } from "@/lib/prospecting/types";
import { withRetry } from "@/lib/queries";
import { Empty, PageTitle, Status, when } from "@/components/admin/ui";
import { QueueActions } from "@/components/admin/prospecting/queue-actions";

export const metadata = { title: "Prospects" };

/**
 * `runQueueNow`, a server action invoked from this page, runs real audits
 * inline via `drainAuditQueue` (bounded to a 45s budget). 60 leaves clear
 * headroom, matching the comment on the audit pages that do the same thing.
 */
export const maxDuration = 60;

const STATUSES = ["new", "queued", "audited", "suppressed"];
const DECISION_LABELS: Record<(typeof DECISION_FILTERS)[number], string> = {
  undecided: "Undecided",
  qualified: "Qualified",
  dismissed: "Dismissed",
};

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    opportunity?: string;
    country?: string;
    industry?: string;
    decision?: string;
    band?: string;
  }>;
}) {
  await requireCapability("prospecting.manage", "/admin/prospecting/prospects");
  const sp = await searchParams;
  const filter = {
    status: sp.status,
    opportunity: sp.opportunity,
    // `country` is stored as an upper-case ISO code and matched with `eq`, and
    // the input's `uppercase` class only restyles the glyphs — the form still
    // submits what was typed. Without this, "au" matches nothing and the empty
    // result is indistinguishable from having no Australian prospects.
    country: sp.country?.toUpperCase(),
    industry: sp.industry,
    decision: sp.decision,
    band: sp.band,
  };
  const filtered = Boolean(
    sp.status || sp.opportunity || sp.country || sp.industry || sp.decision || sp.band,
  );
  const hidingDismissed = sp.decision !== "dismissed";

  const rows = await withRetry(() => listProspects(filter));

  const href = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...filter, ...patch };
    for (const [key, value] of Object.entries(merged)) if (value) params.set(key, value);
    const query = params.toString();
    return `/admin/prospecting/prospects${query ? `?${query}` : ""}`;
  };

  return (
    <>
      <PageTitle
        title="Prospects"
        count={`${rows.length} ${rows.length === 1 ? "prospect" : "prospects"}${
          filtered ? " matching" : ""
        }${rows.length === 200 ? " — showing the top 200 by score" : ""}${
          hidingDismissed ? " · dismissed hidden" : ""
        }`}
        action={<QueueActions />}
      />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        <FilterField label="Country">
          <input
            type="text"
            name="country"
            defaultValue={filter.country ?? ""}
            placeholder="AU"
            maxLength={2}
            className="w-20 rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] uppercase focus:border-ink focus:outline-none"
          />
        </FilterField>
        <FilterField label="Industry">
          <input
            type="text"
            name="industry"
            defaultValue={sp.industry ?? ""}
            placeholder="e.g. Accounting"
            className="rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] focus:border-ink focus:outline-none"
          />
        </FilterField>
        <FilterField label="Opportunity">
          <select
            name="opportunity"
            defaultValue={sp.opportunity ?? ""}
            className="rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] focus:border-ink focus:outline-none"
          >
            <option value="">All</option>
            {OPPORTUNITIES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Decision">
          <select
            name="decision"
            defaultValue={sp.decision ?? ""}
            className="rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] focus:border-ink focus:outline-none"
          >
            <option value="">All except dismissed</option>
            {DECISION_FILTERS.map((d) => (
              <option key={d} value={d}>
                {DECISION_LABELS[d]}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Band">
          <select
            name="band"
            defaultValue={sp.band ?? ""}
            className="rounded-sm border border-rule-strong bg-white px-3 py-2 text-[0.875rem] focus:border-ink focus:outline-none"
          >
            <option value="">All</option>
            {BANDS.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label} ({b.min}–{b.max})
              </option>
            ))}
          </select>
        </FilterField>
        {sp.status ? <input type="hidden" name="status" value={sp.status} /> : null}
        <button
          type="submit"
          className="rounded-sm border border-rule-strong bg-white px-4 py-2 text-[0.875rem] font-medium hover:bg-black/[0.04]"
        >
          Filter
        </button>
      </form>

      <div className="mb-5 flex flex-wrap gap-1.5">
        <FilterChip href={href({ status: undefined })} active={!sp.status}>
          All
        </FilterChip>
        {STATUSES.map((s) => (
          <FilterChip key={s} href={href({ status: s })} active={sp.status === s}>
            {s}
          </FilterChip>
        ))}
      </div>

      {rows.length === 0 ? (
        <Empty>
          {filtered
            ? "No prospects match that filter."
            : "No prospects yet. Import a CSV to get started."}
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-rule bg-white">
          <table className="w-full min-w-[66rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule">
                {[
                  "Company",
                  "Domain",
                  "Industry",
                  "Location",
                  "Status",
                  "Decision",
                  "Score",
                  "Band",
                  "Last audited",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-2.5 font-mono text-micro font-normal text-faint"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-rule last:border-b-0">
                  <td className="px-4 py-3 text-[0.9375rem] font-medium">
                    <Link href={`/admin/prospecting/prospects/${r.id}`} className="hover:underline">
                      {r.companyName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-[0.8125rem] text-muted">
                    <a
                      href={r.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-rule-strong underline-offset-4 hover:decoration-accent"
                    >
                      {r.domain}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">{r.industry || "—"}</td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">
                    {[r.location, r.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Status value={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    {r.decision ? (
                      <Status value={r.decision} />
                    ) : (
                      <span className="text-[0.875rem] text-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[0.875rem] text-graphite">{r.totalScore}</td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">{bandFor(r.totalScore).label}</td>
                  <td className="px-4 py-3 text-[0.875rem] text-muted">{when(r.lastAuditedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/prospecting/prospects/${r.id}`}
                      className="text-[0.875rem] font-medium underline decoration-rule-strong underline-offset-4 hover:decoration-accent"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[0.8125rem] text-muted">
      {label}
      {children}
    </label>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded-sm px-2.5 py-1 font-mono text-micro transition-colors ${
        active ? "bg-ink text-on-ink" : "bg-white text-muted hover:bg-black/[0.04]"
      }`}
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 2: Document Phase 3**

In `docs/prospecting-engine.md`, directly after the paragraph `Qualification is a recommendation to a reviewer, not an automatic decision to contact someone.` in the `### Phase 3 — Prospect Qualification` section, add:

```markdown
**Status:** built on the `prospecting-phase-3` branch. Not in production until merged and migration 0003 is applied. Design: [`docs/superpowers/specs/2026-09-17-prospecting-phase3-design.md`](superpowers/specs/2026-09-17-prospecting-phase3-design.md).

How it works:

- **Score (100).** Website / UX 25, SEO 20, Technical 20 and Conversion 15 come from the latest completed or partial audit's stored findings. Business fit 10 is 5 for a target market (AU, GB/UK, US, CA) and 5 for a target industry matched exactly against a fixed synonym table in `src/lib/prospecting/fit.ts`. Decision-maker availability 10 is 5 for a public business channel with recorded provenance; the other 5 only a reviewer can award, for a decision-making role the company publishes. The reviewer names the role, never the person.
- **Adjustments.** A reviewer can set any component from 0 to its cap, with a reason. The automatic value stays visible. Adjustments to the four website components are pinned to the audit they judged and stop applying after a newer audit.
- **Opportunities.** The primary comes from the website components only. Secondaries use explicit thresholds, and E-commerce appears when Shopify or WooCommerce is detected. A reviewer override is the only route to Automation, API / Integration or Custom Software.
- **Bands.** 75–100 human review before any draft; 50–74 review the evidence; 25–49 do not prioritise outreach; 0–24 do not create outreach.
- **Decision.** Qualified (reason optional) or Dismissed (reason required), both reversible and written to the audit log. A dismissed prospect is hidden from the default list and cannot be queued. A suppressed prospect cannot be qualified.
- **List snapshot.** `prospects.total_score` and `primary_opportunity` hold the effective values and are refreshed after every audit, adjustment, override and re-import that changes fit or contact. After applying migration 0003, or after changing a scoring rule, run `npm run prospecting:requalify` once.
```

- [ ] **Step 3: Run the checks**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: 170 tests pass; typecheck, lint and build exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/prospecting/prospects/page.tsx docs/prospecting-engine.md
git commit -m "Show band and decision on the prospect list and document Phase 3" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## After the tasks (controller only)

These are not implementer tasks.

1. **Migration 0003 on production.** Stop and ask the owner for an explicit go-ahead. Only with it: apply `drizzle/0003_prospect_qualification.sql` the way 0002 was applied (the `@neondatabase/serverless` driver's `query`, or `psql "$DATABASE_URL" -f` if multi-statement SQL is refused), confirm the six columns and the index exist and the existing prospect rows are untouched, then run `npm run prospecting:requalify`.
2. **End-to-end check**, only after step 1: open a prospect, adjust a component, override opportunities, qualify, dismiss and clear; confirm the list's Score and Band follow, dismissed prospects disappear from the default list, "Queue all new" skips them, and each action wrote an `audit_logs` row.
3. **No merge and no push.** Merging to `main` stays the owner's decision.

## Self-review

**Spec coverage.** The qualification model and components are Task 4. Business fit and decision-maker rules are Task 3. Adjustments (bounds, reason, pinning, stale, persistence, clearing, audit log) are Tasks 4, 5, 7 and 9. Primary and secondary opportunities with explicit thresholds and E-commerce are Task 4. WooCommerce detection is Task 2. The override is Tasks 4, 5, 7 and 9. Bands are Task 4. The decision in its own columns, the enqueue guard on both statements, and the seven audit actions are Tasks 6, 8 and 9. Migration 0003 is Task 6, and applying it waits on the owner. `refreshQualificationSnapshot` on all four paths is Task 7. The detail panel is Task 9. List columns, filters, dismissed hidden and "Queue all new" skipping dismissed are Tasks 8 and 10. The drain CLI cold-start fix is Task 1. Each item on the spec's Testing list maps to a test in Tasks 1–8.

**Additions beyond the spec, each small and argued in place:**
- A suppressed prospect cannot be qualified (Task 7 `setDecision`, Task 9). The Qualified shortlist is what outreach draws from.
- With no usable audit the automatic primary is `null`, not Build Audit. Build Audit claims observed signals, and there are none.
- New prospects get their fit and contact snapshot at insert (Task 7), so list and detail agree before the first audit.
- `npm run prospecting:requalify` (Task 7) backfills snapshots after the migration or a rule change.
- `staleScores` on the import result (Task 7), so a snapshot refresh failing after rows are saved is not reported as a failed import.

**Type consistency.** These names are defined once and used unchanged in later tasks: `qualifyProspect`, `QualifyInput`, `Qualification`, `COMPONENTS`, `BANDS`, `bandFor`, `qualificationSnapshot`, `ScoreAdjustment`, `ScoreAdjustments`, `OpportunityOverride`, `ComponentKey`, `FindingComponentKey`, `OPPORTUNITIES`, `validate*`, `loadQualification`, `latestUsableAudit`, `refreshQualificationSnapshot`, `set*` / `clear*`, `decisionValues`, `queueableWhere`, `markQueuedWhere`, `prospectListWhere`, `DECISION_FILTERS`, `withRetry`, `describeError`.
