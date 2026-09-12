/**
 * Hero visual.
 *
 * A product assembling itself: the frame draws, then the pieces land, then the
 * one orange element — the thing you ship — arrives last.
 *
 * It is a schematic rather than a picture. The studio sells built software, so
 * the most characteristic thing in its world is an interface coming together;
 * drawing it in hairlines on an engineering grid keeps that closer to a
 * technical drawing than to a stock illustration, and it costs no network
 * request because it is inline SVG rather than an image.
 *
 * Every stroke is currentColor or the accent, so the piece inherits the two
 * brand colours and nothing else. `pathLength="1"` lets each outline animate
 * with a dash offset of 1 without hard-coding real path lengths.
 *
 * Decorative, so aria-hidden: the hero's heading already says what the studio
 * does, and narrating a diagram of rectangles would add nothing.
 */
export function HeroVisual() {
  return (
    <svg
      viewBox="0 0 440 330"
      className="h-auto w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id="hv-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Engineering canvas behind the frame. */}
      <rect x="0" y="8" width="440" height="300" fill="url(#hv-grid)" />

      {/* The rail, arriving from the left exactly as it does on the page. */}
      <path
        d="M0 170 H36"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="1"
        className="hv-draw"
        pathLength={1}
        style={{ animationDelay: "120ms" }}
      />
      <circle cx="36" cy="170" r="3" fill="var(--color-accent)" className="hv-in" style={{ animationDelay: "900ms" }} />

      {/* Window frame. */}
      <rect
        x="44" y="26" width="368" height="262" rx="8"
        fill="none" stroke="currentColor" strokeOpacity="0.24" strokeWidth="1"
        className="hv-draw" pathLength={1} style={{ animationDelay: "200ms" }}
      />
      <path
        d="M44 62 H412"
        stroke="currentColor" strokeOpacity="0.18" strokeWidth="1"
        className="hv-draw" pathLength={1} style={{ animationDelay: "500ms" }}
      />
      <g className="hv-in" style={{ animationDelay: "620ms" }}>
        <circle cx="62" cy="44" r="3.5" fill="var(--color-accent)" />
        <circle cx="76" cy="44" r="3.5" fill="currentColor" fillOpacity="0.22" />
        <circle cx="90" cy="44" r="3.5" fill="currentColor" fillOpacity="0.22" />
      </g>

      {/* Left column: a media block, two lines of copy, then the action. */}
      <rect
        x="66" y="84" width="176" height="92" rx="4"
        fill="currentColor" fillOpacity="0.07"
        stroke="currentColor" strokeOpacity="0.16" strokeWidth="1"
        className="hv-in" style={{ animationDelay: "700ms" }}
      />
      <rect x="66" y="190" width="176" height="9" rx="4.5" fill="currentColor" fillOpacity="0.18"
        className="hv-in" style={{ animationDelay: "780ms" }} />
      <rect x="66" y="207" width="132" height="9" rx="4.5" fill="currentColor" fillOpacity="0.13"
        className="hv-in" style={{ animationDelay: "840ms" }} />
      <rect x="66" y="234" width="86" height="26" rx="4" fill="var(--color-accent)"
        className="hv-in" style={{ animationDelay: "980ms" }} />

      {/* Right column: rows of data, arriving in sequence. */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i} className="hv-in" style={{ animationDelay: `${760 + i * 70}ms` }}>
          <rect
            x="266" y={84 + i * 46} width="124" height="34" rx="4"
            fill="none" stroke="currentColor" strokeOpacity="0.16" strokeWidth="1"
          />
          <rect x="278" y={96 + i * 46} width="46" height="6" rx="3" fill="currentColor" fillOpacity="0.2" />
          <rect x="278" y={106 + i * 46} width="74" height="5" rx="2.5" fill="currentColor" fillOpacity="0.11" />
        </g>
      ))}

      {/* Deployed. The line continues past the frame and terminates in the
          accent, which is the point the whole site is making. */}
      <path
        d="M44 312 H340"
        stroke="currentColor" strokeOpacity="0.18" strokeWidth="1"
        className="hv-draw" pathLength={1} style={{ animationDelay: "1050ms" }}
      />
      <g className="hv-in" style={{ animationDelay: "1250ms" }}>
        <circle cx="340" cy="312" r="4.5" fill="var(--color-accent)" />
        <circle cx="340" cy="312" r="9" fill="none" stroke="var(--color-accent)" strokeOpacity="0.35" strokeWidth="1" />
      </g>
    </svg>
  );
}
