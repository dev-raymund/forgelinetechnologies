/**
 * One-off migration: pulls the <article class="work-card"> entries out of the
 * original static site/index.html into JSON for the DB seed.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(here, "../../site/index.html"), "utf8");

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();

const cardRe = /<article class="work-card[^"]*"\s+data-cat="([^"]+)">([\s\S]*?)<\/article>/g;
const pick = (body, re) => {
  const m = body.match(re);
  return m ? decode(m[1]) : "";
};

const works = [];
let m;
while ((m = cardRe.exec(html)) !== null) {
  const [, category, body] = m;
  works.push({
    category,
    imageUrl: pick(body, /<img[^>]*\ssrc="([^"]+)"/),
    imageAlt: pick(body, /<img[^>]*\salt="([^"]+)"/),
    badge: pick(body, /<span class="badge-tech">([\s\S]*?)<\/span>/),
    title: pick(body, /<h3>([\s\S]*?)<\/h3>/),
    description: pick(body, /<div class="work-body">[\s\S]*?<h3>[\s\S]*?<\/h3>\s*<p>([\s\S]*?)<\/p>/),
    liveUrl: pick(body, /<p class="links"><a href="([^"]+)"/),
  });
}

const bad = works.filter((w) => !w.title || !w.category);
if (bad.length) {
  console.error(`${bad.length} card(s) failed to parse:`, bad);
  process.exit(1);
}

writeFileSync(resolve(here, "../src/db/works-seed.json"), JSON.stringify(works, null, 2) + "\n");
console.log(`extracted ${works.length} works`);
for (const [cat, n] of Object.entries(
  works.reduce((a, w) => ({ ...a, [w.category]: (a[w.category] ?? 0) + 1 }), {}),
)) {
  console.log(`  ${cat}: ${n}`);
}
