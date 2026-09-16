# Prospecting Phase 2 — Prospect Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import businesses from CSV, deduplicate them by domain, audit them in the background with the existing Phase 1 engine, and present them to a reviewer ranked by observed opportunity.

**Architecture:** Three pure modules (domain normalization, contact classification, CSV parsing) feed a domain-unique upsert into a new `prospects` table. Enqueueing creates a `prospect_audits` row at `queued` linked to the prospect; a drain function claims those rows through the compare-and-swap that already exists in `transitionAudit` and runs them through the untouched Phase 1 `runAuditJob`. The drain has two callers: a local CLI with no time limit (primary) and a one-batch admin button.

**Tech Stack:** Next.js 16 App Router, TypeScript, Neon PostgreSQL, Drizzle ORM, `node:test` with `--experimental-strip-types`. No new runtime dependencies.

**Spec:** [`docs/superpowers/specs/2026-09-16-prospecting-phase2-design.md`](../specs/2026-09-16-prospecting-phase2-design.md)

## Global Constraints

- **No new runtime dependencies.** The CSV parser is hand-rolled. The project ships eight runtime dependencies and that is deliberate.
- **Never fabricate.** No inferred company data, no guessed industry, no assumed contact. Missing information stays empty; it is never filled in by inference.
- **Contact data:** generic business channels only. Named-individual mailboxes are rejected at parse time, before any write.
- **A suppressed prospect is never revived by a re-import.** Enforced in the upsert's SQL, not application logic.
- **Additive migrations only.** No existing column is altered, no table dropped. The ten existing `prospect_audits` rows must stay valid.
- **Imports inside `src/` and `scripts/` use explicit `.ts` extensions** (`from "./domain.ts"`), matching the existing prospecting modules. App Router files under `src/app/` use the `@/` alias without extensions.
- **Tests:** `node:test` + `node:assert/strict`, one file per module in `tests/`, no Neon and no network access in any test.
- **Commit style:** plain imperative sentence case, no `feat:`/`chore:` prefix — matching `git log` (e.g. "Add a light/dark/auto theme to the admin"). End every commit message with:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- **Capability:** all new routes and actions require the existing `prospecting.manage`.

---

### Task 1: Domain normalization

**Files:**
- Create: `src/lib/prospecting/domain.ts`
- Test: `tests/prospecting-domain.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `normalizeDomain(input: string): string | null`, `websiteUrlForDomain(domain: string): string`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDomain, websiteUrlForDomain } from "../src/lib/prospecting/domain.ts";

test("normalizeDomain reduces a business URL to its deduplication key", () => {
  assert.equal(normalizeDomain("https://www.Example.com/contact?x=1"), "example.com");
  assert.equal(normalizeDomain("example.com"), "example.com");
  assert.equal(normalizeDomain("  HTTP://EXAMPLE.COM:8080/  "), "example.com");
  assert.equal(normalizeDomain("sub.example.co.uk"), "sub.example.co.uk");
  assert.equal(normalizeDomain("example.com."), "example.com");
});

test("normalizeDomain rejects what the audit engine cannot treat as a business site", () => {
  assert.equal(normalizeDomain(""), null);
  assert.equal(normalizeDomain("   "), null);
  assert.equal(normalizeDomain("localhost"), null);
  assert.equal(normalizeDomain("ftp://example.com"), null);
  assert.equal(normalizeDomain("mailto:info@example.com"), null);
  assert.equal(normalizeDomain("https://user:pass@example.com"), null);
  assert.equal(normalizeDomain("192.168.0.1"), null);
  assert.equal(normalizeDomain("https://[::1]/"), null);
  assert.equal(normalizeDomain("not a domain"), null);
});

test("websiteUrlForDomain produces the canonical URL handed to the audit engine", () => {
  assert.equal(websiteUrlForDomain("example.com"), "https://example.com/");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/prospecting-domain.test.ts`
Expected: FAIL — `Cannot find module '../src/lib/prospecting/domain.ts'`

- [ ] **Step 3: Write the implementation**

```ts
/**
 * Domain normalization for prospect deduplication.
 *
 * Purely syntactic and deliberately so: a 2,000-row import would otherwise mean
 * 2,000 DNS lookups, and the SSRF guarantee already lives where it belongs — in
 * `assertSafeUrl` inside `fetchBoundedPage`, which runs on every fetch and every
 * redirect. A domain that resolves somewhere private is caught at audit time.
 */

/** The deduplication key: lowercase host, no scheme, no `www.`, no port, no path. */
export function normalizeDomain(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  let url: URL;
  try {
    url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  // Credentials in a prospect URL are always a mistake or an attack.
  if (url.username || url.password) return null;

  let host = url.hostname.toLowerCase();
  if (host.endsWith(".")) host = host.slice(0, -1);
  if (host.startsWith("www.")) host = host.slice(4);

  if (host.length === 0 || host.length > 253) return null;
  // An IPv6 literal keeps its brackets in `hostname`.
  if (host.startsWith("[")) return null;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return null;
  // A business site always has a dot; this also rejects "localhost".
  if (!host.includes(".")) return null;
  if (!/^[a-z0-9.-]+$/.test(host)) return null;

  return host;
}

/**
 * The URL handed to the audit engine. Built from the normalized domain rather
 * than the source's original string so a tracking query or a stale deep link
 * never becomes the audited page; the engine follows redirects from here.
 */
export function websiteUrlForDomain(domain: string): string {
  return `https://${domain}/`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/prospecting-domain.test.ts`
Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/prospecting/domain.ts tests/prospecting-domain.test.ts
git commit -m "$(cat <<'EOF'
Add domain normalization for prospect deduplication

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Contact classification

**Files:**
- Create: `src/lib/prospecting/contact.ts`
- Test: `tests/prospecting-contact.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `classifyContact(raw: string): ContactResult` where
  `type ContactResult = { ok: true; kind: "role-email" | "url" | "phone"; value: string } | { ok: false; reason: string }`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/prospecting-contact.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```ts
/**
 * Contact classification.
 *
 * Phase 2 stores a public business channel and nothing else. A named
 * individual's work address is personal data under UK GDPR and the Australian
 * Privacy Act, which would make this table a personal-data store with
 * subject-access and erasure obligations. Rejecting those at parse time, before
 * any write, keeps that obligation out of the system entirely.
 */

const ROLE_LOCAL_PARTS = new Set([
  "info", "hello", "contact", "contacts", "enquiries", "enquiry",
  "inquiries", "inquiry", "sales", "admin", "office", "support",
  "team", "mail", "general", "reception", "accounts", "hi",
]);

export type ContactKind = "role-email" | "url" | "phone";

export type ContactResult =
  | { ok: true; kind: ContactKind; value: string }
  | { ok: false; reason: string };

export function classifyContact(raw: string): ContactResult {
  const value = raw.trim();
  if (!value) return { ok: false, reason: "Contact is empty." };

  if (value.includes("@")) {
    if (/\s/.test(value)) return { ok: false, reason: "Contact is not a valid email address." };
    const at = value.lastIndexOf("@");
    const local = value.slice(0, at).toLowerCase();
    const domain = value.slice(at + 1).toLowerCase();
    if (!local || !domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) {
      return { ok: false, reason: "Contact is not a valid email address." };
    }
    if (!ROLE_LOCAL_PARTS.has(local)) {
      return {
        ok: false,
        reason: "Named-individual contacts are not accepted; use a public business channel such as info@.",
      };
    }
    return { ok: true, kind: "role-email", value: `${local}@${domain}` };
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      new URL(value);
    } catch {
      return { ok: false, reason: "Contact URL is malformed." };
    }
    return { ok: true, kind: "url", value };
  }

  if (/^[+()\d\s.-]+$/.test(value) && value.replace(/\D/g, "").length >= 6) {
    return { ok: true, kind: "phone", value };
  }

  return {
    ok: false,
    reason: "Contact must be a role-based email, a contact-page URL, or a phone number.",
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/prospecting-contact.test.ts`
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/prospecting/contact.ts tests/prospecting-contact.test.ts
git commit -m "$(cat <<'EOF'
Accept only public business contact channels on a prospect

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: CSV parsing

**Files:**
- Create: `src/lib/prospecting/csv.ts`
- Test: `tests/prospecting-csv.test.ts`

**Interfaces:**
- Consumes: `normalizeDomain`, `websiteUrlForDomain` (Task 1); `classifyContact` (Task 2).
- Produces:
  - `type ParsedProspect = { companyName: string; domain: string; websiteUrl: string; industry: string; country: string; location: string; contactChannel: string; contactProvenance: string }`
  - `type RowError = { line: number; message: string }`
  - `parseProspectCsv(text: string): { rows: ParsedProspect[]; errors: RowError[] }`
  - `parseCsvRows(text: string): string[][]`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { parseCsvRows, parseProspectCsv } from "../src/lib/prospecting/csv.ts";

test("parseCsvRows handles quotes, embedded commas and newlines, CRLF and a BOM", () => {
  const text = '﻿a,b\r\n"x,1","y\nz"\r\n"say ""hi""",2\r\n';
  assert.deepEqual(parseCsvRows(text), [
    ["a", "b"],
    ["x,1", "y\nz"],
    ['say "hi"', "2"],
  ]);
});

test("a valid file produces normalized prospects", () => {
  const text = [
    "company,website,industry,country,location,contact,contact_source",
    "Acme Pty Ltd,https://www.acme.com.au/about,Accounting,AU,Brisbane,info@acme.com.au,website footer",
    "Beta Ltd,beta.co.uk,,GB,,,",
  ].join("\n");

  const { rows, errors } = parseProspectCsv(text);
  assert.deepEqual(errors, []);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    companyName: "Acme Pty Ltd",
    domain: "acme.com.au",
    websiteUrl: "https://acme.com.au/",
    industry: "Accounting",
    country: "AU",
    location: "Brisbane",
    contactChannel: "info@acme.com.au",
    contactProvenance: "website footer",
  });
  assert.equal(rows[1]!.domain, "beta.co.uk");
  assert.equal(rows[1]!.contactChannel, "");
});

test("a bad row is reported with its line number and never aborts the file", () => {
  const text = [
    "company,website",
    "Good Co,good.com",
    ",orphan.com",
    "No Site,",
    "Bad Host,not a domain",
    "Later Co,later.com",
  ].join("\n");

  const { rows, errors } = parseProspectCsv(text);
  assert.deepEqual(rows.map((r) => r.domain), ["good.com", "later.com"]);
  assert.deepEqual(errors.map((e) => e.line), [3, 4, 5]);
});

test("a named contact is rejected on its row, with the rest of the file kept", () => {
  const text = [
    "company,website,contact,contact_source",
    "Acme,acme.com,jane.smith@acme.com,guess",
    "Beta,beta.com,info@beta.com,website",
  ].join("\n");

  const { rows, errors } = parseProspectCsv(text);
  assert.deepEqual(rows.map((r) => r.domain), ["beta.com"]);
  assert.equal(errors.length, 1);
  assert.match(errors[0]!.message, /Named-individual/);
});

test("a contact without provenance is rejected", () => {
  const text = ["company,website,contact", "Acme,acme.com,info@acme.com"].join("\n");
  const { rows, errors } = parseProspectCsv(text);
  assert.deepEqual(rows, []);
  assert.match(errors[0]!.message, /provenance|contact_source/i);
});

test("missing required headers fail the whole file once", () => {
  const { rows, errors } = parseProspectCsv("name,url\nAcme,acme.com");
  assert.deepEqual(rows, []);
  assert.equal(errors.length, 1);
  assert.match(errors[0]!.message, /company/);
});

test("duplicate domains inside one file collapse to the first occurrence", () => {
  const text = [
    "company,website",
    "Acme,acme.com",
    "Acme Duplicate,https://www.acme.com/contact",
  ].join("\n");
  const { rows, errors } = parseProspectCsv(text);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.companyName, "Acme");
  assert.equal(errors.length, 1);
  assert.match(errors[0]!.message, /already appears/i);
});

test("the row cap is enforced", () => {
  const lines = ["company,website"];
  for (let i = 0; i < 2_001; i += 1) lines.push(`Co ${i},co${i}.com`);
  const { errors } = parseProspectCsv(lines.join("\n"));
  assert.match(errors.at(-1)!.message, /2,000/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/prospecting-csv.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```ts
import { normalizeDomain, websiteUrlForDomain } from "./domain.ts";
import { classifyContact } from "./contact.ts";

export const MAX_ROWS = 2_000;
export const MAX_BYTES = 1_000_000;

export type ParsedProspect = {
  companyName: string;
  domain: string;
  websiteUrl: string;
  industry: string;
  country: string;
  location: string;
  contactChannel: string;
  contactProvenance: string;
};

export type RowError = { line: number; message: string };

/**
 * RFC 4180 field splitting. Hand-rolled rather than adding a dependency: the
 * whole grammar is quoted fields, doubled quotes, and separators.
 */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let started = false;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;

  const endField = () => {
    row.push(field);
    field = "";
    started = true;
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
    started = false;
  };

  for (; i < text.length; i += 1) {
    const char = text[i]!;
    if (quoted) {
      if (char !== '"') {
        field += char;
      } else if (text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        quoted = false;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      started = true;
    } else if (char === ",") {
      endField();
    } else if (char === "\n") {
      endRow();
    } else if (char !== "\r") {
      field += char;
      started = true;
    }
  }
  if (started || field.length > 0 || row.length > 0) endRow();

  return rows;
}

const REQUIRED_HEADERS = ["company", "website"] as const;

function headerIndex(header: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  header.forEach((name, index) => {
    map[name.trim().toLowerCase()] = index;
  });
  return map;
}

export function parseProspectCsv(text: string): {
  rows: ParsedProspect[];
  errors: RowError[];
} {
  const errors: RowError[] = [];
  if (text.length > MAX_BYTES) {
    return { rows: [], errors: [{ line: 0, message: `The file exceeds the ${MAX_BYTES}-byte limit.` }] };
  }

  const raw = parseCsvRows(text).filter((row) => row.some((cell) => cell.trim() !== ""));
  if (raw.length === 0) return { rows: [], errors: [{ line: 0, message: "The file is empty." }] };

  const columns = headerIndex(raw[0]!);
  const missing = REQUIRED_HEADERS.filter((name) => columns[name] === undefined);
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [{ line: 1, message: `Missing required column(s): ${missing.join(", ")}.` }],
    };
  }

  const cell = (row: string[], name: string): string =>
    columns[name] === undefined ? "" : (row[columns[name]!] ?? "").trim();

  const rows: ParsedProspect[] = [];
  const seen = new Map<string, number>();

  for (let index = 1; index < raw.length; index += 1) {
    const line = index + 1;
    if (rows.length >= MAX_ROWS) {
      errors.push({ line, message: `The file exceeds the ${MAX_ROWS.toLocaleString("en-AU")}-row limit.` });
      break;
    }

    const row = raw[index]!;
    const companyName = cell(row, "company");
    if (!companyName) {
      errors.push({ line, message: "Company name is required." });
      continue;
    }

    const website = cell(row, "website");
    if (!website) {
      errors.push({ line, message: "Website is required." });
      continue;
    }

    const domain = normalizeDomain(website);
    if (!domain) {
      errors.push({ line, message: `"${website}" is not a public web address.` });
      continue;
    }

    const firstSeen = seen.get(domain);
    if (firstSeen !== undefined) {
      errors.push({ line, message: `${domain} already appears on line ${firstSeen}.` });
      continue;
    }

    const rawContact = cell(row, "contact");
    const provenance = cell(row, "contact_source");
    let contactChannel = "";
    if (rawContact) {
      if (!provenance) {
        errors.push({ line, message: "A contact needs provenance; set contact_source." });
        continue;
      }
      const contact = classifyContact(rawContact);
      if (!contact.ok) {
        errors.push({ line, message: contact.reason });
        continue;
      }
      contactChannel = contact.value;
    }

    seen.set(domain, line);
    rows.push({
      companyName,
      domain,
      websiteUrl: websiteUrlForDomain(domain),
      industry: cell(row, "industry"),
      country: cell(row, "country").toUpperCase().slice(0, 2),
      location: cell(row, "location"),
      contactChannel,
      contactProvenance: contactChannel ? provenance : "",
    });
  }

  return { rows, errors };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/prospecting-csv.test.ts`
Expected: PASS — 8 tests

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: all pass, exit 0

- [ ] **Step 6: Commit**

```bash
git add src/lib/prospecting/csv.ts tests/prospecting-csv.test.ts
git commit -m "$(cat <<'EOF'
Parse a prospect CSV without aborting on a bad row

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Schema and migration

**Files:**
- Modify: `src/db/schema.ts` (append after `auditFindings`, before the type exports)
- Modify: `src/lib/auth/audit.ts` (extend the `AuditAction` union)
- Create: `drizzle/0002_prospects.sql`

**Interfaces:**
- Consumes: existing `users`, `prospectAudits` tables.
- Produces: `prospects` table export, `ProspectSource` type, `Prospect` / `NewProspect` types, `prospectAudits.prospectId` column.

- [ ] **Step 1: Add the table to the Drizzle schema**

Append to `src/db/schema.ts` after the `auditFindings` definition:

```ts
/** Where one import learned about a prospect. Append-only provenance. */
export type ProspectSource = {
  name: string;
  url: string;
  importedAt: string;
  importedBy: number | null;
};

/**
 * A researched organisation, not an inbound enquiry.
 *
 * `domain` is the deduplication key and is unique: re-importing a list can
 * never create a second row for the same business, which is what stops anyone
 * being worked or contacted twice.
 *
 * `totalScore` and `primaryOpportunity` are snapshots of the latest audit, kept
 * only so the list can sort and filter in SQL. The detail page recalculates
 * from stored findings, because the spec requires scores be explainable rather
 * than trusted as totals.
 */
export const prospects = pgTable(
  "prospects",
  {
    id: serial("id").primaryKey(),
    companyName: text("company_name").notNull(),
    domain: varchar("domain", { length: 253 }).notNull().unique(),
    websiteUrl: text("website_url").notNull(),
    industry: varchar("industry", { length: 80 }).notNull().default(""),
    country: varchar("country", { length: 2 }).notNull().default(""),
    location: text("location").notNull().default(""),
    contactChannel: text("contact_channel").notNull().default(""),
    contactProvenance: text("contact_provenance").notNull().default(""),
    sources: jsonb("sources").$type<ProspectSource[]>().notNull().default([]),
    status: varchar("status", { length: 16 }).notNull().default("new"),
    suppressedAt: timestamp("suppressed_at", { withTimezone: true }),
    suppressionReason: text("suppression_reason").notNull().default(""),
    lastAuditId: integer("last_audit_id"),
    lastAuditedAt: timestamp("last_audited_at", { withTimezone: true }),
    totalScore: integer("total_score").notNull().default(0),
    primaryOpportunity: varchar("primary_opportunity", { length: 32 }).notNull().default(""),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("prospects_status_idx").on(t.status),
    index("prospects_score_idx").on(t.totalScore),
    index("prospects_country_idx").on(t.country),
    index("prospects_industry_idx").on(t.industry),
  ],
);
```

Add to `prospectAudits`'s column object, after `requestedBy`:

```ts
    prospectId: integer("prospect_id"),
```

Add to `prospectAudits`'s index array:

```ts
    index("prospect_audits_prospect_idx").on(t.prospectId),
```

Append to the type exports at the end of the file:

```ts
export type Prospect = typeof prospects.$inferSelect;
export type NewProspect = typeof prospects.$inferInsert;
```

> `lastAuditId` and `prospectId` are plain integers in Drizzle; their foreign keys are added by `ALTER TABLE` in the migration below, because the two tables reference each other and one constraint must be created after both tables exist.

- [ ] **Step 2: Extend the audit action union**

In `src/lib/auth/audit.ts`, replace the line `  | "prospecting.audit.rerun";` with:

```ts
  | "prospecting.audit.rerun"
  | "prospect.import" | "prospect.queue" | "prospect.suppress"
  | "prospect.unsuppress" | "prospect.dismiss";
```

- [ ] **Step 3: Write the migration**

Create `drizzle/0002_prospects.sql`:

```sql
-- Phase 2 prospect discovery.
-- Additive and idempotent: creates one table, adds two nullable columns, and
-- alters no existing column.

BEGIN;

CREATE TABLE IF NOT EXISTS "prospects" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_name" text NOT NULL,
  "domain" varchar(253) NOT NULL,
  "website_url" text NOT NULL,
  "industry" varchar(80) DEFAULT '' NOT NULL,
  "country" varchar(2) DEFAULT '' NOT NULL,
  "location" text DEFAULT '' NOT NULL,
  "contact_channel" text DEFAULT '' NOT NULL,
  "contact_provenance" text DEFAULT '' NOT NULL,
  "sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" varchar(16) DEFAULT 'new' NOT NULL,
  "suppressed_at" timestamp with time zone,
  "suppression_reason" text DEFAULT '' NOT NULL,
  "last_audit_id" integer,
  "last_audited_at" timestamp with time zone,
  "total_score" integer DEFAULT 0 NOT NULL,
  "primary_opportunity" varchar(32) DEFAULT '' NOT NULL,
  "created_by" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "prospects_domain_key" ON "prospects" ("domain");
CREATE INDEX IF NOT EXISTS "prospects_status_idx" ON "prospects" ("status");
CREATE INDEX IF NOT EXISTS "prospects_score_idx" ON "prospects" ("total_score");
CREATE INDEX IF NOT EXISTS "prospects_country_idx" ON "prospects" ("country");
CREATE INDEX IF NOT EXISTS "prospects_industry_idx" ON "prospects" ("industry");

ALTER TABLE "prospect_audits" ADD COLUMN IF NOT EXISTS "prospect_id" integer;
CREATE INDEX IF NOT EXISTS "prospect_audits_prospect_idx" ON "prospect_audits" ("prospect_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prospects_created_by_fk') THEN
    ALTER TABLE "prospects" ADD CONSTRAINT "prospects_created_by_fk"
      FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prospect_audits_prospect_fk') THEN
    ALTER TABLE "prospect_audits" ADD CONSTRAINT "prospect_audits_prospect_fk"
      FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prospects_last_audit_fk') THEN
    ALTER TABLE "prospects" ADD CONSTRAINT "prospects_last_audit_fk"
      FOREIGN KEY ("last_audit_id") REFERENCES "prospect_audits"("id") ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
```

- [ ] **Step 4: Verify the schema typechecks**

Run: `npx tsc --noEmit && npm test`
Expected: exit 0, 61+ tests pass

- [ ] **Step 5: Apply the migration**

Run: `node --env-file=.env -e "const {neon}=require('@neondatabase/serverless');const fs=require('fs');neon(process.env.DATABASE_URL).query(fs.readFileSync('drizzle/0002_prospects.sql','utf8')).then(()=>console.log('applied')).catch(e=>{console.error(e);process.exit(1)})"`

If that driver call is rejected for multi-statement SQL, run the file through `psql "$DATABASE_URL" -f drizzle/0002_prospects.sql` instead.

Verify: the `prospects` table exists and `prospect_audits` has `prospect_id`, and the ten existing audit rows are untouched.

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts src/lib/auth/audit.ts drizzle/0002_prospects.sql
git commit -m "$(cat <<'EOF'
Add a prospects table keyed on a unique normalized domain

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Prospect persistence

**Files:**
- Create: `src/lib/prospecting/prospects.ts`
- Test: `tests/prospecting-upsert.test.ts`

**Interfaces:**
- Consumes: `ParsedProspect` (Task 3); `prospects` table (Task 4).
- Produces:
  - `type UpsertSummary = { inserted: number; updated: number; skippedSuppressed: number }`
  - `buildUpsertValues(rows: ParsedProspect[], source: ProspectSource, createdBy: number | null): NewProspect[]` — pure, unit-tested
  - `upsertProspects(rows, source, actorId): Promise<UpsertSummary>` — Neon
  - `listProspects(filter): Promise<Prospect[]>`, `getProspect(id): Promise<Prospect | null>`
  - `queueProspects(ids, actorId): Promise<number>`, `suppressProspect(id, reason)`, `unsuppressProspect(id)`

- [ ] **Step 1: Write the failing test for the pure value builder**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { buildUpsertValues } from "../src/lib/prospecting/prospects.ts";

const source = {
  name: "csv",
  url: "prospects-au.csv",
  importedAt: "2026-09-16T00:00:00.000Z",
  importedBy: 4,
};

const row = {
  companyName: "Acme",
  domain: "acme.com",
  websiteUrl: "https://acme.com/",
  industry: "Accounting",
  country: "AU",
  location: "Brisbane",
  contactChannel: "info@acme.com",
  contactProvenance: "website footer",
};

test("buildUpsertValues carries every parsed field and stamps provenance", () => {
  const [value] = buildUpsertValues([row], source, 4);
  assert.equal(value!.domain, "acme.com");
  assert.equal(value!.companyName, "Acme");
  assert.equal(value!.contactProvenance, "website footer");
  assert.equal(value!.createdBy, 4);
  assert.deepEqual(value!.sources, [source]);
});

test("buildUpsertValues never sets lifecycle or score fields", () => {
  const [value] = buildUpsertValues([row], source, 4);
  assert.equal(value!.status, undefined);
  assert.equal(value!.totalScore, undefined);
  assert.equal(value!.suppressedAt, undefined);
  assert.equal(value!.lastAuditId, undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/prospecting-upsert.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```ts
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  getDb,
  prospects,
  type NewProspect,
  type Prospect,
  type ProspectSource,
} from "../../db/index.ts";
import type { ParsedProspect } from "./csv.ts";

export type UpsertSummary = { inserted: number; updated: number; skippedSuppressed: number };

/**
 * Pure: turns parsed rows into insert values. Deliberately sets no lifecycle,
 * score, or suppression field — those belong to the row that already exists and
 * must survive a re-import untouched.
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
  }));
}

/**
 * Domain-unique upsert.
 *
 * The `WHERE prospects.suppressed_at IS NULL` clause is the opt-out guarantee,
 * enforced in SQL rather than application logic: a business that asked not to be
 * contacted is never revived by someone re-importing an old list.
 */
export async function upsertProspects(
  rows: ParsedProspect[],
  source: ProspectSource,
  actorId: number | null,
): Promise<UpsertSummary> {
  if (rows.length === 0) return { inserted: 0, updated: 0, skippedSuppressed: 0 };

  const values = buildUpsertValues(rows, source, actorId);
  const before = await getDb()
    .select({ domain: prospects.domain, suppressedAt: prospects.suppressedAt })
    .from(prospects)
    .where(inArray(prospects.domain, values.map((v) => v.domain!)));

  const existing = new Set(before.map((r) => r.domain));
  const suppressed = new Set(before.filter((r) => r.suppressedAt !== null).map((r) => r.domain));

  const returned = await getDb()
    .insert(prospects)
    .values(values)
    .onConflictDoUpdate({
      target: prospects.domain,
      set: {
        companyName: sql`excluded.company_name`,
        websiteUrl: sql`excluded.website_url`,
        industry: sql`excluded.industry`,
        country: sql`excluded.country`,
        location: sql`excluded.location`,
        contactChannel: sql`excluded.contact_channel`,
        contactProvenance: sql`excluded.contact_provenance`,
        sources: sql`${prospects.sources} || excluded.sources`,
        updatedAt: new Date(),
      },
      setWhere: isNull(prospects.suppressedAt),
    })
    .returning({ domain: prospects.domain });

  const touched = new Set(returned.map((r) => r.domain));
  return {
    inserted: [...touched].filter((d) => !existing.has(d)).length,
    updated: [...touched].filter((d) => existing.has(d)).length,
    skippedSuppressed: [...suppressed].filter((d) => !touched.has(d)).length,
  };
}

export type ProspectFilter = {
  status?: string;
  opportunity?: string;
  country?: string;
  industry?: string;
};

export async function listProspects(filter: ProspectFilter = {}): Promise<Prospect[]> {
  const clauses = [
    filter.status ? eq(prospects.status, filter.status) : undefined,
    filter.opportunity ? eq(prospects.primaryOpportunity, filter.opportunity) : undefined,
    filter.country ? eq(prospects.country, filter.country) : undefined,
    filter.industry ? eq(prospects.industry, filter.industry) : undefined,
  ].filter((clause) => clause !== undefined);

  return getDb()
    .select()
    .from(prospects)
    .where(clauses.length ? and(...clauses) : undefined)
    .orderBy(desc(prospects.totalScore), desc(prospects.id))
    .limit(200);
}

export async function getProspect(id: number): Promise<Prospect | null> {
  const [row] = await getDb().select().from(prospects).where(eq(prospects.id, id)).limit(1);
  return row ?? null;
}

export async function suppressProspect(id: number, reason: string): Promise<void> {
  await getDb()
    .update(prospects)
    .set({
      status: "suppressed",
      suppressedAt: new Date(),
      suppressionReason: reason.slice(0, 300),
      updatedAt: new Date(),
    })
    .where(eq(prospects.id, id));
}

export async function unsuppressProspect(id: number): Promise<void> {
  await getDb()
    .update(prospects)
    .set({ status: "new", suppressedAt: null, suppressionReason: "", updatedAt: new Date() })
    .where(eq(prospects.id, id));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/prospecting-upsert.test.ts`
Expected: PASS — 2 tests

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0. If `setWhere` is not supported by the installed Drizzle version, replace the conflict clause with a raw `sql` upsert carrying `WHERE prospects.suppressed_at IS NULL`, and keep the test unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/lib/prospecting/prospects.ts tests/prospecting-upsert.test.ts
git commit -m "$(cat <<'EOF'
Upsert prospects by domain without reviving a suppressed one

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Queue and drain

**Files:**
- Create: `src/lib/prospecting/drain.ts`
- Create: `src/lib/prospecting/queue.ts`
- Test: `tests/prospecting-drain.test.ts`

**Interfaces:**
- Consumes: `runAuditJob` and `AuditJobResult` from `runner.ts`; `saveAuditRunning` from `audit.ts`; `auditJobDependencies` from `run.ts`.
- Produces:
  - `type DrainSummary = { claimed: number; completed: number; failed: number; skipped: number; stoppedBecause: "empty" | "limit" | "budget" }`
  - `drainAuditQueue(options: DrainOptions, deps: DrainDependencies): Promise<DrainSummary>` — pure, injected
  - `productionDrainDependencies(): DrainDependencies` (in `queue.ts`)
  - `enqueueProspects(ids: number[], actorId: number): Promise<number>` (in `queue.ts`)

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { drainAuditQueue } from "../src/lib/prospecting/drain.ts";

const ok = { status: "completed" as const, analysis: { findings: [] }, score: { total: 27 } };

function deps(overrides = {}) {
  return {
    listQueuedAuditIds: async () => [1, 2, 3],
    claimAudit: async (id: number) => ({ requestedUrl: `https://e${id}.com/`, prospectId: id }),
    runAudit: async () => ok,
    applyResult: async () => undefined,
    now: () => 0,
    delay: async () => undefined,
    ...overrides,
  };
}

test("a drain claims each queued audit once and reports what it did", async () => {
  const ran: number[] = [];
  const summary = await drainAuditQueue(
    { limit: 10, budgetMs: 1_000_000 },
    deps({ runAudit: async (input: { auditId: number }) => { ran.push(input.auditId); return ok; } }),
  );
  assert.deepEqual(ran, [1, 2, 3]);
  assert.equal(summary.claimed, 3);
  assert.equal(summary.completed, 3);
  assert.equal(summary.stoppedBecause, "empty");
});

test("an audit lost to another worker is skipped, not run twice", async () => {
  const ran: number[] = [];
  const summary = await drainAuditQueue(
    { limit: 10, budgetMs: 1_000_000 },
    deps({
      claimAudit: async (id: number) => (id === 2 ? null : { requestedUrl: "https://e.com/", prospectId: id }),
      runAudit: async (input: { auditId: number }) => { ran.push(input.auditId); return ok; },
    }),
  );
  assert.deepEqual(ran, [1, 3]);
  assert.equal(summary.skipped, 1);
  assert.equal(summary.claimed, 2);
});

test("one failing audit does not stop the batch", async () => {
  const summary = await drainAuditQueue(
    { limit: 10, budgetMs: 1_000_000 },
    deps({
      runAudit: async (input: { auditId: number }) =>
        input.auditId === 2 ? { status: "failed" as const, error: "network unavailable" } : ok,
    }),
  );
  assert.equal(summary.completed, 2);
  assert.equal(summary.failed, 1);
});

test("the drain stops cleanly when the time budget is spent", async () => {
  let clock = 0;
  const ran: number[] = [];
  const summary = await drainAuditQueue(
    { limit: 10, budgetMs: 60_000, perAuditMs: 35_000 },
    deps({
      now: () => clock,
      runAudit: async (input: { auditId: number }) => { ran.push(input.auditId); clock += 30_000; return ok; },
    }),
  );
  assert.deepEqual(ran, [1]);
  assert.equal(summary.stoppedBecause, "budget");
});

test("the limit caps how many audits one drain runs", async () => {
  const ran: number[] = [];
  const summary = await drainAuditQueue(
    { limit: 2, budgetMs: 1_000_000 },
    deps({ runAudit: async (input: { auditId: number }) => { ran.push(input.auditId); return ok; } }),
  );
  assert.deepEqual(ran, [1, 2]);
  assert.equal(summary.stoppedBecause, "limit");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/prospecting-drain.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write `src/lib/prospecting/drain.ts`**

```ts
import type { AuditJobResult } from "./runner.ts";

export type ClaimedAudit = { requestedUrl: string; prospectId: number | null };

export type DrainDependencies = {
  /** Oldest-first ids of audits still sitting at `queued`. */
  listQueuedAuditIds: (limit: number) => Promise<number[]>;
  /** Attempts the compare-and-swap claim. `null` means another worker won it. */
  claimAudit: (id: number) => Promise<ClaimedAudit | null>;
  runAudit: (input: { auditId: number; requestedUrl: string }) => Promise<AuditJobResult>;
  applyResult: (input: {
    prospectId: number | null;
    auditId: number;
    result: AuditJobResult;
  }) => Promise<void>;
  now: () => number;
  delay: (ms: number) => Promise<void>;
};

export type DrainOptions = {
  limit: number;
  budgetMs: number;
  /** Reserved for one more audit before the budget is called spent. */
  perAuditMs?: number;
  /** Politeness pause between audits. */
  pauseMs?: number;
};

export type DrainSummary = {
  claimed: number;
  completed: number;
  failed: number;
  skipped: number;
  stoppedBecause: "empty" | "limit" | "budget";
};

const DEFAULT_PER_AUDIT_MS = 35_000;

/**
 * Claims queued audits and runs them one at a time.
 *
 * The claim is the compare-and-swap already in `transitionAudit`: it updates
 * only where the status is still the one it read, so two drains racing for the
 * same audit produce exactly one winner. That is why this function needs no
 * lock of its own.
 */
export async function drainAuditQueue(
  options: DrainOptions,
  dependencies: DrainDependencies,
): Promise<DrainSummary> {
  const perAuditMs = options.perAuditMs ?? DEFAULT_PER_AUDIT_MS;
  const started = dependencies.now();
  const summary: DrainSummary = {
    claimed: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
    stoppedBecause: "empty",
  };

  const candidates = await dependencies.listQueuedAuditIds(options.limit);
  let run = 0;

  for (const auditId of candidates) {
    if (run >= options.limit) {
      summary.stoppedBecause = "limit";
      return summary;
    }
    if (dependencies.now() - started + perAuditMs > options.budgetMs) {
      summary.stoppedBecause = "budget";
      return summary;
    }

    const claimed = await dependencies.claimAudit(auditId);
    if (!claimed) {
      summary.skipped += 1;
      continue;
    }
    summary.claimed += 1;

    const result = await dependencies.runAudit({
      auditId,
      requestedUrl: claimed.requestedUrl,
    });
    if (result.status === "failed") summary.failed += 1;
    else summary.completed += 1;

    await dependencies.applyResult({ prospectId: claimed.prospectId, auditId, result });
    run += 1;

    if (options.pauseMs) await dependencies.delay(options.pauseMs);
  }

  summary.stoppedBecause = run >= options.limit && candidates.length >= options.limit ? "limit" : "empty";
  return summary;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/prospecting-drain.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 5: Write `src/lib/prospecting/queue.ts`**

```ts
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb, prospectAudits, prospects } from "../../db/index.ts";
import { saveAuditRunning } from "./audit.ts";
import { runAuditJob } from "./runner.ts";
import { auditJobDependencies } from "./run.ts";
import type { DrainDependencies } from "./drain.ts";

/** Creates a queued audit row per prospect and moves the prospect to `queued`. */
export async function enqueueProspects(ids: number[], actorId: number): Promise<number> {
  if (ids.length === 0) return 0;

  const targets = await getDb()
    .select({ id: prospects.id, websiteUrl: prospects.websiteUrl })
    .from(prospects)
    .where(and(inArray(prospects.id, ids), eq(prospects.status, "new")));
  if (targets.length === 0) return 0;

  await getDb()
    .insert(prospectAudits)
    .values(
      targets.map((target) => ({
        requestedUrl: target.websiteUrl,
        requestedBy: actorId,
        prospectId: target.id,
      })),
    );

  await getDb()
    .update(prospects)
    .set({ status: "queued", updatedAt: new Date() })
    .where(inArray(prospects.id, targets.map((t) => t.id)));

  return targets.length;
}

export function productionDrainDependencies(): DrainDependencies {
  return {
    listQueuedAuditIds: async (limit) => {
      const rows = await getDb()
        .select({ id: prospectAudits.id })
        .from(prospectAudits)
        .where(eq(prospectAudits.status, "queued"))
        .orderBy(asc(prospectAudits.id))
        .limit(limit);
      return rows.map((row) => row.id);
    },

    claimAudit: async (id) => {
      const [row] = await getDb()
        .select({ requestedUrl: prospectAudits.requestedUrl, prospectId: prospectAudits.prospectId })
        .from(prospectAudits)
        .where(eq(prospectAudits.id, id))
        .limit(1);
      if (!row) return null;
      try {
        // Compare-and-swap. A throw means another worker claimed it first.
        await saveAuditRunning(id);
      } catch {
        return null;
      }
      return { requestedUrl: row.requestedUrl, prospectId: row.prospectId };
    },

    runAudit: (input) =>
      runAuditJob(input, { ...auditJobDependencies(), markRunning: async () => undefined }),

    applyResult: async ({ prospectId, auditId, result }) => {
      if (prospectId === null) return;
      // A failed audit returns the prospect to `new` so it can be queued again,
      // while still pointing at the failed run so the error is readable.
      // Narrow on `result.status` directly: a separate boolean would not narrow
      // the union and `result.score` would not typecheck.
      const scored =
        result.status === "failed"
          ? { status: "new", totalScore: 0, primaryOpportunity: "" }
          : {
              status: "audited",
              totalScore: result.score.total,
              primaryOpportunity: result.score.primaryOpportunity,
            };

      await getDb()
        .update(prospects)
        .set({
          ...scored,
          lastAuditId: auditId,
          lastAuditedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(prospects.id, prospectId));
    },

    now: () => Date.now(),
    delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  };
}
```

> `markRunning` is overridden to a no-op because `claimAudit` has already performed the `queued → running` transition; running it twice would throw.

- [ ] **Step 6: Run the full suite and typecheck**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: all pass

- [ ] **Step 7: Commit**

```bash
git add src/lib/prospecting/drain.ts src/lib/prospecting/queue.ts tests/prospecting-drain.test.ts
git commit -m "$(cat <<'EOF'
Drain queued audits with a compare-and-swap claim

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Import screen

**Files:**
- Create: `src/app/admin/prospecting/import/page.tsx`
- Create: `src/components/admin/prospecting/import-form.tsx`
- Modify: `src/lib/prospecting/actions.ts` (add `previewImport` and `commitImport`)

**Interfaces:**
- Consumes: `parseProspectCsv` (Task 3), `upsertProspects` (Task 5).
- Produces: server actions `previewImport(formData: FormData): Promise<ImportPreview>` and `commitImport(formData: FormData): Promise<ImportResult>`.

- [ ] **Step 1: Add the actions to `src/lib/prospecting/actions.ts`**

Append, keeping the existing `"use server"` header and imports:

```ts
export type ImportPreview =
  | { status: "error"; message: string }
  | { status: "ready"; rows: ParsedProspect[]; errors: RowError[]; sourceName: string };

export type ImportResult =
  | { status: "error"; message: string }
  | { status: "imported"; inserted: number; updated: number; skippedSuppressed: number };

/** Parses only. Nothing is written until the reviewer confirms the preview. */
export async function previewImport(formData: FormData): Promise<ImportPreview> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { status: "error", message: authorised.error };

  const text = String(formData.get("csv") ?? "");
  if (!text.trim()) return { status: "error", message: "Paste or upload a CSV first." };

  const sourceName = String(formData.get("sourceName") ?? "").trim();
  if (!sourceName) return { status: "error", message: "Name the source of this list." };

  const { rows, errors } = parseProspectCsv(text);
  return { status: "ready", rows, errors, sourceName };
}

export async function commitImport(formData: FormData): Promise<ImportResult> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { status: "error", message: authorised.error };

  const text = String(formData.get("csv") ?? "");
  const sourceName = String(formData.get("sourceName") ?? "").trim();
  if (!text.trim() || !sourceName) {
    return { status: "error", message: "The import is missing its file or its source name." };
  }

  const { rows } = parseProspectCsv(text);
  if (rows.length === 0) return { status: "error", message: "No valid rows to import." };

  const summary = await upsertProspects(
    rows,
    {
      name: sourceName,
      url: String(formData.get("sourceUrl") ?? "").trim(),
      importedAt: new Date().toISOString(),
      importedBy: authorised.user.id,
    },
    authorised.user.id,
  );

  await audit({
    action: "prospect.import",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    detail: `${sourceName}: ${summary.inserted} new, ${summary.updated} updated, ${summary.skippedSuppressed} suppressed`,
  });

  return { status: "imported", ...summary };
}
```

Add the imports this needs at the top of the file:

```ts
import { parseProspectCsv, type ParsedProspect, type RowError } from "@/lib/prospecting/csv";
import { upsertProspects } from "@/lib/prospecting/prospects";
```

- [ ] **Step 2: Build the client form**

Create `src/components/admin/prospecting/import-form.tsx` as a `"use client"` component following the shape of the existing `audit-form.tsx`:

- A `sourceName` text input (required) and an optional `sourceUrl`.
- A `<textarea name="csv">` plus an `<input type="file" accept=".csv,text/csv">` whose `change` handler reads the file with `file.text()` into the textarea.
- A "Check file" button calling `previewImport` through `useTransition`.
- On `status: "ready"`, render two tables: valid rows (company, domain, industry, country, location, contact) and errors (line, message). Show counts in headings.
- An "Import N prospects" button, disabled when `rows.length === 0`, calling `commitImport`.
- On `status: "imported"`, show `inserted` / `updated` / `skippedSuppressed` and a link to `/admin/prospecting/prospects`.

Reuse the existing field class string from `audit-form.tsx` and the `Empty` primitive from `@/components/admin/ui`.

- [ ] **Step 3: Build the page**

Create `src/app/admin/prospecting/import/page.tsx`:

```tsx
import { requireCapability } from "@/lib/auth/guard";
import { PageTitle } from "@/components/admin/ui";
import { ImportForm } from "@/components/admin/prospecting/import-form";

export const metadata = { title: "Import prospects" };

export default async function ProspectingImportPage() {
  await requireCapability("prospecting.manage", "/admin/prospecting/import");
  return (
    <>
      <PageTitle
        title="Import prospects"
        count="CSV columns: company, website, industry, country, location, contact, contact_source"
      />
      <ImportForm />
    </>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: exit 0, `/admin/prospecting/import` in the route list

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/prospecting/import src/components/admin/prospecting/import-form.tsx src/lib/prospecting/actions.ts
git commit -m "$(cat <<'EOF'
Import prospects from CSV behind a preview

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Prospect list and detail

**Files:**
- Create: `src/app/admin/prospecting/prospects/page.tsx`
- Create: `src/app/admin/prospecting/prospects/[id]/page.tsx`
- Create: `src/components/admin/prospecting/queue-actions.tsx`
- Modify: `src/lib/prospecting/actions.ts` (add `queueAllNew`, `runQueueNow`, `suppress`, `unsuppress`)
- Modify: `src/components/admin/shell.tsx` (navigation)

**Interfaces:**
- Consumes: `listProspects`, `getProspect`, `suppressProspect`, `unsuppressProspect` (Task 5); `enqueueProspects`, `productionDrainDependencies` (Task 6); `drainAuditQueue` (Task 6); `getAuditForAdmin` (Phase 1).
- Produces: server actions `queueAllNew()`, `runQueueNow()`, `suppressProspectAction(id, reason)`, `unsuppressProspectAction(id)`.

- [ ] **Step 1: Add the actions**

Append to `src/lib/prospecting/actions.ts`:

```ts
export async function queueAllNew(): Promise<{ queued: number } | { error: string }> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };

  const ids = (await listProspects({ status: "new" })).map((p) => p.id);
  const queued = await enqueueProspects(ids, authorised.user.id);
  await audit({
    action: "prospect.queue",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    detail: `queued ${queued}`,
  });
  revalidatePath("/admin/prospecting/prospects");
  return { queued };
}

/** One batch, bounded to fit this invocation. Bulk work belongs in the CLI. */
export async function runQueueNow(): Promise<DrainSummary | { error: string }> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };

  const summary = await drainAuditQueue(
    { limit: 5, budgetMs: 45_000, pauseMs: 500 },
    productionDrainDependencies(),
  );
  revalidatePath("/admin/prospecting/prospects");
  return summary;
}

export async function suppressProspectAction(
  id: number,
  reason: string,
): Promise<{ ok: true } | { error: string }> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  await suppressProspect(id, reason);
  await audit({
    action: "prospect.suppress",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id,
    detail: reason,
  });
  revalidatePath(`/admin/prospecting/prospects/${id}`);
  return { ok: true };
}

export async function unsuppressProspectAction(
  id: number,
): Promise<{ ok: true } | { error: string }> {
  const authorised = await authorise("prospecting.manage");
  if (!authorised.ok) return { error: authorised.error };
  await unsuppressProspect(id);
  await audit({
    action: "prospect.unsuppress",
    userId: authorised.user.id,
    actorEmail: authorised.user.email,
    entity: "prospect",
    entityId: id,
  });
  revalidatePath(`/admin/prospecting/prospects/${id}`);
  return { ok: true };
}
```

Add these imports at the top of the file:

```ts
import { revalidatePath } from "next/cache";
import { drainAuditQueue, type DrainSummary } from "@/lib/prospecting/drain";
import { enqueueProspects, productionDrainDependencies } from "@/lib/prospecting/queue";
import { listProspects, suppressProspect, unsuppressProspect } from "@/lib/prospecting/prospects";
```

- [ ] **Step 2: Build the list page**

Create `src/app/admin/prospecting/prospects/page.tsx` following the `works/page.tsx` pattern: `requireCapability("prospecting.manage", "/admin/prospecting/prospects")`, then `listProspects` with filters read from `searchParams` (`status`, `opportunity`, `country`, `industry`).

Render a table of company, domain (linked to the site with `rel="noopener noreferrer"`), industry, location, `Status`, score, and `when(lastAuditedAt)`, each row linking to `/admin/prospecting/prospects/${id}`. Use `Empty` when there are no rows. Set `export const maxDuration = 60;` because `runQueueNow` is invoked from this segment. Put `<QueueActions />` in the `PageTitle` action slot.

- [ ] **Step 3: Build `queue-actions.tsx`**

A `"use client"` component with two buttons driven by `useTransition`: "Queue all new" calling `queueAllNew`, and "Run queue now" calling `runQueueNow`. Render the returned summary as plain text (`3 audited, 1 skipped, 0 failed`) or the error message. Note in helper text beneath: *"Runs up to five audits. For a large list use `npm run prospecting:drain`."*

- [ ] **Step 4: Build the detail page**

Create `src/app/admin/prospecting/prospects/[id]/page.tsx`: resolve and validate the numeric `id` exactly as the existing audit report page does, call `getProspect`, `notFound()` when absent.

Show the prospect fields, the `sources` provenance list, contact channel with its provenance, and the audit history (`prospectAudits` where `prospectId = id`, newest first) with each row linking to `/admin/prospecting/audits/${auditId}`. Include a suppress form (reason required) calling `suppressProspectAction`, or an unsuppress button when already suppressed.

- [ ] **Step 5: Update navigation**

In `src/components/admin/shell.tsx`, replace the single prospecting link with:

```ts
  { href: "/admin/prospecting/prospects", label: "Prospects", capability: "prospecting.manage", icon: "users" },
  { href: "/admin/prospecting/audit", label: "Prospecting audit", capability: "prospecting.manage", icon: "gauge" },
```

- [ ] **Step 6: Verify**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass; `/admin/prospecting/prospects` and `/admin/prospecting/prospects/[id]` in the route list

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/prospecting/prospects src/components/admin/prospecting/queue-actions.tsx src/lib/prospecting/actions.ts src/components/admin/shell.tsx
git commit -m "$(cat <<'EOF'
Review prospects ranked by observed opportunity

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Drain CLI and documentation

**Files:**
- Create: `scripts/drain-prospecting.mts`
- Modify: `package.json` (add the `prospecting:drain` script)
- Modify: `docs/environment.md`, `docs/prospecting-engine-handoff.md`, `docs/prospecting-engine-phase1-report.md`

**Interfaces:**
- Consumes: `drainAuditQueue` (Task 6), `productionDrainDependencies` (Task 6).
- Produces: `npm run prospecting:drain -- --limit 50`

- [ ] **Step 1: Write the script**

Create `scripts/drain-prospecting.mts`:

```ts
/**
 * Drains the prospecting audit queue.
 *
 *   npm run prospecting:drain
 *   npm run prospecting:drain -- --limit 50
 *
 * This is the primary way to work through a large import. It runs on your
 * machine rather than on Vercel, so no serverless time limit applies and a
 * few hundred prospects can be audited in one unattended run. A pause between
 * audits keeps the request rate polite.
 */
import { drainAuditQueue } from "../src/lib/prospecting/drain.ts";
import { productionDrainDependencies } from "../src/lib/prospecting/queue.ts";

const flag = process.argv.indexOf("--limit");
const limit = flag === -1 ? 500 : Number(process.argv[flag + 1]);

if (!Number.isSafeInteger(limit) || limit < 1) {
  console.error("--limit must be a positive whole number");
  process.exit(1);
}

console.log(`Draining up to ${limit} queued audits. Ctrl-C to stop.`);

const summary = await drainAuditQueue(
  { limit, budgetMs: Number.MAX_SAFE_INTEGER, perAuditMs: 0, pauseMs: 2_000 },
  productionDrainDependencies(),
);

console.log(
  `Done: ${summary.completed} completed, ${summary.failed} failed, ` +
    `${summary.skipped} already claimed (stopped: ${summary.stoppedBecause}).`,
);
```

- [ ] **Step 2: Register the script**

In `package.json`, add to `scripts`:

```json
    "prospecting:drain": "node --env-file=.env ./node_modules/tsx/dist/cli.mjs scripts/drain-prospecting.mts",
```

- [ ] **Step 3: Verify it runs against an empty queue**

Run: `npm run prospecting:drain -- --limit 1`
Expected: `Done: 0 completed, 0 failed, 0 already claimed (stopped: empty).`

- [ ] **Step 4: End-to-end check**

Import a three-row CSV of real public business sites through `/admin/prospecting/import`, click "Queue all new", then run `npm run prospecting:drain`. Confirm each prospect reaches `audited` with a non-zero score and its audit report renders at `/admin/prospecting/audits/<id>`.

- [ ] **Step 5: Update the documentation**

In `docs/environment.md`, extend the "Prospecting audit jobs" section: Phase 2 batch audits are drained by `npm run prospecting:drain`, which needs only `DATABASE_URL`. State that there is deliberately no cron and no `CRON_SECRET`, because the project is on Vercel's Hobby plan where scheduled cron cannot drain a queue.

In `docs/prospecting-engine-handoff.md`, update the implemented-flow block to `CSV import → domain-unique upsert → queued audit → drain → ranked review`, and change the status row to record Phase 2 as implemented.

In `docs/prospecting-engine-phase1-report.md`, add a change-log row dated 2026-09-16 for Phase 2 with the files and the verification results.

- [ ] **Step 6: Final verification**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass

- [ ] **Step 7: Commit**

```bash
git add scripts/drain-prospecting.mts package.json docs/
git commit -m "$(cat <<'EOF'
Drain the prospecting queue from the command line

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-review notes

**Spec coverage:** `prospects` table (Task 4), `prospect_id` on audits (Task 4), no `prospect_events` (Task 4 — audit actions instead), CSV parser (Task 3), `normalizeDomain` (Task 1), `classifyContact` (Task 2), upsert with suppression guarantee (Task 5), drain with CAS claim (Task 6), CLI caller (Task 9), admin-button caller (Task 8), import/list/detail routes (Tasks 7–8), navigation (Task 8), no cron anywhere (Task 9 documents why).

**Deferred to Phase 3, as the spec's out-of-scope section requires:** outreach drafts, AI analysis, automated sources, `/admin/prospecting/settings`, the overview dashboard.

**Known risk to watch during Task 5:** Drizzle's `onConflictDoUpdate` must emit a `WHERE` on the update. If the installed version lacks `setWhere`, drop to a raw `sql` upsert — the suppression guarantee is not optional and its test must pass either way.

**Known limit in Task 8:** `listProspects` caps at 200 rows, so "Queue all new" queues at most 200 per click. That is deliberate for a first cut — clicking twice is fine, and pagination belongs with the list filters rather than bolted onto the queue action. Say so in the button's helper text.

**Type consistency checked:** `drainAuditQueue`, `DrainDependencies.applyResult`, `DrainSummary.stoppedBecause`, `ParsedProspect`, `RowError`, `ContactResult`, `ProspectSource` and `UpsertSummary` are each defined once and referenced under the same names in every later task. `runAudit` returns `runner.ts`'s existing `AuditJobResult`, whose failure arm has no `score` — narrowed on `result.status` in Task 6.
