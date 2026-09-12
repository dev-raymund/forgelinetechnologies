/**
 * Hero schematics for the inner pages.
 *
 * One language, six drawings. Each uses the same engineering grid, hairlines
 * and single orange accent as the homepage visual, and the same two animation
 * primitives (.hv-draw outlines a shape, .hv-in lands a solid), so nothing new
 * is invented per page and reduced motion is already handled globally.
 *
 * They are not decoration: each says something true about the page it opens.
 * Repeating the homepage's browser frame on the pricing page would have been
 * faster and would have read as filler.
 *
 * All are aria-hidden — every one of these pages states its subject in an h1
 * directly beside the drawing.
 */
type Variant =
  "work" | "services" | "pricing" | "process" | "about" | "contact";

const grid = (id: string) => (
  <defs>
    <pattern id={id} width="20" height="20" patternUnits="userSpaceOnUse">
      <path
        d="M20 0H0V20"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.06"
        strokeWidth="1"
      />
    </pattern>
  </defs>
);

const line = "currentColor";
const accent = "var(--color-accent)";

export function PageVisual({ variant }: { variant: Variant }) {
  const id = `pv-${variant}`;
  return (
    <svg
      viewBox="0 0 420 290"
      className="h-auto w-full"
      aria-hidden="true"
      focusable="false"
    >
      {grid(id)}
      <rect x="0" y="0" width="420" height="290" fill={`url(#${id})`} />
      {render(variant)}
    </svg>
  );
}

function render(v: Variant) {
  switch (v) {
    /* Seventeen builds, shown as a contact sheet rather than one hero image. */
    case "work":
      return (
        <>
          {[0, 1, 2, 3].map((i) => {
            const x = 30 + (i % 2) * 190;
            const y = 40 + Math.floor(i / 2) * 110;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width="170"
                  height="92"
                  rx="5"
                  fill="none"
                  stroke={line}
                  strokeOpacity="0.22"
                  strokeWidth="1"
                  className="hv-draw"
                  pathLength={1}
                  style={{ animationDelay: `${160 + i * 110}ms` }}
                />
                <rect
                  x={x + 12}
                  y={y + 14}
                  width="146"
                  height="44"
                  rx="3"
                  fill={line}
                  fillOpacity="0.07"
                  className="hv-in"
                  style={{ animationDelay: `${420 + i * 110}ms` }}
                />
                <rect
                  x={x + 12}
                  y={y + 68}
                  width={i === 0 ? 54 : 86}
                  height="6"
                  rx="3"
                  fill={i === 0 ? accent : line}
                  fillOpacity={i === 0 ? 1 : 0.18}
                  className="hv-in"
                  style={{ animationDelay: `${520 + i * 110}ms` }}
                />
              </g>
            );
          })}
        </>
      );

    /* Eight service lines, one of them lit. */
    case "services":
      return (
        <>
          {[0, 1, 2, 3, 4].map((i) => {
            const y = 40 + i * 44;
            const on = i === 2;
            return (
              <g key={i}>
                <rect
                  x="34"
                  y={y}
                  width="352"
                  height="32"
                  rx="4"
                  fill="none"
                  stroke={on ? accent : line}
                  strokeOpacity={on ? 0.9 : 0.2}
                  strokeWidth="1"
                  className="hv-draw"
                  pathLength={1}
                  style={{ animationDelay: `${150 + i * 90}ms` }}
                />
                <rect
                  x="48"
                  y={y + 13}
                  width="12"
                  height="6"
                  rx="3"
                  fill={on ? accent : line}
                  fillOpacity={on ? 1 : 0.35}
                  className="hv-in"
                  style={{ animationDelay: `${420 + i * 90}ms` }}
                />
                <rect
                  x="72"
                  y={y + 13}
                  width={130 - i * 14}
                  height="6"
                  rx="3"
                  fill={line}
                  fillOpacity="0.2"
                  className="hv-in"
                  style={{ animationDelay: `${470 + i * 90}ms` }}
                />
              </g>
            );
          })}
        </>
      );

    /* A quote: line items, a rule, and a figure that does not move afterwards. */
    case "pricing":
      return (
        <>
          <rect
            x="60"
            y="26"
            width="300"
            height="230"
            rx="6"
            fill="none"
            stroke={line}
            strokeOpacity="0.22"
            strokeWidth="1"
            className="hv-draw"
            pathLength={1}
            style={{ animationDelay: "150ms" }}
          />
          <path
            d="M60 66 H360"
            stroke={line}
            strokeOpacity="0.16"
            strokeWidth="1"
            className="hv-draw"
            pathLength={1}
            style={{ animationDelay: "420ms" }}
          />
          <rect
            x="80"
            y="41"
            width="92"
            height="8"
            rx="4"
            fill={line}
            fillOpacity="0.22"
            className="hv-in"
            style={{ animationDelay: "520ms" }}
          />
          {[0, 1, 2].map((i) => (
            <g
              key={i}
              className="hv-in"
              style={{ animationDelay: `${600 + i * 80}ms` }}
            >
              <rect
                x="80"
                y={90 + i * 34}
                width={126 - i * 22}
                height="7"
                rx="3.5"
                fill={line}
                fillOpacity="0.16"
              />
              <rect
                x="286"
                y={90 + i * 34}
                width="54"
                height="7"
                rx="3.5"
                fill={line}
                fillOpacity="0.24"
              />
            </g>
          ))}
          <path
            d="M80 196 H340"
            stroke={line}
            strokeOpacity="0.22"
            strokeWidth="1"
            className="hv-draw"
            pathLength={1}
            style={{ animationDelay: "880ms" }}
          />
          <rect
            x="80"
            y="214"
            width="74"
            height="10"
            rx="5"
            fill={line}
            fillOpacity="0.26"
            className="hv-in"
            style={{ animationDelay: "960ms" }}
          />
          <rect
            x="258"
            y="208"
            width="82"
            height="24"
            rx="4"
            fill={accent}
            className="hv-in"
            style={{ animationDelay: "1040ms" }}
          />
        </>
      );

    /* Four steps on one line, ending in the accent. No black box. */
    case "process":
      return (
        <>
          <path
            d="M40 145 H380"
            stroke={line}
            strokeOpacity="0.2"
            strokeWidth="1"
            className="hv-draw"
            pathLength={1}
            style={{ animationDelay: "150ms" }}
          />
          {[0, 1, 2, 3].map((i) => {
            const x = 62 + i * 100;
            const last = i === 3;
            return (
              <g
                key={i}
                className="hv-in"
                style={{ animationDelay: `${480 + i * 140}ms` }}
              >
                <circle
                  cx={x}
                  cy="145"
                  r={last ? 7 : 5}
                  fill={last ? accent : line}
                  fillOpacity={last ? 1 : 0.4}
                />
                {last ? (
                  <circle
                    cx={x}
                    cy="145"
                    r="13"
                    fill="none"
                    stroke={accent}
                    strokeOpacity="0.35"
                    strokeWidth="1"
                  />
                ) : null}
                <rect
                  x={x - 22}
                  y="100"
                  width="44"
                  height="7"
                  rx="3.5"
                  fill={line}
                  fillOpacity="0.22"
                />
                <rect
                  x={x - 22}
                  y="176"
                  width={34 - i * 4}
                  height="6"
                  rx="3"
                  fill={line}
                  fillOpacity="0.14"
                />
              </g>
            );
          })}
        </>
      );

    /* The layer collapse: the studio's whole argument, in two columns. */
    case "about":
      return (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <g
              key={i}
              className="hv-in"
              style={{ animationDelay: `${180 + i * 70}ms` }}
            >
              <circle
                cx="90"
                cy={52 + i * 46}
                r="4"
                fill={line}
                fillOpacity="0.3"
              />
              <rect
                x="106"
                y={48 + i * 46}
                width={96 - i * 8}
                height="7"
                rx="3.5"
                fill={line}
                fillOpacity="0.16"
              />
              {i < 4 ? (
                <path
                  d="M90 58 V88"
                  transform={`translate(0 ${i * 46})`}
                  stroke={line}
                  strokeOpacity="0.16"
                  strokeWidth="1"
                />
              ) : null}
            </g>
          ))}
          {[0, 1].map((i) => (
            <g
              key={i}
              className="hv-in"
              style={{ animationDelay: `${620 + i * 130}ms` }}
            >
              <circle cx="272" cy={52 + i * 92} r="5" fill={accent} />
              <rect
                x="290"
                y={48 + i * 92}
                width={104 - i * 16}
                height="7"
                rx="3.5"
                fill={accent}
                fillOpacity="0.5"
              />
              {i < 1 ? (
                <path
                  d="M272 59 V136"
                  stroke={accent}
                  strokeOpacity="0.4"
                  strokeWidth="1"
                />
              ) : null}
            </g>
          ))}
        </>
      );

    /* A brief going one place: to the person who builds it. */
    case "contact":
      return (
        <>
          <rect
            x="46"
            y="42"
            width="212"
            height="188"
            rx="6"
            fill="none"
            stroke={line}
            strokeOpacity="0.22"
            strokeWidth="1"
            className="hv-draw"
            pathLength={1}
            style={{ animationDelay: "150ms" }}
          />
          {[0, 1, 2].map((i) => (
            <g
              key={i}
              className="hv-in"
              style={{ animationDelay: `${430 + i * 90}ms` }}
            >
              <rect
                x="66"
                y={64 + i * 46}
                width={52 - i * 6}
                height="6"
                rx="3"
                fill={line}
                fillOpacity="0.2"
              />
              <rect
                x="66"
                y={76 + i * 46}
                width="172"
                height="26"
                rx="4"
                fill="none"
                stroke={line}
                strokeOpacity="0.16"
                strokeWidth="1"
              />
            </g>
          ))}
          <rect
            x="66"
            y="196"
            width="92"
            height="24"
            rx="4"
            fill={accent}
            className="hv-in"
            style={{ animationDelay: "760ms" }}
          />
          <path
            d="M258 208 C306 208 316 150 348 150"
            fill="none"
            stroke={accent}
            strokeOpacity="0.45"
            strokeWidth="1"
            strokeDasharray="3 4"
            className="hv-draw"
            pathLength={1}
            style={{ animationDelay: "880ms" }}
          />
          <g className="hv-in" style={{ animationDelay: "1160ms" }}>
            <circle cx="356" cy="150" r="6" fill={accent} />
            <circle
              cx="356"
              cy="150"
              r="13"
              fill="none"
              stroke={accent}
              strokeOpacity="0.35"
              strokeWidth="1"
            />
          </g>
        </>
      );
  }
}
