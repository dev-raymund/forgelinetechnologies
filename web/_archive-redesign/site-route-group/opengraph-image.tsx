import { ImageResponse } from "next/og";
import { site } from "@/lib/content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.name} — ${site.tagline}`;

/* Generated at build time so there's no binary OG asset to keep in sync with
   the copy. Uses system fonts only — no font fetch to fail the build. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#05080f",
          padding: "72px",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "linear-gradient(135deg,#0b63ce,#1a7ae8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            F
          </div>
          <div style={{ color: "#fff", fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>
            Forgeline Technologies
          </div>
        </div>

        <div
          style={{
            display: "flex",
            color: "#fff",
            fontSize: 66,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: -2.2,
            maxWidth: 940,
          }}
        >
          The developer you brief is the developer who builds it.
        </div>

        <div
          style={{
            display: "flex",
            gap: 28,
            color: "#78819a",
            fontSize: 22,
            borderTop: "1px solid rgba(255,255,255,0.14)",
            paddingTop: 26,
          }}
        >
          <span>Web apps</span>
          <span>·</span>
          <span>Websites</span>
          <span>·</span>
          <span>E-commerce</span>
          <span>·</span>
          <span>Fixed scope, fixed price</span>
        </div>
      </div>
    ),
    size,
  );
}
