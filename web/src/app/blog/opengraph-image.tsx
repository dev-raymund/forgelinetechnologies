/**
 * Next's opengraph-image convention applies to the segment it sits in; it
 * does not cascade into nested segments. Without this file /blog and
 * /blog/[slug] ship no og:image at all.
 *
 * Re-exported rather than duplicated so there is exactly one card design.
 * A post that has its own coverUrl overrides this via generateMetadata.
 */
export { default, size, contentType, alt } from "../opengraph-image";
