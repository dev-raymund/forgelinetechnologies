/**
 * A technology mark, recoloured to the site palette.
 *
 * The source files are simple-icons: one path each, with the vendor's brand
 * colour baked into a `fill` attribute. Rendering them as <img> would drag
 * twenty unrelated brand colours onto a page built from two, so each is used
 * as a CSS mask instead and painted with `currentColor`. The icon keeps its
 * shape and takes our colour, and the files stay separately cacheable rather
 * than inflating the HTML of every page that shows them.
 *
 * Decorative: the technology's name sits beside it as real text, so the mark
 * is hidden from assistive technology rather than announced twice.
 */
export function TechIcon({
  icon,
  className = "",
}: {
  icon: string;
  className?: string;
}) {
  const url = `url(/assets/tech/${icon}.svg)`;
  return (
    <span
      aria-hidden="true"
      className={`tech-mark ${className}`}
      style={{ maskImage: url, WebkitMaskImage: url }}
    />
  );
}
