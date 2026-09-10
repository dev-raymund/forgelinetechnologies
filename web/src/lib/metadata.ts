import type { Metadata } from "next";

/**
 * Build a complete Open Graph object for a page.
 *
 * Next merges metadata shallowly: a page that sets `openGraph` REPLACES the
 * parent's entire object rather than merging into it. Setting just
 * `openGraph: { url }` on a page therefore silently drops og:type,
 * og:site_name, og:locale and the rest.
 *
 * So every page that needs a page-specific og:url must restate the whole
 * object. This helper is that restatement, in one place.
 *
 * og:image is intentionally absent — the opengraph-image.tsx convention file
 * is detected automatically and applied to og:image and twitter:image, and
 * listing it here by hand would risk the two disagreeing.
 */
export const SITE_NAME = "Forgeline Technologies";

export function openGraph({
  url,
  title,
  description,
  type = "website",
  publishedTime,
}: {
  url: string;
  title: string;
  description: string;
  type?: "website" | "article";
  publishedTime?: string;
}): Metadata["openGraph"] {
  return {
    type,
    siteName: SITE_NAME,
    locale: "en_US",
    url,
    title,
    description,
    ...(type === "article" && publishedTime ? { publishedTime } : {}),
  };
}
