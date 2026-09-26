import { ImageResponse } from "next/og";
import { services, getService } from "@/data/services";
import { site } from "@/lib/site";

export const alt = "Forgeline Technologies service";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Per-service sharing card.
 *
 * Service pages are the ones most likely to be pasted into an email or a
 * message, so each gets a card naming the service rather than the generic
 * site image. Without this segment's own file, a page that sets `openGraph`
 * in generateMetadata inherits no image at all.
 */
export function generateImageMetadata() {
  return [{ id: "card", size, contentType, alt }];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getService(slug) ?? services[0];

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
        <svg width="58" height="42" viewBox="0 0 100 71.88">
          {/* Reversed for the navy ground, as on the default card. */}
          <path fill="#ffffff" d="M25.71 0.07L99.93 0L100 0.36L90.7 13.64L32.6 13.64L23.44 33.17L10.16 59.8L2.13 48.08L0 44.53L19.32 4.05L20.17 2.77L22.09 1.14L24.08 0.28Z" />
          <path fill="#fd6900" d="M47.44 18.96L88.21 19.11L79.05 31.53L65.13 31.53L64.91 31.75L48.01 65.41L46.09 68.75L45.1 69.18L28.48 71.88L48.86 31.75L48.79 31.53L30.11 31.46L36.29 19.03Z" />
        </svg>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ color: "#ffffff", fontSize: 31, fontWeight: 700 }}>
            FORGE
          </span>
          <span style={{ color: "#fd6900", fontSize: 31, fontWeight: 700 }}>
            LINE
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{ color: "#f97316", fontSize: 25, letterSpacing: "0.04em" }}
        >
          Service {service.number}
        </span>
        <span
          style={{
            color: "#ffffff",
            fontSize: 62,
            fontWeight: 700,
            lineHeight: 1.06,
            letterSpacing: "-0.03em",
            marginTop: 18,
            maxWidth: 980,
          }}
        >
          {service.title}
        </span>
        <span
          style={{
            color: "#9aabc4",
            fontSize: 28,
            lineHeight: 1.35,
            marginTop: 20,
            maxWidth: 900,
          }}
        >
          {service.summary}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 64, height: 3, background: "#f97316" }} />
        <span style={{ color: "#9aabc4", fontSize: 22 }}>
          {site.url.replace("https://", "")}
        </span>
      </div>
    </div>,
    size,
  );
}
