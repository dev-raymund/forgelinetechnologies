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
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a1a33",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="56" height="56" viewBox="0 0 40 40">
            <path
              fillRule="evenodd"
              fill="#ffffff"
              d="M10.5 0 H29.5 A10.5 10.5 0 0 1 40 10.5 V29.5 A10.5 10.5 0 0 1 29.5 40 H10.5 A10.5 10.5 0 0 1 0 29.5 V10.5 A10.5 10.5 0 0 1 10.5 0 Z
                 M12.5 10.5 H28.5 V15.5 H18 V29.5 H12.5 Z
                 M18 18.2 H26.4 V22.8 H18 Z"
            />
          </svg>
          <span style={{ color: "#ffffff", fontSize: 34, fontWeight: 600 }}>
            Forgeline
          </span>
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
              color: "#9fb0c9",
              fontSize: 34,
              marginTop: 20,
              letterSpacing: "-0.01em",
            }}
          >
            Built by the developer you brief.
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 3, background: "#f97316" }} />
          <span style={{ color: "#9fb0c9", fontSize: 24 }}>
            forgelinetechnologies.com
          </span>
        </div>
      </div>
    ),
    size,
  );
}
