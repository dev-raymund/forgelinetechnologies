# Contact Database Verification

**Table:** `project_inquiries` (Neon Postgres, `public` schema)
**Verified:** 2026-09-11
**Method:** every claim below was checked by querying the database directly
(`information_schema`, `pg_indexes`), not by trusting CLI output.

**Status: functional.** The table exists, matches `src/db/schema.ts` exactly,
carries all three declared indexes, and the full enquiry pipeline — insert,
success state, honeypot, rate limit — was exercised end to end and passed.

---

## 1. Table

Created during the deployment work of 2026-09-10, then corrected and verified
here. Confirmed present alongside `posts`, `users`, `works`.

```
TABLES: posts, project_inquiries, users, works
```

No existing table was altered at any point. Row counts before and after all
work in this task: `works=17`, `posts=1`, `users=2` — unchanged.

---

## 2. Columns

All 13 columns present and matching the Drizzle definition exactly — type,
length, nullability and default.

| Column | Type | Null | Default |
|---|---|---|---|
| `id` | integer | NOT NULL | `nextval('project_inquiries_id_seq')` |
| `name` | varchar(150) | NOT NULL | — |
| `email` | varchar(250) | NOT NULL | — |
| `company` | varchar(200) | NOT NULL | `''` |
| `website` | varchar(300) | NOT NULL | `''` |
| `phone` | varchar(60) | NOT NULL | `''` |
| `project_type` | varchar(60) | NOT NULL | `''` |
| `budget` | varchar(60) | NOT NULL | `''` |
| `timeline` | varchar(60) | NOT NULL | `''` |
| `message` | text | NOT NULL | — |
| `status` | varchar(24) | NOT NULL | `'new'` |
| `source_ip` | varchar(64) | NOT NULL | `''` |
| `created_at` | timestamptz | NOT NULL | `now()` |

### Columns the form does not write

`src/app/actions/inquiry.ts` inserts only six: `name`, `email`, `project_type`,
`budget`, `message`, `source_ip`. The rest rely on defaults.

This is safe because every unwritten column either has a default or is
generated. The three columns that are `NOT NULL` with no default — `name`,
`email`, `message` — are all written on every insert.

`company`, `website`, `phone` and `timeline` are currently never populated:
the live lead form has no such fields. They are retained because they cost
nothing and a richer form may use them later.

---

## 3. Indexes

All three present, verified via `pg_indexes`:

| Index | Definition | Purpose |
|---|---|---|
| `project_inquiries_pkey` | `btree (id)` | Primary key |
| `inquiries_status_idx` | `btree (status)` | Admin filtering by workflow state |
| `inquiries_created_idx` | `btree (created_at)` | **Used by the IP rate limit** |

### Two of these were missing and had to be repaired

The original `drizzle-kit push` run partially applied: it created the table and
its primary key, then failed before creating either declared index. That left
the live schema silently out of step with `schema.ts`.

The gap mattered — `inquiries_created_idx` is what the rate-limit query depends
on (`WHERE source_ip = ? AND created_at >= ?`). Without it every check is a
sequential scan.

Repaired with exactly the DDL Drizzle generates for those declarations:

```sql
CREATE INDEX IF NOT EXISTS "inquiries_status_idx"  ON "project_inquiries" USING btree ("status");
CREATE INDEX IF NOT EXISTS "inquiries_created_idx" ON "project_inquiries" USING btree ("created_at");
```

Additive only — no `ALTER`, no `DROP`, no data touched, and idempotent.

---

## 4. Known issue: `drizzle-kit push` is broken against this database

**`npm run db:push` fails and must not be used until this is resolved.**

```
PostgresError 42P16 (invalid_table_definition)
  routine: dropconstraint_internal   (tablecmds.c:14177)
```

Two things worth recording:

1. **It fails identically with and without `--force`.** `--force` only skips the
   confirmation prompt; the underlying diff is what breaks. An earlier note
   blaming `--force` was wrong.
2. **It can partially apply before failing.** That is precisely how the two
   indexes went missing — the table landed, the indexes did not. A failed push
   does not mean an unchanged database.

Drizzle is computing a diff that attempts to drop a constraint Postgres refuses
to drop. Root cause is not yet diagnosed. Until it is, schema changes should be
applied as reviewed, explicit DDL, and verified against `information_schema`
afterwards.

**Always verify after any push, successful or not.**

---

## 5. Test submissions

Exercised through the real server action on a running app — submitted as a
JavaScript-disabled browser would, using the form's progressive-enhancement
fields (`$ACTION_REF_1`, `$ACTION_1:0`, `$ACTION_KEY`). Not a direct database
insert; the whole path ran.

| # | Test | Expected | Result |
|---|---|---|---|
| 1 | Valid submission | Row stored, success state shown | **PASS** — HTTP 200, row `#1` written with correct `project_type`, `budget`, `source_ip`, `status='new'` |
| 2 | Success state visible | Visitor sees confirmation | **PASS** — `form-status is-ok`: *"Thanks — your enquiry is in. You'll hear back within one business day."* |
| 3 | Honeypot (`_gotcha` filled) | Reports success, stores nothing | **PASS** — HTTP 200, distinct message *"Thanks — we'll be in touch shortly."*, **0 rows** written |
| 4 | IP rate limit (5/hour) | 6th submission refused | **PASS** — attempts 1–5 stored; attempt 6 returned `form-status is-error`: *"That's a few enquiries in a short time…"* |

### Why the honeypot returns success

Deliberate. A validation error would tell a bot it was detected. The field
parses normally and the server action drops the submission after a successful
parse, returning an ordinary success response. The wording differs from the
genuine success message, which is how test 3 was distinguished from test 1.

### Rate limit implementation

Counted in the database, not in memory — serverless instances do not share
memory, so an in-process counter would reset unpredictably. Client IP is taken
from `x-forwarded-for` (first entry) falling back to `x-real-ip`.

**Note:** when neither header is present, `ip` is empty and the rate-limit check
is skipped entirely. Behind Vercel these headers are always set, so this only
affects direct local requests.

---

## 6. Cleanup

All test rows were removed. Production holds **no** synthetic enquiries.

```
BEFORE  203.0.113.10 → 1 row     203.0.113.30 → 5 rows
DELETE  where source_ip like '203.0.113.%'   → 6 rows
AFTER   0 rows
```

Test traffic used **203.0.113.0/24 (TEST-NET-3)**, reserved by RFC 5737 for
documentation. No real visitor can originate from that range, so the cleanup
predicate could not have matched a genuine enquiry.

`project_inquiries_id_seq` now sits at **6**. The first real enquiry will be
`id=7`. Postgres does not reuse sequence values after deletion; this is expected
and requires no correction.

---

## 7. Rollback and recovery

### Removing the indexes

```sql
DROP INDEX IF EXISTS "inquiries_status_idx";
DROP INDEX IF EXISTS "inquiries_created_idx";
```

Safe — indexes hold no data. Dropping `inquiries_created_idx` degrades the
rate-limit query to a sequential scan but does not break it.

### Removing the table

```sql
DROP TABLE IF EXISTS "project_inquiries";
```

**Destructive — deletes every stored enquiry.** Only appropriate before real
submissions exist. Recreate from `schema.ts` afterwards.

### If the table is dropped accidentally

The definition is version-controlled at `web/src/db/schema.ts`, committed in
`2f099ed`. Recreate with the DDL in section 3 plus the column definitions in
section 2. Do not rely on `db:push` while section 4 stands.

### Point-in-time recovery

Neon retains history on its free tier (typically 24 hours; confirm in the
project's settings). A dropped table or bad write can be recovered by
restoring the branch to a timestamp before the change. This is the fastest
route and should be the first response to accidental data loss.

### Rolling back the enquiry feature entirely

Reverting the application code does not touch the table. The table can be left
in place indefinitely — it is inert without the form writing to it.

---

## 8. Outstanding

Storage is complete and verified. Two items remain before enquiries reach a
human:

- **`RESEND_API_KEY`, `CONTACT_EMAIL`, `RESEND_FROM` are unset.** Submissions
  are stored, but no notification is sent and the enquirer gets no
  confirmation. `sendInquiryNotification` returns `{ ok: false, skipped: true }`
  and the failure is logged, not surfaced. Storage-before-email is deliberate:
  an email outage costs the notification, never the lead.
- **No admin view for enquiries.** Rows are only reachable via SQL. Tracked as
  P2-11 in the implementation plan.
