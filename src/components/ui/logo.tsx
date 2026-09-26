import { site } from "@/lib/site";

/**
 * The Forgeline lockup — the supplied artwork.
 *
 * The mark is the supplied file traced to vector: two straight-edged paths of
 * thirteen points each, ~99% pixel overlap with the original. Tracing beats
 * shipping the PNG because the header renders it at 32px and a retina display
 * renders it at 64 — and it beats the previous hand-drawn approximation
 * because this is actually the logo.
 *
 * The wordmark is set in the site's own Archivo rather than traced. Tracing
 * letterforms from a render produces hundreds of nodes, and text that is real
 * text stays sharp and stays selectable by search engines reading the DOM.
 *
 * Laid out as flex HTML rather than SVG `<text>`: an SVG viewport clips
 * anything wider than its viewBox, and the width of a text run is not known
 * until the font loads. The old lockup sat one late-loading font away from a
 * clipped wordmark.
 *
 * Colours come from the `.logo` custom properties in globals.css, so the one
 * piece of markup reverses on navy without a second file to keep in step.
 *
 * Proportions are measured off the supplied lockup, as ratios of the mark's
 * height: the gap to the wordmark is 0.084, the FORGELINE cap height 0.40, and
 * TECHNOLOGIES' cap 0.43 of that again. Archivo is a narrower face than the
 * logo's own, so cap height is what is matched — it sets the lockup's height —
 * and the wordmark lands about a tenth narrower than the artwork. Tracking
 * takes up part of the difference; chasing the rest would mean loose,
 * conspicuous letter-spacing.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label={site.name}
      className={`logo inline-flex items-center gap-[3px] ${className}`}
    >
      <svg
        viewBox="0 0 100 71.88"
        aria-hidden="true"
        className="h-8 w-auto shrink-0"
      >
        <path fill="var(--logo-blue)" d="M25.71 0.07L99.93 0L100 0.36L90.7 13.64L32.6 13.64L23.44 33.17L10.16 59.8L2.13 48.08L0 44.53L19.32 4.05L20.17 2.77L22.09 1.14L24.08 0.28Z" />
        <path fill="var(--logo-orange)" d="M47.44 18.96L88.21 19.11L79.05 31.53L65.13 31.53L64.91 31.75L48.01 65.41L46.09 68.75L45.1 69.18L28.48 71.88L48.86 31.75L48.79 31.53L30.11 31.46L36.29 19.03Z" />
      </svg>

      {/* aria-hidden: the label on the wrapper already announces the company
          name once. Without this the wordmark would be read again, and
          "TECHNOLOGIES" would be spelled out as a separate string. */}
      <span aria-hidden="true" className="flex flex-col leading-none">
        <span className="text-[1.125rem] font-bold tracking-[0.01em]">
          <span style={{ color: "var(--logo-wordmark)" }}>FORGE</span>
          <span style={{ color: "var(--logo-orange)" }}>LINE</span>
        </span>
        <span
          className="mt-[0.3em] text-[0.47rem] font-semibold tracking-[0.38em]"
          style={{ color: "var(--logo-wordmark)" }}
        >
          TECHNOLOGIES
        </span>
      </span>
    </span>
  );
}
