import { site } from "@/lib/site";

/**
 * The Forgeline lockup.
 *
 * The source asset sets its wordmark in system fonts and fills the tile with
 * a gradient, so it never quite belonged to any page it sat on. This is the
 * same mark, treated: the tile and the F are one path with an even-odd fill,
 * which knocks the letterform out as a hole. The mark therefore takes the
 * colour of whatever it is placed on via `currentColor`, and the F shows the
 * ground through it — monochrome on paper, monochrome on ink, no variants to
 * keep in sync.
 *
 * The wordmark is live text in Archivo rather than outlines, so the lockup is
 * set in the same face as the rest of the site. The full gradient asset is
 * kept for the favicon, where colour earns its place.
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
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          fill="currentColor"
          d="M10.5 0 H29.5 A10.5 10.5 0 0 1 40 10.5 V29.5 A10.5 10.5 0 0 1 29.5 40 H10.5 A10.5 10.5 0 0 1 0 29.5 V10.5 A10.5 10.5 0 0 1 10.5 0 Z
             M12.5 10.5 H28.5 V15.5 H18 V29.5 H12.5 Z
             M18 18.2 H26.4 V22.8 H18 Z"
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
