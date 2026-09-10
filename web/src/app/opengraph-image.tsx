import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Forgeline Technologies — full-stack web development studio";

/**
 * Default social card for every route that does not define its own.
 *
 * Generated at build time rather than committed as a PNG, so the copy can
 * never drift from the site and there is no binary in the repo. Next applies
 * this file to both og:image and twitter:image automatically.
 *
 * Deliberately no next/font call: a Google Fonts fetch here would make the
 * build depend on network access. System faces only.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "70px 76px",
          fontFamily: "Helvetica, Arial, sans-serif",
          position: "relative",
        }}
      >
        {/* brand bar, echoing the site's blue gradient */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 12,
            background: "linear-gradient(90deg, #016ecc 0%, #19d2fe 100%)",
            display: "flex",
          }}
        />

        {/* mark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: 15,
              background: "linear-gradient(135deg, #016ecc 0%, #19d2fe 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 38,
              fontWeight: 700,
            }}
          >
            F
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 27,
                fontWeight: 700,
                color: "#333333",
                letterSpacing: -0.5,
              }}
            >
              Forgeline
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#8a919e",
                letterSpacing: 4,
              }}
            >
              TECHNOLOGIES
            </div>
          </div>
        </div>

        {/* the claim */}
        <div
          style={{
            display: "flex",
            fontSize: 62,
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: -2,
            color: "#333333",
            maxWidth: 960,
          }}
        >
          We build the site that wins you the work.
        </div>

        {/* capability rail */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            borderTop: "1px solid #e3e9f2",
            paddingTop: 26,
            fontSize: 21,
            color: "#6a7180",
          }}
        >
          <span>Web apps</span>
          <span style={{ color: "#c8d2e0" }}>·</span>
          <span>Websites</span>
          <span style={{ color: "#c8d2e0" }}>·</span>
          <span>E-commerce</span>
          <span style={{ color: "#c8d2e0" }}>·</span>
          <span style={{ color: "#016ecc", fontWeight: 700 }}>
            Fixed scope, fixed price
          </span>
        </div>
      </div>
    ),
    size,
  );
}
