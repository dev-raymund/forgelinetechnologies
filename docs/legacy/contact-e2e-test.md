# Contact Flow — End-to-End Test

**Date:** 2026-09-11
**Target:** running application, `next dev` on :3001
**Method:** submitted through the real server action using the form's
progressive-enhancement fields — exactly as a JavaScript-disabled browser
would. No direct database writes, no mocked modules.

```
Visitor → Lead Form → Validation → Honeypot → Rate Limit
        → project_inquiries → Resend notification → Prospect confirmation → Success UI
```

**Result: 7 of 7 passed.** No functionality was changed — no failure was found
in the enquiry code. One environmental finding is recorded in section 8.

## Environment during the run

| | |
|---|---|
| `DATABASE_URL` | set, reachable |
| `RESEND_API_KEY` | **not set** |
| `CONTACT_EMAIL` | **not set** |
| `RESEND_FROM` | **not set** |
| Baseline rows | 1 (`#7`, a pre-existing manual browser test) |

Because Resend is unconfigured, every test doubles as a check that email
failure is non-fatal. Successful *delivery* could not be tested — that needs a
real API key.

Test traffic used `203.0.113.0/24` (TEST-NET-3, RFC 5737), which no real
visitor can originate from, so cleanup could not touch a genuine enquiry.

---

## T1 — Valid submission

**Input** name `E2E Valid`, email `e2e-valid@example.com`, product `Not sure yet`,
budget `Under $1,000`, message 43 chars, honeypot empty. IP `203.0.113.101`.

| | |
|---|---|
| **Expected** | Row stored, success UI, email attempted |
| **Actual** | HTTP 200 |
| **Database** | **+1 row**, `status='new'`, `source_ip` recorded |
| **Email** | Both sends skipped — `Email not configured` (expected, unconfigured) |
| **UI** | `form-status is-ok` — *"Thanks — your enquiry is in. You'll hear back within one business day."* |

**PASS.**

---

## T2 — Invalid email

**Input** identical to T1 except email `not-an-email`. IP `203.0.113.102`.

| | |
|---|---|
| **Expected** | Rejected at validation, nothing stored, nothing emailed |
| **Actual** | HTTP 200 |
| **Database** | **0 rows** |
| **Email** | Not attempted — validation returns before the insert |
| **UI** | `form-status is-error` — *"Please check the highlighted fields."* with field error *"Enter a valid email address."* |

**PASS.** The error is attached to the specific field, not just the form.

---

## T3 — Required field missing

**Input** identical to T1 except `message` empty. IP `203.0.113.103`.

| | |
|---|---|
| **Expected** | Rejected at validation, nothing stored |
| **Actual** | HTTP 200 |
| **Database** | **0 rows** |
| **Email** | Not attempted |
| **UI** | `form-status is-error` with field error *"A sentence or two about the project, please."* |

**PASS.** Note this is enforced **server-side**. The browser's `required`
attribute was bypassed entirely by this submission, and the server still
rejected it — which is the property that actually matters.

---

## T4 — Honeypot submission

**Input** identical to T1 but `_gotcha` = `http://spam.example`. IP `203.0.113.104`.

| | |
|---|---|
| **Expected** | Reports success, stores nothing |
| **Actual** | HTTP 200 |
| **Database** | **0 rows** |
| **Email** | Not attempted — the branch returns before the insert |
| **UI** | `form-status is-ok` — *"Thanks — we'll be in touch shortly."* |

**PASS.**

The success response is deliberate: a validation error would tell a bot it had
been detected. Note the message differs from T1's genuine success text — that
difference is how this test proves it took the honeypot branch rather than the
real one, and it is the only externally visible distinction.

---

## T5 — Rate limit exceeded

**Input** six submissions in immediate succession, all from IP `203.0.113.105`,
each with a distinct name and email. Limit is 5 per hour per IP.

| Attempt | HTTP | UI | Stored |
|---|---|---|---|
| 1 | 200 | ok | yes |
| 2 | 200 | ok | yes |
| 3 | 200 | ok | yes |
| 4 | 200 | ok | yes |
| 5 | 200 | ok | yes |
| 6 | 200 | **error** | **no** |

| | |
|---|---|
| **Expected** | First 5 accepted, 6th refused |
| **Actual** | Exactly that |
| **Database** | **5 rows** for this IP |
| **Email** | Skipped on the 5 accepted; not attempted on the 6th |
| **UI** | Attempt 6: *"That's a few enquiries in a short time. Email us directly and we'll pick it up."* |

**PASS.** The limit counts rows in the database rather than in process memory,
so it holds across serverless instances that share no state.

---

## T6 — Database failure

**Method** a second dev server on port 3004 with `DATABASE_URL` pointed at an
unreachable Neon-shaped host. The real database was never addressed by this
test. IP `203.0.113.106`.

| | |
|---|---|
| **Expected** | Insert fails, error surfaced, nothing lost |
| **Actual** | HTTP **500** — see the finding below |
| **Database** | Real DB untouched: **0 rows** for this IP, total unchanged at 7 |
| **Email** | Not attempted — the action returns before the send block |
| **UI** | **No form status rendered** — the page render itself failed |

**Server log:**

```
[inquiry] database write failed Error [NeonDbError]: Error connecting to database: fetch failed
```

**PASS, with a finding.** The action's error branch was reached and behaved
correctly — it caught the failure, logged it, and returned an error state
without throwing. But the visitor never saw the graceful message, because the
page render failed first. See section 8.

---

## T7 — Email delivery failure

**Method** no separate run needed: Resend was unconfigured for the entire
suite, so every accepted submission exercised this path. T1 is the reference
case.

| | |
|---|---|
| **Expected** | Enquiry still stored; visitor still sees success; no crash |
| **Actual** | HTTP 200 on every accepted submission |
| **Database** | All 6 accepted submissions stored (T1 ×1, T5 ×5) |
| **Email** | 13 notification + 13 confirmation failures logged as `Email not configured`. **0** unhandled exceptions |
| **UI** | Normal success state throughout |

**PASS.** Email failure neither prevents nor deletes storage, and is invisible
to the visitor — correct, since their enquiry genuinely was received.

Both senders return `{ ok: false, error }` rather than throwing, and the action
only `console.error`s the result. Storage happens at line 78; sends at line 94.
A provider outage costs the notification, never the lead.

---

## 8. Finding — the graceful DB error is unreachable in practice

**Not a defect in the enquiry code.** The action handles insert failure exactly
as designed. But the intended message —

> *"Something went wrong saving your enquiry. Please email us directly."*

— cannot reach a visitor when the database is fully down, because the homepage
queries `works` and `posts` to render at all. The page 500s before the form's
error state can be displayed. T6 confirmed this: HTTP 500, no form status.

**When the message *does* appear:** a narrower failure where reads succeed but
the insert does not — a constraint violation, a permissions problem, a
connection exhausted mid-request. Those are the realistic production cases, and
they are handled correctly.

**When it does not:** total database unavailability, where the whole page is
already unavailable and the form is unreachable regardless.

**Not fixed, deliberately.** Making the homepage render without the database
would mean shipping an empty portfolio during an outage, which `web/README.md`
records as an explicit decision against. Changing it is a product call, not a
test fix, and this task's scope was to fix only a discovered failure — this is
a documented consequence of an intentional design.

Worth revisiting alongside the Neon cold-start retry already in
`src/lib/queries.ts`, which mitigates the common case.

---

## 9. Cleanup

| | |
|---|---|
| Rows created by this suite | 6 |
| Rows deleted | 6 |
| Remaining | 1 — `#7`, `John Doe <john@mail.com>`, IP `::1` |

`#7` is a pre-existing manual browser test from 2026-09-11, not created by this
suite. Left in place deliberately.

The isolated bad-database server on :3004 was stopped. No application code,
form markup, validation rule or database schema was modified by this task.

---

## 10. Not covered

Requires a real `RESEND_API_KEY`:

- Notification actually arriving at `CONTACT_EMAIL`
- `Reply-To` as received in a mail client
- Prospect confirmation actually arriving

The send configuration is verified in code (`docs/contact-email-verification.md`
§2–3), and the delivery checklist to run once a key exists is in §5 of that
document.
