import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default sharing image.
 *
 * Generated rather than shipped as a file so it stays in step with the site's
 * palette and wording. It deliberately uses the runtime's own sans rather than
 * fetching Archivo at build time: a network call during a build is a fragile
 * dependency, and the brand is carried here by the ink ground, the mark and the
 * layout, none of which need the typeface to read correctly.
 */
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0d2350",
        padding: "72px 80px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <svg width="62" height="45" viewBox="0 0 100 71.88">
          {/* Reversed: the card's ground is the same navy as the header, so
              the mark's blue takes the white treatment here too. */}
          <path fill="#ffffff" d="M25.71 0.07L99.93 0L100 0.36L90.7 13.64L32.6 13.64L23.44 33.17L10.16 59.8L2.13 48.08L0 44.53L19.32 4.05L20.17 2.77L22.09 1.14L24.08 0.28Z" />
          <path fill="#fd6900" d="M47.44 18.96L88.21 19.11L79.05 31.53L65.13 31.53L64.91 31.75L48.01 65.41L46.09 68.75L45.1 69.18L28.48 71.88L48.86 31.75L48.79 31.53L30.11 31.46L36.29 19.03Z" />
        </svg>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ color: "#ffffff", fontSize: 34, fontWeight: 700 }}>
            FORGE
          </span>
          <span style={{ color: "#fd6900", fontSize: 34, fontWeight: 700 }}>
            LINE
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            color: "#ffffff",
            fontSize: 66,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            maxWidth: 960,
          }}
        >
          Websites, web applications and custom software.
        </span>
        <span
          style={{
            color: "#9aabc4",
            fontSize: 34,
            marginTop: 20,
            letterSpacing: "-0.01em",
          }}
        >
          Built by the people you brief.
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 64, height: 3, background: "#f97316" }} />
        <span style={{ color: "#9aabc4", fontSize: 24 }}>
          forgelinetechnologies.com
        </span>
      </div>
    </div>,
    size,
  );
}
