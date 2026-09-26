import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon.
 *
 * On a white ground rather than the site's navy, because that is the ground
 * the artwork is drawn on and the mark's blue needs it. iOS also composites
 * any transparency onto black, so a solid background is not optional here —
 * the transparent mark used for the browser favicon would come back with a
 * black square around it.
 */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
      }}
    >
      <svg width="124" height="89" viewBox="0 0 100 71.88">
        <path fill="#0055c6" d="M25.71 0.07L99.93 0L100 0.36L90.7 13.64L32.6 13.64L23.44 33.17L10.16 59.8L2.13 48.08L0 44.53L19.32 4.05L20.17 2.77L22.09 1.14L24.08 0.28Z" />
        <path fill="#fd6900" d="M47.44 18.96L88.21 19.11L79.05 31.53L65.13 31.53L64.91 31.75L48.01 65.41L46.09 68.75L45.1 69.18L28.48 71.88L48.86 31.75L48.79 31.53L30.11 31.46L36.29 19.03Z" />
      </svg>
    </div>,
    size,
  );
}
