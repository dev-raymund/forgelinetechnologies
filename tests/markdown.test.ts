import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown, excerptFrom } from "../src/lib/markdown.ts";

/**
 * The renderer's whole job is that its output contains only tags it chose.
 * These are the attempts to get a tag past it.
 */

test("raw HTML is rendered as text, never as markup", () => {
  const out = renderMarkdown('<script>alert(1)</script>');
  assert.ok(!out.includes("<script>"), "script tag survived");
  assert.ok(out.includes("&lt;script&gt;"), "should be escaped");
});

test("img onerror payloads cannot produce an attribute", () => {
  const out = renderMarkdown('<img src=x onerror="alert(1)">');
  assert.ok(!/onerror=/.test(out.replace(/&quot;/g, "")) || out.includes("&lt;img"));
  assert.ok(out.includes("&lt;img"), "img tag should be escaped");
});

test("javascript: URLs do not become links", () => {
  for (const href of [
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "  javascript:alert(1)",
    "java\tscript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD4=",
    "vbscript:msgbox(1)",
  ]) {
    const out = renderMarkdown(`[click](${href})`);
    assert.ok(!out.includes("<a href"), `link produced for ${href}: ${out}`);
  }
});

test("http, mailto and relative URLs do become links", () => {
  assert.match(renderMarkdown("[x](https://example.com)"), /<a href="https:\/\/example\.com"/);
  assert.match(renderMarkdown("[x](mailto:a@b.com)"), /<a href="mailto:a@b\.com"/);
  assert.match(renderMarkdown("[x](/work)"), /<a href="\/work"/);
});

test("external links carry noopener", () => {
  const out = renderMarkdown("[x](https://example.com)");
  assert.match(out, /rel="noopener noreferrer"/);
  // Internal ones do not need it and should not get it.
  assert.ok(!renderMarkdown("[x](/work)").includes("noopener"));
});

test("javascript: in an image source does not produce an img", () => {
  const out = renderMarkdown("![alt](javascript:alert(1))");
  assert.ok(!out.includes("<img"), out);
});

test("attribute injection through a link label is escaped", () => {
  const out = renderMarkdown('[" onmouseover="alert(1)](https://example.com)');
  assert.ok(!out.includes('onmouseover="alert'), out);
  assert.ok(out.includes("&quot;"), "quotes should be escaped");
});

test("headings start at h2 so the page outline stays legal", () => {
  assert.match(renderMarkdown("# Title"), /<h2>Title<\/h2>/);
  assert.match(renderMarkdown("## Sub"), /<h3>Sub<\/h3>/);
  // Six hashes cannot escape past h6.
  assert.match(renderMarkdown("###### Deep"), /<h6>Deep<\/h6>/);
});

test("blocks render", () => {
  assert.match(renderMarkdown("Hello world"), /<p>Hello world<\/p>/);
  assert.match(renderMarkdown("- one\n- two"), /<ul><li>one<\/li><li>two<\/li><\/ul>/);
  assert.match(renderMarkdown("1. one\n2. two"), /<ol><li>one<\/li><li>two<\/li><\/ol>/);
  assert.match(renderMarkdown("> quoted"), /<blockquote><p>quoted<\/p><\/blockquote>/);
  assert.match(renderMarkdown("---"), /<hr \/>/);
  assert.match(renderMarkdown("**bold**"), /<strong>bold<\/strong>/);
  assert.match(renderMarkdown("*italic*"), /<em>italic<\/em>/);
});

test("code spans are not reinterpreted as markup", () => {
  const out = renderMarkdown("use `**not bold**` here");
  assert.match(out, /<code>\*\*not bold\*\*<\/code>/);
  assert.ok(!out.includes("<strong>"), out);
});

test("fenced code keeps its contents literal", () => {
  const out = renderMarkdown("```\n<script>alert(1)</script>\n```");
  assert.match(out, /<pre><code>/);
  assert.ok(!out.includes("<script>"), out);
});

test("excerpt strips markup and truncates on a word boundary", () => {
  assert.equal(excerptFrom("# Title\n\nSome **bold** prose."), "Title Some bold prose.");
  const long = excerptFrom("word ".repeat(100), 50);
  assert.ok(long.length <= 51, `excerpt was ${long.length} chars`);
  assert.ok(long.endsWith("…"));
});
