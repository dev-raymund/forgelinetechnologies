# Forgeline site-audit

Automated website **teardown** tool. Point it at any URL and it produces a polished,
**client-ready HTML teardown** with your **3 quick wins**, key metrics, and desktop +
mobile screenshots — a document you send as-is (or as a PDF). No video, no narration
(see item 5 in [../TODO.md](../TODO.md)).

Free & open-source (Playwright). No API keys, no accounts. Uses your existing
Google Chrome — no big browser download.

## One-time setup

```bash
cd marketing/site-audit
npm install          # installs the Playwright library only (small, fast)
```

Requires Google Chrome installed (the tool launches it via `channel: "chrome"`).
If Chrome isn't present, it falls back to Playwright's bundled Chromium — run
`npx playwright install chromium` once to fetch that.

## Run an audit

```bash
npm run audit -- example.com
# or
node audit.mjs https://example.com
```

Output lands in `reports/<hostname>-<timestamp>/`:
- `teardown.html` — **the client-ready deliverable you send** (self-contained, branded,
  screenshots embedded)
- `report.md` — your internal working notes, findings ranked
- `desktop.png` / `mobile.png` — full-page screenshots (also embedded in the HTML)

## What it checks

- **Performance** — full load time + TTFB (server response)
- **Mobile-friendliness** — responsive viewport tag + horizontal-scroll test on a phone
- **Broken things** — broken images, failed requests (dead assets/links), JS console errors
- **SEO/meta basics** — title, meta description, H1s, favicon, lang, HTTPS

## Teardown workflow (no video needed)

1. `node audit.mjs theirsite.com`
2. Open `teardown.html` in your browser.
3. Edit one line — swap "Hi there" for the person's name (there's an HTML comment marking it).
4. Send it, one of two ways:
   - **PDF:** browser → Print → Save as PDF → attach to your email/DM, or
   - **Paste:** copy the 3 quick wins straight into your message.
5. → reply → 15-min call → proposal.

Your contact details on the teardown (name, email, site) are set as constants near the
top of `audit.mjs` — edit them there once.

> Note: run this only on sites you're auditing for legitimate outreach. It loads pages
> like a normal browser (one visit); it does not hammer or scrape at scale.
