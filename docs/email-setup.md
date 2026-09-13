# Email setup — Resend with a personal mailbox

You do **not** need Google Workspace, a paid mailbox, or any mailbox at all on
`forgelinetechnologies.com`.

The one thing that trips people up: **the address you send *from* never
receives anything.** `notifications@forgelinetechnologies.com` is a sending
identity, not an inbox. Nothing is ever delivered to it, so it does not need to
exist as a mailbox. Resend only requires that you control the **domain**.

Enquiries land in your existing Gmail.

---

## How it works

```
visitor submits the form
        │
        ├─ stored in Neon                                  ← always happens
        │
        ├─ notification  from: notifications@forgeline…    ← verified identity
        │                to:   your Gmail                  ← CONTACT_EMAIL
        │                reply-to: the visitor             ← hit reply, answer the lead
        │
        └─ confirmation  from: notifications@forgeline…
                         to:   the visitor
                         reply-to: your Gmail              ← REPLY_TO, defaults to CONTACT_EMAIL
```

Your Gmail is **never published**. It is not on the site, not in the metadata,
and not in the structured data. It only receives.

---

## 1. Resend — verify the domain

DNS for this domain is at **Hostinger** (nameservers `apollo.dns-parking.com`
and `athena.dns-parking.com`).

1. Resend → **Domains** → **Add Domain** → `forgelinetechnologies.com`.
2. **Copy the records from Resend's own screen.** Do not copy them from a
   guide, this one included. Resend has changed its record shape over time and
   the values are account- and region-specific: this domain sits in
   `ap-northeast-1`, and its records are a DKIM `TXT` plus two `CNAME`s
   pointing at `forge.rmta.net`, not the `MX`-plus-SPF-to-`amazonses.com` pair
   that older guides describe.
3. Add them in Hostinger under
   **Domains → forgelinetechnologies.com → DNS / Nameservers**.
4. Wait for **Verified**. Usually minutes.
5. **Do not create a mailbox.** There is nothing to create.

### Three things that will break this

**Hostinger's Name field is relative.** Enter `send`, not
`send.forgelinetechnologies.com` — Hostinger appends the domain itself, and
pasting the full name produces
`send.forgelinetechnologies.com.forgelinetechnologies.com`, which resolves to
nothing. Same for `rsend` and `resend._domainkey`.

**A CNAME cannot share a name with any other record.** That is RFC 1034, and
it is the failure worth knowing about here: if a stale `MX` or `TXT` is sitting
on `send` from an earlier attempt, the `CNAME` Resend wants will either be
refused by the panel or silently ignored by resolvers. Delete the old records
at that name first, then add the CNAME.

**Never put an SPF record on the root for Resend.** The root already carries
`v=spf1 include:_spf.mail.hostinger.com ~all` and `MX` records for the
Hostinger mailbox. A name may hold only one SPF record, so a second one there
breaks mail for both senders. Nothing in the Resend set touches the root except
the `resend._domainkey` TXT, which is a different name and does not collide.

### Checking it yourself

The dashboard is not the only view. A send-only API key cannot list domains,
but a full-access key can, and this is the fastest way to see exactly what
Resend expects against what is actually published:

```
curl -s -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/domains/<domain-id>
```

That returns every expected record with a per-record `status`, so you can see
which one is holding verification up rather than guessing. Note that `curl`
works and a bare Python client does not — Cloudflare fronts the API and blocks
requests without a browser-like user agent, returning a raw `error code: 1010`
that looks like a Resend error and is not one.

Confirm the published side directly:

```
dig +short TXT   resend._domainkey.forgelinetechnologies.com
dig +short CNAME send.forgelinetechnologies.com
dig +short CNAME rsend.forgelinetechnologies.com
dig +short TXT   forgelinetechnologies.com     # must still be Hostinger's SPF, alone
dig +short MX    forgelinetechnologies.com     # must still be mx1/mx2.hostinger.com
```

## 2. Resend — API key

**API Keys** → create one with **Sending access**. Copy it once; it is not
shown again.

## 3. Vercel — environment variables

Project → **Settings** → **Environment Variables**. Add to **Production**
(and Preview, if you want previews to send):

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | the key from step 2 |
| `CONTACT_EMAIL` | your existing Gmail address |
| `RESEND_FROM` | `Forgeline Technologies <notifications@forgelinetechnologies.com>` |

`RESEND_FROM` keeps the display name — it is what a recipient sees in their
inbox, and a bare address looks like automated mail.

**Leave `NEXT_PUBLIC_CONTACT_EMAIL` unset.** It is the *published* address and
has no fallback, so leaving it empty means the site shows no mailbox and routes
people to the contact form. Setting it to your Gmail would put a personal
address in the footer and in the structured data, where every scraper takes it.

Redeploy after saving — environment variables are read at build time.

## 4. Verify it works

Submit the form on the live site. You should get **two** emails: the
notification in your Gmail, and the confirmation at whatever address you
entered. Hit reply on the notification; it should address the visitor, not
yourself.

If nothing arrives, check the Vercel runtime logs. Failures are logged with a
`[inquiry]` prefix and, for configuration problems, an explanation of the fix.

---

## Optional, later: a branded reply-to without a mailbox

The confirmation's reply-to is your Gmail by default, which means a visitor who
replies can see it.

Most DNS providers and registrars offer **free email forwarding** — not a
mailbox, just a rule. Point `hello@forgelinetechnologies.com` at your Gmail,
then set:

```
REPLY_TO=hello@forgelinetechnologies.com
```

Replies still reach your Gmail, but the address a visitor sees is branded. This
needs no Workspace and no subscription. Once that forwarder exists you could
also set `NEXT_PUBLIC_CONTACT_EMAIL` to the same address and publish it.

---

## What happens if you configure none of this

The form still works. Enquiries are validated, rate-limited, spam-filtered and
stored in Neon, and the visitor is told their details are in — which is true.
Only the emails are skipped, and the success screen does not claim a
confirmation was sent when none was.

That is the current state: **enquiries are being saved, and nobody is being
told they arrived.** Steps 1–3 are what fix that.
