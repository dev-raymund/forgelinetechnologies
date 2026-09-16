/**
 * Admin icons.
 *
 * Same construction as the public set in ui/icon.tsx — 16x16, 1.5 stroke,
 * sized in em, aria-hidden — so the two never look like they came from
 * different places. Drawn here rather than pulled from an icon package: a
 * dozen glyphs do not justify a dependency in a project with seven of them,
 * and matching the hairline weight the design is built from matters more than
 * breadth of choice.
 *
 * Every one is decorative. The label beside it carries the meaning, so none of
 * these are ever the only thing identifying a control.
 */
type IconProps = { className?: string };

function Svg({
  className = "",
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`size-[1.05em] shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

/** Dashboard — four panes. */
export function GaugeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </Svg>
  );
}

/** Inquiries — an inbox tray. */
export function InboxIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 9.5 3.8 3.2A1.2 1.2 0 0 1 5 2.3h6a1.2 1.2 0 0 1 1.2.9L14 9.5" />
      <path d="M2 9.5h3l.8 1.6h4.4l.8-1.6h3v3a1.2 1.2 0 0 1-1.2 1.2H3.2A1.2 1.2 0 0 1 2 12.5Z" />
    </Svg>
  );
}

/** Reviews — a star. */
export function StarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 1.9 9.9 5.8l4.3.6-3.1 3 .7 4.2L8 11.7l-3.8 2 .7-4.2-3.1-3 4.3-.6Z" />
    </Svg>
  );
}

/** Blog — a written page. */
export function FileTextIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 1.8H4.2A1.2 1.2 0 0 0 3 3v10a1.2 1.2 0 0 0 1.2 1.2h7.6A1.2 1.2 0 0 0 13 13V5.8Z" />
      <path d="M9 1.8V5.8h4" />
      <path d="M5.6 8.7h4.8M5.6 11.2h3.2" />
    </Svg>
  );
}

/** Works — a portfolio case. */
export function BriefcaseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="1.8" y="4.8" width="12.4" height="8.4" rx="1.2" />
      <path d="M5.6 4.8V3.6a1.2 1.2 0 0 1 1.2-1.2h2.4a1.2 1.2 0 0 1 1.2 1.2v1.2" />
      <path d="M1.8 8.4h12.4" />
    </Svg>
  );
}

/** Users — two people. */
export function UsersIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6" cy="5.2" r="2.4" />
      <path d="M1.8 13.4a4.2 4.2 0 0 1 8.4 0" />
      <path d="M10.6 3.2a2.4 2.4 0 0 1 0 4.6M11.8 13.4a4.2 4.2 0 0 0-1.6-3.3" />
    </Svg>
  );
}

/** Sign out — a door with an arrow leaving it. */
export function SignOutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 2.5H3.8A1.2 1.2 0 0 0 2.6 3.7v8.6a1.2 1.2 0 0 0 1.2 1.2H6" />
      <path d="M10.3 11 13.4 8l-3.1-3" />
      <path d="M13.4 8H6" />
    </Svg>
  );
}

/** Create — a plus. */
export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 3v10M3 8h10" />
    </Svg>
  );
}

/** Back — an arrow to the left. */
export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13.5 8h-11" />
      <path d="M6.5 3.5 2 8l4.5 4.5" />
    </Svg>
  );
}

/** Media — a picture frame with a hill and a sun. */
export function ImageIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="1.8" y="2.8" width="12.4" height="10.4" rx="1.2" />
      <circle cx="5.8" cy="6.4" r="1.1" />
      <path d="M2.4 11.6l3.4-3.2 3 2.6 2-1.8 2.8 2.4" />
    </Svg>
  );
}
