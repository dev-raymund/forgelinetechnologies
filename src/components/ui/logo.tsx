import { site } from "@/lib/site";

/**
 * The Forgeline lockup.
 *
 * Drawn to match /assets/forgeline-logo.svg exactly: a white rounded tile with
 * a hairline stroke, the F in brand navy, and the crossbar in brand orange.
 *
 * An earlier version knocked the F out of a single-colour tile so the mark
 * took `currentColor`. That was a neat trick and the wrong one — it threw away
 * the two colours the brand is actually built from. The tile stays white on
 * both grounds because it is a badge; that is how the asset is drawn, and it
 * reads correctly on navy as well as on paper.
 *
 * The wordmark is live text in Archivo and inherits `currentColor`, so the
 * lockup is set in the same face as the rest of the site and adapts to
 * whatever it sits on.
 */
export function Logo({
  showWordmark = true,
  className = "",
}: {
  showWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 40 40"
        width="26"
        height="26"
        aria-hidden="true"
        focusable="false"
        className="shrink-0"
      >
        <rect
          x="0.5"
          y="0.5"
          width="39"
          height="39"
          rx="10.5"
          fill="#ffffff"
          stroke="var(--color-rule)"
          strokeWidth="1"
        />
        <path
          d="M12.5 10.5 H28.5 V15.5 H18 V29.5 H12.5 Z"
          fill="var(--color-brand-navy)"
        />
        <rect
          x="18"
          y="18.2"
          width="8.4"
          height="4.6"
          rx="0.6"
          fill="var(--color-accent)"
        />
      </svg>
      {showWordmark ? (
        <span className="text-[1.0625rem] font-semibold tracking-[-0.03em]">
          {site.shortName}
        </span>
      ) : null}
      <span className="sr-only">{showWordmark ? "Technologies" : site.name}</span>
    </span>
  );
}
