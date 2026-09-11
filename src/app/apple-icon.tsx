import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon. The previous site shipped none, so a saved-to-homescreen
 * bookmark fell back to a screenshot of the page.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a121a",
        }}
      >
        <svg width="116" height="116" viewBox="0 0 32 32">
          <path d="M9.75 8.5H22.25V12.15H14.4V23.5H9.75V8.5Z" fill="#ffffff" />
          <rect x="14.4" y="14.9" width="6.4" height="3.5" rx="0.4" fill="#55a0f2" />
        </svg>
      </div>
    ),
    size,
  );
}
