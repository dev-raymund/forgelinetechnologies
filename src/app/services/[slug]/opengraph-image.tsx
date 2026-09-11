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
    (
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
          <svg width="52" height="52" viewBox="0 0 40 40">
            <path
              fillRule="evenodd"
              fill="#ffffff"
              d="M10.5 0 H29.5 A10.5 10.5 0 0 1 40 10.5 V29.5 A10.5 10.5 0 0 1 29.5 40 H10.5 A10.5 10.5 0 0 1 0 29.5 V10.5 A10.5 10.5 0 0 1 10.5 0 Z
                 M12.5 10.5 H28.5 V15.5 H18 V29.5 H12.5 Z
                 M18 18.2 H26.4 V22.8 H18 Z"
            />
          </svg>
          <span style={{ color: "#ffffff", fontSize: 31, fontWeight: 600 }}>
            Forgeline
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "#f97316", fontSize: 25, letterSpacing: "0.04em" }}>
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
      </div>
    ),
    size,
  );
}
