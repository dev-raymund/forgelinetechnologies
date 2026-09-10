/**
 * Animated line icons.
 *
 * Motion lives in econtent.css (the `ec-ico-*` classes) so it can be killed
 * wholesale by the prefers-reduced-motion block at the bottom of that file.
 * Idle animations are slow and small; the sharper movement is on card hover.
 */

export type IconName = "build" | "automate" | "saas" | "care";

const common = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "ec-ico",
  "aria-hidden": true,
};

export default function EcIcon({ name }: { name: IconName }) {
  if (name === "build") {
    return (
      <svg {...common}>
        <path className="ec-ico-bracket-l" d="M8.5 7.5 4 12l4.5 4.5" />
        <path className="ec-ico-bracket-r" d="M15.5 7.5 20 12l-4.5 4.5" />
        <path className="ec-ico-slash" d="M13.4 5.5 10.6 18.5" />
      </svg>
    );
  }

  if (name === "automate") {
    return (
      <svg {...common}>
        <g className="ec-ico-gear">
          <circle cx="12" cy="12" r="3.1" />
          <path d="M12 2.6v2.6M12 18.8v2.6M21.4 12h-2.6M5.2 12H2.6M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8M18.6 18.6l-1.8-1.8M7.2 7.2 5.4 5.4" />
        </g>
      </svg>
    );
  }

  if (name === "saas") {
    return (
      <svg {...common}>
        <path className="ec-ico-layer-top" d="M12 3.2 21 8l-9 4.8L3 8z" />
        <path className="ec-ico-layer-mid" d="M3 12.4 12 17.2 21 12.4" />
        <path className="ec-ico-layer-btm" d="M3 16.6 12 21.4 21 16.6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M12 2.8 4.6 6v6c0 4.4 3.1 7.9 7.4 9.2 4.3-1.3 7.4-4.8 7.4-9.2V6z" />
      <path className="ec-ico-check" d="m8.6 12.2 2.5 2.5 4.3-4.9" />
      <circle className="ec-ico-ring" cx="12" cy="12" r="9.4" />
    </svg>
  );
}
