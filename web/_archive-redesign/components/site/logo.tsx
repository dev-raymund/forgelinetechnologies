/**
 * Forgeline mark, rebuilt to live inside the design system rather than sit on
 * top of it.
 *
 * The original asset is a blue gradient tile — a filled, saturated block that
 * fights a monochrome editorial interface. The glyph geometry is kept (it is
 * the recognisable part) but drawn in currentColor inside a hairline frame, so
 * the logo inherits whatever surface it lands on: white on the dark hero, ink
 * on the paper nav, no variant swapping.
 *
 * Sizes are set on the 4px grid the rest of the interface uses.
 */
export default function Logo({
  className = "",
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7 shrink-0"
        role="img"
        aria-label="Forgeline Technologies"
        fill="none"
      >
        {/* hairline frame — the grid motif at brand scale */}
        <rect
          x="0.5"
          y="0.5"
          width="31"
          height="31"
          rx="2.5"
          stroke="currentColor"
          strokeOpacity="0.32"
        />
        {/* F stem + arm, from the original mark */}
        <path
          d="M9.75 8.5H22.25V12.15H14.4V23.5H9.75V8.5Z"
          fill="currentColor"
        />
        {/* the crossbar, held at lower opacity so the F reads first */}
        <rect
          x="14.4"
          y="14.9"
          width="6.4"
          height="3.5"
          rx="0.4"
          fill="currentColor"
          fillOpacity="0.45"
        />
      </svg>

      {showWordmark && (
        <span className="font-display text-[1.02rem] font-semibold leading-none tracking-[-0.032em]">
          Forgeline
        </span>
      )}
    </span>
  );
}
