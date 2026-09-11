# Resend setup

Email lives behind `src/lib/email.ts`. Two functions, no other callers of the
Resend SDK anywhere in the codebase.

**Status: implemented, not configured.** No API key is set and no test email
has been sent.

## Required variables

| Variable | Needed for |
|---|---|
| `RESEND_API_KEY` | Both emails |
| `CONTACT_EMAIL` | Notification only — where enquiries are delivered |
| `RESEND_FROM` | Both — sender identity, e.g. `ForgeLine <hello@forgelinetechnologies.com>` |

Free tier: 3,000/month, 100/day.

## Sender and domain verification

`RESEND_FROM` must use a domain verified in Resend. **Until a domain is
verified, confirmations to prospects will not arrive** — an unverified
account can only deliver to its own address. That is adequate for testing the
notification to yourself and inadequate for anything client-facing.

Verify `forgelinetechnologies.com` in Resend, then set
`RESEND_FROM=ForgeLine <hello@forgelinetechnologies.com>`.

## Notification

Sent to the studio.

| Field | Value |
|---|---|
| `to` | `CONTACT_EMAIL` |
| `from` | `RESEND_FROM` |
| `replyTo` | **the enquirer** |
| `subject` | `New enquiry — {name} ({company})` |

Reply-To being the enquirer means hitting reply answers them directly rather
than the sending domain.

## Confirmation

Sent to the person who submitted.

| Field | Value |
|---|---|
| `to` | the enquirer |
| `from` | `RESEND_FROM` |
| `replyTo` | `CONTACT_EMAIL` when set, omitted otherwise |
| `subject` | `We received your enquiry — ForgeLine Technologies` |

## Failure behaviour

**Neither function ever throws.** Every path returns
`{ ok, skipped?, error? }`.

- Unconfigured → `{ ok: false, skipped: true }`, logged, nothing sent.
- Provider error or network failure → caught, returned as `{ ok: false }`.
- The enquiry is already stored before either runs. Email results are logged
  and **cannot** change what the visitor is told.

This is the point of the ordering: a provider outage costs the notification,
never the lead.

**There is no alerting and no retry.** A silent send failure is visible only
in server logs. If the key expires, enquiries accumulate in the database and
nothing says so.

## Escaping

Every interpolated value passes through `esc()` before entering the HTML
body. Enquiry content is attacker-controlled and lands in an email client.
