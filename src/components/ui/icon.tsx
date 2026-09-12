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

function Svg({ className = "", children }: IconProps & { children: React.ReactNode }) {
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
