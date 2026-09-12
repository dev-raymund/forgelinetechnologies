/**
 * The four icons the site actually uses.
 *
 * Inlined rather than pulled from an icon package: four glyphs do not justify
 * a dependency, and drawing them here means the stroke weight matches the
 * hairlines the rest of the design is built from.
 *
 * All are 16x16 on a 1.5 stroke, aria-hidden, and sized in `em` so they scale
 * with whatever label they sit beside.
 */
type IconProps = { className?: string };

const base = "size-[1.05em] shrink-0";

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
      className={`${base} ${className}`}
    >
      {children}
    </svg>
  );
}

/** Forward motion — used on the actions that start something. */
export function ArrowRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 8h11" />
      <path d="M9 3.5 13.5 8 9 12.5" />
    </Svg>
  );
}

/** Viewing collected work. */
export function Grid(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.25" y="2.25" width="5" height="5" rx="1" />
      <rect x="8.75" y="2.25" width="5" height="5" rx="1" />
      <rect x="2.25" y="8.75" width="5" height="5" rx="1" />
      <rect x="8.75" y="8.75" width="5" height="5" rx="1" />
    </Svg>
  );
}

export function Mail(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1.5" />
      <path d="m2.5 4.5 5.5 4 5.5-4" />
    </Svg>
  );
}

/** Sending the enquiry. */
export function Send(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 2 7.5 8.5" />
      <path d="M14 2 9.75 14l-2.25-5.5L2 6.25 14 2Z" />
    </Svg>
  );
}

/* ----------------------------------------------------------- service marks

   One per service line. Drawn on the same 16x16 grid and 1.5 stroke as the
   rest, so a row of them reads as one set rather than six borrowed glyphs.
   Each one names the thing the service produces — a window, a dashboard, a
   cart — rather than an abstract shape that could belong to any of them. */

export function Window(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.5" />
      <path d="M1.75 6h12.5" />
      <path d="M4 4.4h.01M6 4.4h.01" />
    </Svg>
  );
}

export function Dashboard(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="1.75" y="1.75" width="5.25" height="7" rx="1" />
      <rect x="9" y="1.75" width="5.25" height="4" rx="1" />
      <rect x="1.75" y="10.75" width="5.25" height="3.5" rx="1" />
      <rect x="9" y="7.75" width="5.25" height="6.5" rx="1" />
    </Svg>
  );
}

export function Cart(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M1.5 2h1.8l1.5 7.5h7L13.5 4.5H4.6" />
      <circle cx="6" cy="13" r="1.1" />
      <circle cx="11.5" cy="13" r="1.1" />
    </Svg>
  );
}

export function Code(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.5 5 2.5 8l3 3" />
      <path d="M10.5 5 13.5 8l-3 3" />
      <path d="M9.25 3.5 6.75 12.5" />
    </Svg>
  );
}

export function Plug(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 8h3.25" />
      <path d="M10.75 8H14" />
      <rect x="5.25" y="4.75" width="5.5" height="6.5" rx="1.75" />
    </Svg>
  );
}

export function Refresh(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13.5 8a5.5 5.5 0 1 1-1.8-4.07" />
      <path d="M13.75 2v3.25H10.5" />
    </Svg>
  );
}
