# Contact Email Verification

**Provider:** Resend
**Implementation:** `web/src/lib/email/inquiry.ts`, called from `web/src/app/actions/inquiry.ts`
**Verified:** 2026-09-11

**Status: implemented and correct in code, not yet configured.** All three
environment variables are absent, so both emails are currently skipped. Storage
is unaffected — that was tested for real, not assumed.

No secret value appears in this document, in `.env.example`, or in git.

---

## 1. Configuration requirements

Three variables. None is present in `web/.env` today.

| Variable | Required for | If missing |
|---|---|---|
| `RESEND_API_KEY` | Both emails | **Both** skipped silently |
| `CONTACT_EMAIL` | Notification only | Notification skipped; confirmation still sends |
| `RESEND_FROM` | Sender identity | Falls back to `onboarding@resend.dev` — see the warning below |

The guards are asymmetric and worth knowing:

```
notification:  if (!key || !TO)  → skip     // needs BOTH key and CONTACT_EMAIL
confirmation:  if (!key)         → skip     // needs only the key
```

So setting the key without `CONTACT_EMAIL` produces the worst outcome: the
prospect gets a confirmation while nobody is told the enquiry exists.
**Set both together.**

### The fallback sender will not reach prospects

If `RESEND_FROM` is unset the code uses Resend's shared `onboarding@resend.dev`
sender, which **only delivers to the address that owns the Resend account**.

That is adequate for testing the notification to yourself. It is not adequate
for the confirmation email, which by definition goes to someone else — those
will not arrive. Verify a domain in Resend and set `RESEND_FROM` to an address
on it before relying on confirmations.

### Local setup

Add the three to `web/.env` — never to `.env.example`, and never to a commit.
`web/.env` is git-ignored (verified: `web/.gitignore:3`).

```
RESEND_API_KEY=...
CONTACT_EMAIL=...
RESEND_FROM=Forgeline <you@yourdomain.com>
```

Restart the dev server afterwards; the values are read at module scope.

### Hosting setup

In the Vercel project serving the site → **Settings → Environment Variables**,
add the same three for the **Production** environment (and Preview, if previews
should send mail):

| Name | Notes |
|---|---|
| `RESEND_API_KEY` | Runtime only — does not affect the build |
| `CONTACT_EMAIL` | Runtime only |
| `RESEND_FROM` | Runtime only; domain must be verified in Resend |

Redeploy after adding them. Unlike `DATABASE_URL`, none of these is read at
build time, so their absence will never fail a deploy — it fails silently at
runtime instead, which is exactly why this document exists.

---

## 2. Notification behaviour

Sent to the studio when an enquiry arrives.

| Field | Value |
|---|---|
| `to` | `CONTACT_EMAIL` |
| `from` | `RESEND_FROM`, else the fallback sender |
| `replyTo` | **The prospect's email address** |
| `subject` | `New enquiry — {name}` |

Body is an HTML table: name, email, what they need, budget, and an ISO
timestamp, followed by the message in a preformatted block.

`replyTo` being the prospect means hitting reply in your mail client answers
the enquirer directly, rather than the sending domain. Verified in code at
`inquiry.ts:73`.

### Escaping

Every interpolated value passes through `esc()`, which escapes `& < > " '`.
Enquiry content is attacker-controlled and lands in an HTML email, so this
matters. Verified present on all interpolations, including the message body.

---

## 3. Confirmation behaviour

Sent to the person who submitted the form.

| Field | Value |
|---|---|
| `to` | The prospect's email address |
| `from` | `RESEND_FROM`, else the fallback sender |
| `replyTo` | `CONTACT_EMAIL` when set, otherwise omitted |
| `subject` | `We got your enquiry — Forgeline Technologies` |

Body restates project type, budget and their message, and promises a reply
within one business day.

Note the reciprocal `replyTo`: the prospect replying to the confirmation
reaches `CONTACT_EMAIL`. When `CONTACT_EMAIL` is unset the field is omitted
entirely rather than sent empty.

---

## 4. Failure behaviour

**Design: store first, email second. A provider outage costs a notification,
never a lead.**

Order in `actions/inquiry.ts`:

```
78   await db.insert(projectInquiries)      ← inside its own try/catch
       └ on failure: return status "error", nothing is emailed
94   await Promise.all([notification, confirmation])
98   if (!notify.ok)  console.error(...)    ← logged only
99   if (!confirm.ok) console.error(...)    ← logged only
101  return { status: "success" }           ← unconditional
```

Both senders are wrapped in `try/catch` and return `{ ok: false, error }`
rather than throwing, so a network failure, an invalid key, or a Resend outage
cannot propagate into the request.

**Consequences, stated plainly:**

- A stored enquiry is never lost to an email problem.
- The visitor always sees success once the row is written, even if nothing was
  sent. This is intentional — their enquiry genuinely was received.
- **Failures are visible only in server logs.** There is no alert and no retry.
  If the key expires, enquiries accumulate in the database and nobody is told.
  Until an admin view exists (P2-11), periodically check the table.

---

## 5. Test result

### Controlled real test — failure path

Ran against the running application with Resend deliberately unconfigured, which
*is* the failure condition. Submitted through the real server action using the
form's progressive-enhancement fields — not a direct database write.

| Check | Result |
|---|---|
| HTTP response | 200 |
| Visitor sees | `form-status is-ok` — *"Thanks — your enquiry is in…"* |
| Row stored | **Yes** — `#8`, `status='new'`, `source_ip` recorded |
| Notification | Skipped — logged `[inquiry] notification not sent: Email not configured` |
| Confirmation | Skipped — logged `[inquiry] confirmation not sent: Email not configured` |
| Unhandled exceptions | **0** |

**Requirement 10 is proven, not inferred:** an unconfigured/failing Resend
neither prevents nor deletes database storage.

Test row removed afterwards. Test traffic used `203.0.113.0/24` (TEST-NET-3,
RFC 5737), which no real visitor can originate from.

### Not yet verifiable

Live delivery of the notification, the `Reply-To` header as received, and the
prospect confirmation **could not be tested** — that requires a real
`RESEND_API_KEY`, which does not exist yet. Those three are verified by code
inspection only:

- notification `to: CONTACT_EMAIL` — `inquiry.ts:72`
- notification `replyTo: data.email` — `inquiry.ts:73`
- confirmation `to: data.email` — `inquiry.ts:106`

**Once the key is configured, run this to confirm delivery end to end:**

1. Submit a real enquiry through the form on the running site.
2. Confirm the notification arrives at `CONTACT_EMAIL`.
3. Hit reply on it — the To: field must be the prospect's address, not yours.
4. Confirm the confirmation arrives at the submitted address. If it does not,
   `RESEND_FROM` is still on the fallback sender.
5. Confirm a row exists in `project_inquiries` for the submission.

---

## 6. Changes made by this task

- `web/.env.example` — Resend section reduced to **variable names only**, with
  the behaviour of each documented in comments. No values, including the
  previously present `RESEND_FROM` default.
- Nothing else. No form markup, no UX, no email logic, no database code.

---

## 7. Outstanding

- **Set the three variables** locally and in the hosting environment.
- **Verify a sending domain in Resend** — without it, prospect confirmations
  will not be delivered.
- **No failure alerting.** A silent send failure is invisible outside logs.
  Worth revisiting when the admin enquiry view is built.
- **One row remains in `project_inquiries`** — `#7`, `John Doe / john@mail.com`
  from `::1`, a manual browser test on 2026-09-11. Left in place deliberately;
  it is not mine to remove.
