import { load, type CheerioAPI } from "cheerio";
import type { Element } from "domhandler";
import type {
  AuditFinding,
  Confidence,
  FindingCategory,
  FindingSeverity,
  JsonValue,
} from "./types.ts";

export type PageAnalysisInput = {
  pageUrl: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  body: string;
  bytes: number;
  elapsedMs: number;
  redirectChain?: string[];
  robotsTxt?: ResourceCheck;
  sitemap?: ResourceCheck;
};

export type ResourceCheck = {
  url: string;
  status: number;
  body: string;
};

export type DiscoveredLink = {
  sourceUrl: string;
  url: string;
  sameOrigin: boolean;
};

export type TechnologyIndicator = {
  name: string;
  signal: string;
  confidence: Confidence;
};

/**
 * What the page actually declared. `null` and `false` mean "not present on the
 * page", never "not checked" — every field here is read from the one HTML
 * response, so absence is always an observation.
 *
 * `robotsMeta` and `sitemapLink` are the `<meta name="robots">` tag and the
 * `<link rel="sitemap">` element. They are NOT `/robots.txt` and
 * `/sitemap.xml`, which cost a request each and are only fetched by a full
 * audit — naming them apart keeps a rule from reading "no sitemap link" as
 * "no sitemap".
 */
export type PageObservations = {
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  canonical: string | null;
  viewport: boolean;
  robotsMeta: boolean;
  sitemapLink: boolean;
  /** At least one `application/ld+json` block that parses. */
  jsonLd: boolean;
};

/** Counted facts about the page. Plain totals, with nothing inferred from them. */
export type PageSignals = {
  forms: number;
  ctas: number;
  images: number;
  imagesWithoutAlt: number;
  scripts: number;
  stylesheets: number;
  htmlBytes: number;
  /** A storefront platform was detected by name. */
  ecommerce: boolean;
};

export type PageAnalysis = {
  findings: AuditFinding[];
  links: DiscoveredLink[];
  technologyIndicators: TechnologyIndicator[];
  observations: PageObservations;
  signals: PageSignals;
  performance: {
    status: number;
    responseTimeMs: number;
    htmlBytes: number;
    renderBlockingStylesheets: number;
    scriptCount: number;
    imageCount: number;
    redirects: number;
  };
};

function finding(
  pageUrl: string,
  rule: string,
  category: FindingCategory,
  severity: FindingSeverity,
  evidence: Record<string, JsonValue>,
  recommendation: string,
  confidence: Confidence = "high",
  suffix = "",
): AuditFinding {
  return {
    id: `${rule}:${pageUrl}${suffix ? `:${suffix}` : ""}`,
    category,
    rule,
    severity,
    pageUrl,
    evidence,
    recommendation,
    confidence,
    observedAt: new Date().toISOString(),
  };
}

function headersLowercase(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
}

const CTA_TEXT = /get started|contact|book|learn|start|quote|call|buy|shop/i;

/** Platforms whose presence is a storefront, by name from `technologyIndicators`. */
const ECOMMERCE_PLATFORMS = new Set(["Shopify", "WooCommerce"]);

/**
 * Elements whose own text reads as a next step.
 *
 * Counted rather than merely detected, so a scan can report how many were
 * seen. The `missing-primary-cta` finding is this count being zero, so the
 * number and the finding can never disagree about the same page.
 */
function countCtas($: CheerioAPI): number {
  return $("a, button, input[type='submit']")
    .toArray()
    .filter((element) => CTA_TEXT.test($(element).text().trim())).length;
}

/**
 * Elements a page's layout is actually built from. A width on anything else
 * is not a layout width.
 */
const LAYOUT_TAGS = new Set(["body", "div", "main", "section", "header", "footer", "article", "table"]);

/**
 * How sliders, carousels and marquees name themselves. A wide track inside one
 * is the component working, not the page being fixed-width.
 */
const SLIDER_NAME = /slid|carousel|swiper|owl|slick|flickity|glide|splide|marquee|track|ticker|scroller|masonry/i;

/**
 * The width range a real fixed-width layout occupies.
 *
 * Designers who fix a page width pick something near a desktop viewport. A
 * value far outside that is a slider track (17100px was one observed in the
 * wild) or a decorative element, not a layout decision.
 */
const MIN_LAYOUT_PX = 1_000;
const MAX_LAYOUT_PX = 2_000;

/** How far below `body` a genuine layout wrapper sits. */
const MAX_WRAPPER_DEPTH = 3;

function names($: CheerioAPI, element: Element): string {
  return `${$(element).attr("class") ?? ""} ${$(element).attr("id") ?? ""}`;
}

/**
 * A page whose layout is pinned to a pixel width.
 *
 * This rule used to read the `width` attribute of any element and any inline
 * `width:` declaration. Against twenty real sites that produced twenty
 * findings and zero true positives: every one was an `<img width="1941">`
 * declaring its own intrinsic size, which is correct practice and is what
 * `missing-image-dimensions` asks for. The two rules were contradicting each
 * other, and the outreach told mobile-ready businesses their site did not work
 * on a phone.
 *
 * So the `width` attribute is not consulted at all. On `img`, `svg`, `canvas`,
 * `video` and `iframe` it is an intrinsic dimension; on a legacy `table` it
 * could once have meant layout, but not reliably enough to justify a claim to
 * a stranger.
 *
 * What remains is narrow on purpose: an inline pixel width, in the range a
 * desktop layout actually uses, on an element the layout is built from, near
 * the top of the tree, with no sign of slider machinery on it or above it.
 * Where those cannot all be established the finding is not raised — a false
 * negative costs a prospect, a false positive costs credibility.
 */
export function fixedWidthLayout($: CheerioAPI): { element: string; widthPx: number } | null {
  for (const element of $("[style]").toArray()) {
    const tag = (element as Element).tagName?.toLowerCase() ?? "";
    if (!LAYOUT_TAGS.has(tag)) continue;

    const style = $(element).attr("style") ?? "";
    // Anchored so `min-width`, `max-width` and custom properties such as
    // `--smush-placeholder-width` are not read as a layout width.
    const declared = /(?:^|;)\s*width\s*:\s*(\d{3,5})px/i.exec(style);
    if (!declared) continue;

    const widthPx = Number(declared[1]);
    if (widthPx < MIN_LAYOUT_PX || widthPx > MAX_LAYOUT_PX) continue;

    // A transform on the same element is how a slider positions its track.
    if (/transform\s*:/i.test(style)) continue;
    if (SLIDER_NAME.test(names($, element as Element))) continue;

    const ancestors = $(element).parents().toArray();
    if (ancestors.some((parent) => SLIDER_NAME.test(names($, parent as Element)))) continue;

    // A layout wrapper sits near the top. A repeated slide or card does not.
    const depth = ancestors.filter((a) => (a as Element).tagName?.toLowerCase() !== "html").length;
    if (tag !== "body" && depth > MAX_WRAPPER_DEPTH) continue;

    return { element: tag, widthPx };
  }
  return null;
}

function canonicalUrl(pageUrl: string, raw: string): string | null {
  try {
    const url = new URL(raw, pageUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function collectAuditLinks(baseUrl: string, html: string): DiscoveredLink[] {
  const $ = load(html);
  const base = new URL(baseUrl);
  const seen = new Set<string>();
  const links: DiscoveredLink[] = [];

  $("a[href]").each((_index, element) => {
    const raw = $(element).attr("href")?.trim();
    if (!raw || /^(?:#|mailto:|tel:|javascript:|data:)/i.test(raw)) return;
    let url: URL;
    try {
      url = new URL(raw, base);
    } catch {
      return;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return;
    url.hash = "";
    const normalized = url.toString();
    if (seen.has(normalized)) return;
    seen.add(normalized);
    links.push({ sourceUrl: base.toString(), url: normalized, sameOrigin: url.origin === base.origin });
  });

  return links.sort((a, b) => Number(b.sameOrigin) - Number(a.sameOrigin)).slice(0, 12);
}

export function technologyIndicators(
  headers: Record<string, string>,
  $: CheerioAPI,
): TechnologyIndicator[] {
  const indicators: TechnologyIndicator[] = [];
  const generator = $("meta[name='generator']").attr("content") ?? "";
  const lowerGenerator = generator.toLowerCase();
  const lowerServer = (headers.server ?? "").toLowerCase();

  if (lowerGenerator.includes("wordpress")) {
    indicators.push({ name: "WordPress", signal: `generator:${generator}`, confidence: "high" });
  }
  if (lowerGenerator.includes("shopify")) {
    indicators.push({ name: "Shopify", signal: `generator:${generator}`, confidence: "high" });
  }
  // WordPress prints its own generator tag first, so every generator tag is
  // read here: `attr()` on the selection above returns only the first.
  const wooGenerator = $("meta[name='generator']")
    .map((_, element) => $(element).attr("content") ?? "")
    .get()
    .find((content) => content.toLowerCase().includes("woocommerce"));
  const wooAsset =
    $(
      "script[src*='/wp-content/plugins/woocommerce/'], link[href*='/wp-content/plugins/woocommerce/']",
    ).length > 0;
  if (wooGenerator) {
    indicators.push({ name: "WooCommerce", signal: `generator:${wooGenerator}`, confidence: "high" });
  } else if (wooAsset) {
    indicators.push({
      name: "WooCommerce",
      signal: "asset-path:/wp-content/plugins/woocommerce/",
      confidence: "high",
    });
  }
  if (lowerServer.includes("vercel")) {
    indicators.push({ name: "Vercel", signal: `server:${headers.server}`, confidence: "medium" });
  }
  if ($("script[src*='/_next/'], link[href*='/_next/']").length > 0) {
    indicators.push({ name: "Next.js", signal: "asset-path:/_next/", confidence: "medium" });
  }
  return indicators;
}

export function analyzePage(input: PageAnalysisInput): PageAnalysis {
  const $ = load(input.body);
  const headers = headersLowercase(input.headers);
  const findings: AuditFinding[] = [];
  const title = $("title").first().text().trim();
  const metaDescription = $("meta[name='description']").attr("content")?.trim() ?? "";
  const h1Count = $("h1").length;
  const titleCount = $("title").length;
  const descriptionCount = $("meta[name='description']").length;
  const canonical = $("link[rel='canonical']").attr("href")?.trim() ?? "";
  const viewport = $("meta[name='viewport']").attr("content")?.trim() ?? "";
  const robots = $("meta[name='robots']").attr("content")?.trim() ?? "";
  const stylesheets = $("link[rel~='stylesheet']").length;
  const scripts = $("script").length;
  const images = $("img").length;
  const forms = $("form").length;
  const ctas = countCtas($);
  const sitemapLink = $("link[rel='sitemap']").length > 0;
  const h1 = $("h1").first().text().trim();
  let imagesWithoutAlt = 0;
  let validJsonLd = false;

  if (!title) {
    findings.push(finding(input.finalUrl, "missing-title", "seo", "high", {}, "Add a unique, descriptive page title."));
  }
  if (titleCount > 1) {
    findings.push(finding(input.finalUrl, "duplicate-title", "seo", "low", { count: titleCount }, "Keep one unique title element."));
  }
  if (!metaDescription) {
    findings.push(
      finding(input.finalUrl, "missing-meta-description", "seo", "medium", {}, "Add a concise meta description that describes this page."),
    );
  }
  if (descriptionCount > 1) {
    findings.push(finding(input.finalUrl, "duplicate-meta-description", "seo", "low", { count: descriptionCount }, "Keep one meta description for the page."));
  }
  if (h1Count === 0) {
    findings.push(finding(input.finalUrl, "missing-h1", "seo", "medium", {}, "Add one clear primary heading to the page."));
  } else if (h1Count > 1) {
    findings.push(
      finding(input.finalUrl, "multiple-h1", "seo", "low", { count: h1Count }, "Review the heading hierarchy and keep one primary H1."),
    );
  }
  if (!canonical) {
    findings.push(finding(input.finalUrl, "missing-canonical", "seo", "low", {}, "Add a canonical URL when this page needs an explicit canonical."));
  } else if (!canonicalUrl(input.finalUrl, canonical)) {
    findings.push(
      finding(input.finalUrl, "invalid-canonical", "seo", "medium", { value: canonical }, "Correct the canonical URL so it uses HTTP or HTTPS."),
    );
  }
  if (!robots) {
    findings.push(
      finding(input.finalUrl, "missing-robots", "metadata", "informational", {}, "Check whether explicit robots metadata is needed for this page."),
    );
  }
  if (robots && /\bnoindex\b/i.test(robots)) {
    findings.push(finding(input.finalUrl, "noindex-meta", "seo", "informational", { value: robots }, "Confirm that the observed noindex directive is intentional."));
  }
  if (!viewport) {
    findings.push(
      finding(input.finalUrl, "missing-viewport", "mobile", "medium", {}, "Add a viewport meta tag for responsive mobile rendering."),
    );
  }

  if ($("script[type='application/ld+json']").length === 0) {
    findings.push(finding(input.finalUrl, "missing-structured-data", "metadata", "informational", {}, "Review whether relevant structured data is appropriate for this page."));
  }

  if (input.status >= 400) {
    findings.push(finding(input.finalUrl, "http-response-error", "technical", "high", { status: input.status }, "Investigate the HTTP response before relying on this page as a public entry point."));
  }
  if (input.elapsedMs > 3_000) {
    findings.push(finding(input.finalUrl, "slow-response", "technical", "medium", { responseTimeMs: input.elapsedMs, thresholdMs: 3_000 }, "Measure and review the response path for avoidable server or delivery delay."));
  }
  if (input.bytes > 500_000) {
    findings.push(finding(input.finalUrl, "oversized-html", "technical", "medium", { bytes: input.bytes, thresholdBytes: 500_000 }, "Review the HTML payload and delivery path for unnecessary weight."));
  }
  if ((input.redirectChain?.length ?? 0) > 3) {
    findings.push(finding(input.finalUrl, "redirect-chain-too-long", "technical", "medium", { redirects: input.redirectChain?.length ?? 0, threshold: 3 }, "Review the redirect chain and keep the canonical path direct."));
  }

  if (input.robotsTxt) {
    if (input.robotsTxt.status < 200 || input.robotsTxt.status >= 400) {
      findings.push(finding(input.robotsTxt.url, "missing-robots-txt", "seo", "low", { status: input.robotsTxt.status }, "Publish a readable robots.txt response when crawler guidance is needed."));
    } else if (!/user-agent\s*:/i.test(input.robotsTxt.body)) {
      findings.push(finding(input.robotsTxt.url, "invalid-robots", "seo", "low", { status: input.robotsTxt.status }, "Check that robots.txt uses recognizable User-agent directives."));
    }
  }
  if (input.sitemap) {
    if (input.sitemap.status < 200 || input.sitemap.status >= 400) {
      findings.push(finding(input.sitemap.url, "missing-sitemap", "seo", "low", { status: input.sitemap.status }, "Publish or reference a valid XML sitemap when one is appropriate."));
    } else if (!/<(?:urlset|sitemapindex)\b/i.test(input.sitemap.body)) {
      findings.push(finding(input.sitemap.url, "invalid-sitemap", "seo", "low", { status: input.sitemap.status }, "Check that the sitemap response is valid XML with a sitemap root element."));
    }
  }

  $("script[type='application/ld+json']").each((index, element) => {
    const raw = $(element).text().trim();
    try {
      JSON.parse(raw);
      validJsonLd = true;
    } catch {
      findings.push(
        finding(
          input.finalUrl,
          "invalid-structured-data",
          "metadata",
          "medium",
          { scriptIndex: index, length: raw.length },
          "Correct or remove structured data that is not valid JSON.",
          "high",
          String(index),
        ),
      );
    }
  });

  $("img").each((index, element) => {
    if ($(element).attr("alt") === undefined) {
      imagesWithoutAlt += 1;
      findings.push(
        finding(
          input.finalUrl,
          "missing-image-alt",
          "accessibility",
          "low",
          { imageIndex: index, src: $(element).attr("src") ?? "" },
          "Give informative images useful alt text, or mark decorative images appropriately.",
          "high",
          String(index),
        ),
      );
    }
    if (!$(element).attr("width") && !$(element).attr("height")) {
      findings.push(
        finding(
          input.finalUrl,
          "missing-image-dimensions",
          "image",
          "informational",
          { imageIndex: index, src: $(element).attr("src") ?? "" },
          "Consider reserving image dimensions to reduce layout movement.",
        ),
      );
    }
  });

  const fixedWidth = fixedWidthLayout($);
  if (fixedWidth) {
    findings.push(
      finding(
        input.finalUrl,
        "fixed-width-layout",
        "mobile",
        "medium",
        { element: fixedWidth.element, widthPx: fixedWidth.widthPx },
        "Review the fixed pixel width on this layout container at mobile breakpoints.",
      ),
    );
  }

  $("form").each((index, element) => {
    if ($(element).find("button[type='submit'], input[type='submit']").length === 0) {
      findings.push(
        finding(
          input.finalUrl,
          "form-without-submit-control",
          "conversion",
          "low",
          { formIndex: index },
          "Check that the form exposes a clear, usable submit control.",
        ),
      );
    }
  });

  if (ctas === 0) {
    findings.push(
      finding(
        input.finalUrl,
        "missing-primary-cta",
        "conversion",
        "low",
        { checkedElements: ["a", "button", "input[type=submit]"] },
        "Consider making the intended next step clear in the first page view.",
      ),
    );
  }

  const indicators = technologyIndicators(headers, $);
  const links = collectAuditLinks(input.finalUrl, input.body);
  return {
    findings,
    links,
    technologyIndicators: indicators,
    observations: {
      title: title || null,
      metaDescription: metaDescription || null,
      h1: h1 || null,
      canonical: canonical || null,
      viewport: Boolean(viewport),
      robotsMeta: Boolean(robots),
      sitemapLink,
      jsonLd: validJsonLd,
    },
    signals: {
      forms,
      ctas,
      images,
      imagesWithoutAlt,
      scripts,
      stylesheets,
      htmlBytes: input.bytes,
      ecommerce: indicators.some((indicator) => ECOMMERCE_PLATFORMS.has(indicator.name)),
    },
    performance: {
      status: input.status,
      responseTimeMs: input.elapsedMs,
      htmlBytes: input.bytes,
      renderBlockingStylesheets: stylesheets,
      scriptCount: scripts,
      imageCount: images,
      redirects: input.redirectChain?.length ?? 0,
    },
  };
}
