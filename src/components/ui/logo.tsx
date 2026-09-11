import { site } from "@/lib/site";

/**
 * The Forgeline lockup.
 *
 * This is the supplied artwork, inlined: the same geometry, the same tile,
 * the same crossbar, and the "TECHNOLOGIES" line that the asset carries.
 *
 * Two changes, both so the mark belongs to the page rather than sitting on
 * top of it. The wordmark is set in the site's own typeface instead of the
 * asset's system-font stack, and the fills are wired to the colour tokens so
 * a single lockup works on paper and on navy — no second file to keep in
 * step. The tile stays white on both, because it is a badge and that is how
 * the artwork is drawn.
 *
 * `role="img"` plus a label means assistive technology announces the company
 * name once, rather than reading "Forgeline" and "TECHNOLOGIES" as two
 * separate strings.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 190 44"
      role="img"
      aria-label={site.name}
      className={`h-8 w-auto ${className}`}
    >
      <g transform="translate(0,2)">
        <rect
          x="0.5"
          y="0.5"
          width="39"
          height="39"
          rx="10.5"
          fill="#ffffff"
          stroke="var(--color-rule)"
          strokeWidth="1"
        />
        <path
          d="M12.5 10.5 H28.5 V15.5 H18 V29.5 H12.5 Z"
          fill="var(--color-ink)"
        />
        <rect
          x="18"
          y="18.2"
          width="8.4"
          height="4.6"
          rx="0.6"
          fill="var(--color-accent)"
        />
      </g>
      <text
        x="51"
        y="25"
        fontSize="21"
        fontWeight="700"
        letterSpacing="-0.6"
        fill="currentColor"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        Forgeline
      </text>
      {/* 0.7 rather than the asset's flat grey: it has to stay legible on navy
          as well as on paper, and at this size it needs to clear 4.5:1 on
          both. Inheriting currentColor is what makes that possible. */}
      <text
        x="52"
        y="37"
        fontSize="8"
        fontWeight="600"
        letterSpacing="3"
        fill="currentColor"
        fillOpacity="0.7"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        TECHNOLOGIES
      </text>
    </svg>
  );
}
