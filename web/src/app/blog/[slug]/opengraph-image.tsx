/**
 * Same reason as blog/opengraph-image.tsx: the convention does not cascade
 * into nested segments, so [slug] needs its own or individual posts ship no
 * og:image. A post with its own coverUrl overrides this in generateMetadata.
 */
export { default, size, contentType, alt } from "../../opengraph-image";
