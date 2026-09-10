#!/usr/bin/env node
// Forgeline site-audit — automated website "teardown" for outreach.
// Usage: node audit.mjs <url>
// Point it at a prospect's site; it produces:
//   - report.md    (your internal working notes)
//   - teardown.html (a polished, client-ready teardown you can send / Print-to-PDF)
//   - desktop.png + mobile.png screenshots
// No video or narration needed — the HTML is the deliverable.

import { chromium, devices } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

// ---------- your contact details (shown on the client-facing teardown) ----------
const SENDER_NAME = "Raymund Hermoso";
const SENDER_TITLE = "Forgeline Technologies";
const CONTACT_EMAIL = "raymundhermoso.dev@gmail.com";
const SITE_URL = "https://forgelinetechnologies.com/";

// ---------- args ----------
const rawUrl = process.argv[2];
if (!rawUrl) {
  console.error("Usage: node audit.mjs <url>\n  e.g. node audit.mjs example.com");
  process.exit(1);
}
// Normalize: allow bare "example.com"
const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
let hostname;
try {
  hostname = new URL(url).hostname;
} catch {
  console.error(`Not a valid URL: ${rawUrl}`);
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outDir = path.join("reports", `${hostname}-${stamp}`);

// ---------- helpers ----------
const findings = []; // { severity: 'high'|'med'|'low', title, detail }
const add = (severity, title, detail) => findings.push({ severity, title, detail });
const sevRank = { high: 0, med: 1, low: 2 };
const sevIcon = { high: "🔴", med: "🟠", low: "🟡" };

async function main() {
  await mkdir(outDir, { recursive: true });
  // Use the system-installed Google Chrome (channel: "chrome") so we don't need to
  // download Playwright's bundled Chromium. Falls back to bundled if Chrome is absent.
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome" });
  } catch {
    browser = await chromium.launch();
  }

  // ---------- DESKTOP PASS ----------
  const desktop = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/125.0 Safari/537.36 ForgelineSiteAudit/1.0",
  });
  const page = await desktop.newPage();

  const failedResources = [];
  const consoleErrors = [];
  page.on("response", (res) => {
    const s = res.status();
    if (s >= 400) failedResources.push({ url: res.url(), status: s });
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  const t0 = Date.now();
  let loadOk = true;
  let httpStatus = null;
  try {
    const resp = await page.goto(url, { waitUntil: "load", timeout: 45000 });
    httpStatus = resp ? resp.status() : null;
  } catch (err) {
    loadOk = false;
    add("high", "Page failed to load", `Could not load the page: ${err.message}`);
  }
  const loadMs = Date.now() - t0;

  if (loadOk) {
    // Navigation timing from the browser itself
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      if (!nav) return null;
      return {
        ttfb: Math.round(nav.responseStart),
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
        load: Math.round(nav.loadEventEnd),
      };
    });

    // Page metadata + on-page signals
    const meta = await page.evaluate(() => {
      const q = (sel) => document.querySelector(sel);
      const desc = q('meta[name="description"]');
      return {
        title: document.title || "",
        description: desc ? desc.getAttribute("content") || "" : null,
        hasViewport: !!q('meta[name="viewport"]'),
        h1Count: document.querySelectorAll("h1").length,
        hasFavicon: !!q('link[rel~="icon"]'),
        lang: document.documentElement.getAttribute("lang") || null,
        imgCount: document.images.length,
        brokenImages: Array.from(document.images)
          .filter((img) => img.complete && img.naturalWidth === 0)
          .map((img) => img.currentSrc || img.src),
      };
    });

    // ---- Screenshots ----
    await page.screenshot({
      path: path.join(outDir, "desktop.png"),
      fullPage: true,
    });

    // ---- Findings: performance ----
    const secs = (loadMs / 1000).toFixed(1);
    if (loadMs > 4000) {
      add("high", `Slow load — ${secs}s`, `Full load took ~${secs}s. Anything over ~4s bleeds visitors before your offer is even on screen. Aim for under 2.5s.`);
    } else if (loadMs > 2500) {
      add("med", `Load could be faster — ${secs}s`, `Full load took ~${secs}s. Trimming images/scripts to get under 2.5s tightens conversion.`);
    }
    if (timing && timing.ttfb > 800) {
      add("med", `Slow server response (TTFB ${timing.ttfb}ms)`, `Time-to-first-byte is ${timing.ttfb}ms — a slow host or backend. Under 500ms is healthy.`);
    }

    // ---- Findings: HTTPS ----
    if (new URL(page.url()).protocol !== "https:") {
      add("high", "Not served over HTTPS", "The site isn't on HTTPS — browsers flag it as 'Not secure', which kills trust and hurts SEO.");
    }

    // ---- Findings: SEO / meta ----
    if (!meta.title) {
      add("high", "Missing page title", "No <title> — this is the clickable headline in Google results. A blank title tanks search visibility.");
    } else if (meta.title.length > 65) {
      add("low", "Title tag is long", `Title is ${meta.title.length} chars; Google truncates around 60. Tighten it.`);
    }
    if (meta.description === null) {
      add("med", "No meta description", "There's no meta description — Google shows a random snippet instead of your pitch. Add a 1–2 sentence summary.");
    } else if (meta.description.trim().length < 50) {
      add("low", "Thin meta description", `Meta description is only ${meta.description.trim().length} chars. 120–160 is the sweet spot.`);
    }
    if (meta.h1Count === 0) {
      add("med", "No H1 heading", "No <h1> on the page — search engines and screen readers use it to understand the page's main topic.");
    } else if (meta.h1Count > 1) {
      add("low", `Multiple H1s (${meta.h1Count})`, "More than one <h1> muddies the page's main message. Use exactly one.");
    }
    if (!meta.hasFavicon) {
      add("low", "No favicon", "No favicon — the little browser-tab icon. Small thing, but its absence reads as unfinished.");
    }
    if (!meta.lang) {
      add("low", "No lang attribute", "The <html> tag has no lang attribute — a minor accessibility/SEO miss.");
    }

    // ---- Findings: mobile viewport meta ----
    if (!meta.hasViewport) {
      add("high", "Not mobile-optimized (no viewport tag)", "There's no responsive viewport meta tag, so the site won't scale on phones — where most of your visitors are. This is usually the single most visible problem.");
    }

    // ---- Findings: broken images / resources ----
    if (meta.brokenImages.length) {
      add("high", `${meta.brokenImages.length} broken image(s)`, "Images that failed to render:\n" + meta.brokenImages.slice(0, 8).map((s) => `  - ${s}`).join("\n"));
    }
    if (failedResources.length) {
      const uniq = [...new Map(failedResources.map((r) => [r.url, r])).values()];
      add("med", `${uniq.length} failed request(s)`, "Resources returning errors (broken assets/links):\n" + uniq.slice(0, 8).map((r) => `  - [${r.status}] ${r.url}`).join("\n"));
    }
    if (consoleErrors.length) {
      const uniq = [...new Set(consoleErrors)];
      add("low", `${uniq.length} JavaScript console error(s)`, "The page throws JS errors — often a sign of a half-broken feature:\n" + uniq.slice(0, 5).map((e) => `  - ${e.slice(0, 160)}`).join("\n"));
    }

    // ---------- MOBILE PASS ----------
    const mobileCtx = await browser.newContext({ ...devices["iPhone 13"] });
    const mPage = await mobileCtx.newPage();
    try {
      await mPage.goto(url, { waitUntil: "load", timeout: 45000 });
      const overflow = await mPage.evaluate(() => {
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        return { docW, winW, overflow: docW - winW };
      });
      await mPage.screenshot({ path: path.join(outDir, "mobile.png"), fullPage: true });
      if (overflow.overflow > 8) {
        add("high", "Horizontal scroll on mobile", `On a phone the content is ${overflow.overflow}px wider than the screen, forcing sideways scrolling — a classic 'not built for mobile' tell.`);
      }
    } catch (err) {
      add("med", "Mobile render check failed", `Couldn't complete the mobile pass: ${err.message}`);
    }
    await mobileCtx.close();

    // ---- write reports ----
    await writeReport({ url, httpStatus, loadMs, timing, meta });
    await writeHtmlReport({ url, loadMs, timing, meta });
  } else {
    await writeReport({ url, httpStatus, loadMs, timing: null, meta: null });
  }

  await desktop.close();
  await browser.close();

  // ---- console summary ----
  findings.sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);
  console.log(`\n📋 Audit complete for ${url}`);
  console.log(`   📄 Client teardown: ${path.join(outDir, "teardown.html")}  <-- send this`);
  console.log(`   📝 Your notes:      ${path.join(outDir, "report.md")}`);
  console.log(`   🖼  Screenshots:     desktop.png, mobile.png\n`);
  if (findings.length === 0) {
    console.log("   ✅ No obvious issues found — this one's in good shape.");
  } else {
    console.log("   Top things to mention in the teardown:");
    findings.slice(0, 5).forEach((f) => console.log(`   ${sevIcon[f.severity]} ${f.title}`));
  }
  console.log("");
}

async function writeReport({ url, httpStatus, loadMs, timing, meta }) {
  findings.sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);
  const top3 = findings.slice(0, 3);
  const secs = (loadMs / 1000).toFixed(1);

  let md = `# Website teardown — ${new URL(url).hostname}\n\n`;
  md += `- **URL:** ${url}\n`;
  md += `- **Audited:** ${new Date().toLocaleString()}\n`;
  md += `- **HTTP status:** ${httpStatus ?? "n/a"}\n`;
  md += `- **Full load time:** ${secs}s\n`;
  if (timing) md += `- **TTFB / DOMContentLoaded / Load:** ${timing.ttfb}ms / ${timing.domContentLoaded}ms / ${timing.load}ms\n`;
  md += `\n![Desktop](desktop.png)\n\n`;

  md += `## 🎯 Your 3 quick wins (say these in the video)\n\n`;
  if (top3.length === 0) {
    md += `_No obvious issues found — the site is in solid shape. Lead with a compliment and pitch enhancements instead._\n\n`;
  } else {
    top3.forEach((f, i) => {
      md += `**${i + 1}. ${f.title}** ${sevIcon[f.severity]}\n\n${f.detail}\n\n`;
    });
  }

  md += `## All findings (${findings.length})\n\n`;
  if (findings.length === 0) {
    md += `_None._\n\n`;
  } else {
    findings.forEach((f) => {
      md += `### ${sevIcon[f.severity]} ${f.title}\n\n${f.detail}\n\n`;
    });
  }

  if (meta) {
    md += `## Raw signals\n\n`;
    md += `| Signal | Value |\n|---|---|\n`;
    md += `| Title | ${escapeCell(meta.title) || "—"} |\n`;
    md += `| Meta description | ${meta.description === null ? "❌ missing" : escapeCell(meta.description)} |\n`;
    md += `| Viewport tag | ${meta.hasViewport ? "✅" : "❌"} |\n`;
    md += `| H1 count | ${meta.h1Count} |\n`;
    md += `| Images | ${meta.imgCount} (${meta.brokenImages.length} broken) |\n`;
    md += `| Favicon | ${meta.hasFavicon ? "✅" : "❌"} |\n`;
    md += `| lang attr | ${meta.lang || "❌"} |\n`;
  }

  md += `\n![Mobile](mobile.png)\n`;

  await writeFile(path.join(outDir, "report.md"), md, "utf8");
}

const escapeCell = (s) => (s || "").replace(/\|/g, "\\|").replace(/\n/g, " ").slice(0, 200);

// ---------- client-facing HTML teardown ----------
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const escMulti = (s) => esc(s).replace(/\n/g, "<br>");

async function dataUri(file) {
  try {
    const buf = await readFile(path.join(outDir, file));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function writeHtmlReport({ url, loadMs, timing, meta }) {
  findings.sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);
  const top3 = findings.slice(0, 3);
  const host = new URL(url).hostname;
  const secs = (loadMs / 1000).toFixed(1);
  const sevColor = { high: "#dc2626", med: "#f97316", low: "#eab308" };

  const [desktopImg, mobileImg] = await Promise.all([dataUri("desktop.png"), dataUri("mobile.png")]);

  // metric tiles
  const loadColor = loadMs > 4000 ? "#dc2626" : loadMs > 2500 ? "#f97316" : "#16a34a";
  const ttfb = timing?.ttfb;
  const ttfbColor = ttfb == null ? "#5b6675" : ttfb > 800 ? "#dc2626" : ttfb > 500 ? "#f97316" : "#16a34a";
  const mobileOk = meta?.hasViewport;
  const tiles = [
    { label: "Load time", value: `${secs}s`, color: loadColor },
    { label: "Server response", value: ttfb == null ? "—" : `${ttfb}ms`, color: ttfbColor },
    { label: "Mobile-friendly", value: mobileOk ? "Yes" : "No", color: mobileOk ? "#16a34a" : "#dc2626" },
  ];

  const winCards = top3.length
    ? top3
        .map(
          (f, i) => `
        <div class="win" style="border-left-color:${sevColor[f.severity]}">
          <div class="win-num">${i + 1}</div>
          <div><h3>${esc(f.title)}</h3><p>${escMulti(f.detail)}</p></div>
        </div>`
        )
        .join("")
    : `<p class="none">Good news — no obvious issues jumped out. Your site is in solid shape.</p>`;

  const allFindings = findings.length
    ? findings
        .map(
          (f) =>
            `<li><span class="dot" style="background:${sevColor[f.severity]}"></span>${esc(f.title)}</li>`
        )
        .join("")
    : `<li>None — nice and clean.</li>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Website Teardown — ${esc(host)} · ${esc(SENDER_TITLE)}</title>
<style>
  :root{--navy:#0d2350;--orange:#f97316;--ink:#1a2233;--muted:#5b6675;--line:#e6e9ef;--bg:#f6f7f9}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
    font-family:-apple-system,'Segoe UI','Helvetica Neue',Arial,sans-serif;line-height:1.6}
  .wrap{max-width:760px;margin:0 auto;background:#fff}
  .hero{background:var(--navy);color:#fff;padding:40px 44px}
  .kicker{color:var(--orange);font-weight:700;letter-spacing:2px;font-size:12px;text-transform:uppercase}
  .hero h1{margin:6px 0 4px;font-size:30px}
  .hero .sub{margin:0;color:#b9c2d6;font-size:14px;word-break:break-all}
  .pad{padding:32px 44px}
  .intro{font-size:17px;color:var(--ink);border-bottom:1px solid var(--line)}
  h2{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin:0 0 16px}
  .tiles{display:flex;gap:14px;flex-wrap:wrap;margin:0 0 8px}
  .tile{flex:1;min-width:150px;border:1px solid var(--line);border-radius:12px;padding:16px 18px}
  .tile .v{font-size:26px;font-weight:800}
  .tile .l{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:1px}
  .win{display:flex;gap:16px;align-items:flex-start;border:1px solid var(--line);
    border-left:5px solid var(--orange);border-radius:12px;padding:18px 20px;margin:0 0 14px}
  .win-num{flex:none;width:30px;height:30px;border-radius:50%;background:var(--navy);color:#fff;
    font-weight:800;display:flex;align-items:center;justify-content:center}
  .win h3{margin:2px 0 6px;font-size:18px}
  .win p{margin:0;color:var(--muted)}
  .none{color:var(--muted)}
  .shot{border:1px solid var(--line);border-radius:12px;overflow:hidden;margin:0 0 20px}
  .shot img{display:block;width:100%}
  .shot figcaption{padding:10px 16px;font-size:13px;color:var(--muted);background:#fbfcfe;border-top:1px solid var(--line)}
  ul.all{list-style:none;padding:0;margin:0;columns:2;gap:24px}
  ul.all li{margin:0 0 8px;font-size:14px}
  .dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:8px}
  .cta{background:var(--navy);color:#fff;padding:36px 44px;text-align:center}
  .cta h2{color:#fff;font-size:20px;letter-spacing:0;text-transform:none;margin:0 0 8px}
  .cta p{color:#b9c2d6;margin:0 0 18px}
  .btn{display:inline-block;background:var(--orange);color:#fff;text-decoration:none;
    font-weight:700;padding:12px 26px;border-radius:10px}
  .cta a.link{color:#fff}
  .sig{margin-top:18px;color:#8ea0c2;font-size:13px}
  @media(max-width:560px){.pad,.hero,.cta{padding-left:22px;padding-right:22px}ul.all{columns:1}}
  @media print{body{background:#fff}.wrap{max-width:none}}
</style>
</head>
<body>
<div class="wrap">
  <header class="hero">
    <div class="kicker">${esc(SENDER_TITLE)}</div>
    <h1>Website teardown</h1>
    <p class="sub">${esc(url)} · reviewed ${new Date().toLocaleDateString()}</p>
  </header>

  <!-- EDIT the greeting below: swap "Hi there" for the person's name -->
  <section class="pad intro">
    <p>Hi there — I took a quick look at your website and pulled together a few quick wins
    that could help it bring in more customers. No pitch, no obligation — just sharing what
    I noticed. Hope it's useful. — ${esc(SENDER_NAME)}</p>
  </section>

  <section class="pad">
    <div class="tiles">
      ${tiles.map((t) => `<div class="tile"><div class="v" style="color:${t.color}">${esc(t.value)}</div><div class="l">${esc(t.label)}</div></div>`).join("")}
    </div>
  </section>

  <section class="pad">
    <h2>3 quick wins</h2>
    ${winCards}
  </section>

  <section class="pad">
    <h2>How it looks now</h2>
    ${desktopImg ? `<figure class="shot"><img src="${desktopImg}" alt="Desktop screenshot"><figcaption>Desktop</figcaption></figure>` : ""}
    ${mobileImg ? `<figure class="shot"><img src="${mobileImg}" alt="Mobile screenshot"><figcaption>Mobile (phone)</figcaption></figure>` : ""}
  </section>

  <section class="pad">
    <h2>Everything I checked (${findings.length})</h2>
    <ul class="all">${allFindings}</ul>
  </section>

  <footer class="cta">
    <h2>Want these fixed?</h2>
    <p>I can take care of all of this — clear scope, honest pricing, and you work directly with me.</p>
    <a class="btn" href="mailto:${esc(CONTACT_EMAIL)}?subject=Website%20teardown%20—%20${esc(host)}">Reply to get started</a>
    <div class="sig">${esc(SENDER_NAME)} · ${esc(SENDER_TITLE)}<br>
      <a class="link" href="mailto:${esc(CONTACT_EMAIL)}">${esc(CONTACT_EMAIL)}</a> ·
      <a class="link" href="${esc(SITE_URL)}">${esc(SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>
    </div>
  </footer>
</div>
</body>
</html>`;

  await writeFile(path.join(outDir, "teardown.html"), html, "utf8");
}

main().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
