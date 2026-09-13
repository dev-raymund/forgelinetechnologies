/**
 * A small, closed Markdown renderer.
 *
 * Why not a library: the requirement is a handful of block types written by
 * trusted staff, and the property that matters is that the output contains
 * only tags we chose. A parser plus a sanitiser is two dependencies and an
 * allowlist to keep correct; this is one function whose output set is fixed by
 * construction.
 *
 * The rule that makes it safe: author text is HTML-escaped before any tag is
 * emitted, and tags are only ever produced by this file. Raw HTML in a post is
 * never passed through — a script tag in the source renders as the literal
 * characters, because escaping happens first and nothing un-escapes it after.
 *
 * Supported: headings, paragraphs, links, ordered and unordered lists, bold,
 * italic, inline code, fenced code, blockquotes, images, horizontal rules.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Only http(s), mailto and site-relative targets become links.
 *
 * Everything else — javascript:, data:, vbscript: — renders as plain text.
 * Whitespace and control characters are stripped before the test, because
 * "java\nscript:" and a leading space are the usual ways round a naive check.
 */
function safeUrl(raw: string): string | null {
  const url = raw.trim().replace(/[\u0000-\u0020]/g, "");
  if (/^(https?:|mailto:)/i.test(url)) return url;
  if (/^[/#]/.test(url)) return url;
  return null;
}

/** Bold, italic, links and images. Input is already escaped. */
function format(text: string): string {
  let out = text;

  // The optional title in ![alt](url "Title") is matched and discarded — it
  // renders as a tooltip nobody reads, but omitting it from the pattern made
  // standard Markdown silently fail to produce an image at all.
  out = out.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^)]*&quot;)?\)/g,
    (m, alt: string, href: string) => {
      const url = safeUrl(href);
      return url ? `<img src="${url}" alt="${alt}" loading="lazy" />` : m;
    },
  );

  out = out.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^)]*&quot;)?\)/g,
    (m, label: string, href: string) => {
      const url = safeUrl(href);
      if (!url) return m;
      const external = /^https?:/i.test(url);
      const rel = external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${url}"${rel}>${label}</a>`;
    },
  );

  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return out;
}

/**
 * Inline formatting, code spans excluded.
 *
 * Splitting on backticks rather than substituting placeholders: odd indices
 * are code contents and pass through untouched, so nothing inside backticks is
 * reinterpreted as markup, and there is no marker an author could collide with
 * by typing it.
 */
function inline(text: string): string {
  return text
    .split(/`([^`]+)`/g)
    .map((part, i) => (i % 2 === 1 ? `<code>${part}</code>` : format(part)))
    .join("");
}

export function renderMarkdown(source: string): string {
  const escaped = escapeHtml(source.replace(/\r\n/g, "\n"));
  const lines = escaped.split("\n");
  const html: string[] = [];

  let paragraph: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  let quote: string[] = [];
  let fence: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      const items = list.items.map((i) => `<li>${inline(i)}</li>`).join("");
      html.push(`<${list.type}>${items}</${list.type}>`);
      list = null;
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      html.push(`<blockquote><p>${inline(quote.join(" "))}</p></blockquote>`);
      quote = [];
    }
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      if (fence) {
        html.push(`<pre><code>${fence.join("\n")}</code></pre>`);
        fence = null;
      } else {
        flushAll();
        fence = [];
      }
      continue;
    }
    if (fence) {
      fence.push(line);
      continue;
    }

    if (!line.trim()) {
      flushAll();
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushAll();
      // A post already sits under an h1, so "#" starts at h2 and the document
      // outline stays legal however the author writes it.
      const level = Math.min(6, heading[1]!.length + 1);
      html.push(`<h${level}>${inline(heading[2]!.trim())}</h${level}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushAll();
      html.push("<hr />");
      continue;
    }

    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      flushQuote();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(bullet[1]!);
      continue;
    }

    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (numbered) {
      flushParagraph();
      flushQuote();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(numbered[1]!);
      continue;
    }

    // ">" has already been escaped to "&gt;" by this point.
    const quoted = /^\s*&gt;\s?(.*)$/.exec(line);
    if (quoted) {
      flushParagraph();
      flushList();
      quote.push(quoted[1]!);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line.trim());
  }

  if (fence) html.push(`<pre><code>${fence.join("\n")}</code></pre>`);
  flushAll();
  return html.join("\n");
}

/** First prose of a post, for a fallback excerpt or meta description. */
export function excerptFrom(source: string, max = 200): string {
  const plain = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max).replace(/\s+\S*$/, "")}…`;
}
