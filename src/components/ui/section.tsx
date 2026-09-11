import type { ReactNode } from "react";

/**
 * Section shell.
 *
 * `ground` alternates the page between paper, white and ink. `size` is the
 * vertical weight — the brief asks for peaks and valleys rather than a page
 * where everything is enormous, so the scale is explicit and a section has
 * to be given its importance rather than inheriting it.
 */
type Ground = "paper" | "white" | "ink";
type Size = "peak" | "lg" | "md" | "sm";

const grounds: Record<Ground, string> = {
  paper: "bg-paper text-graphite",
  white: "bg-white text-graphite",
  ink: "on-ink bg-ink text-on-ink",
};

const sizes: Record<Size, string> = {
  peak: "py-24 md:py-36",
  lg: "py-20 md:py-28",
  md: "py-16 md:py-24",
  sm: "py-10 md:py-14",
};

export function Section({
  id,
  ground = "paper",
  size = "lg",
  className = "",
  children,
  labelledBy,
}: {
  id?: string;
  ground?: Ground;
  size?: Size;
  className?: string;
  children: ReactNode;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`${grounds[ground]} ${sizes[size]} ${className}`}
    >
      <div className="shell">
        <div className="railed railed-inset">{children}</div>
      </div>
    </section>
  );
}

/**
 * Section heading.
 *
 * The node on the rail is the section marker, which is why there is no
 * tracked-out capitalised eyebrow above the title: the structure already says
 * "a new thing starts here", and saying it twice is noise.
 */
export function SectionHeading({
  id,
  title,
  dek,
  aside,
}: {
  id: string;
  title: string;
  dek?: string;
  /** Optional right-hand counterweight, e.g. a link or a count. */
  aside?: ReactNode;
}) {
  return (
    <div className="relative mb-12 md:mb-16">
      <span className="rail-node hidden md:block" aria-hidden="true" />
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
        <div className="max-w-[34ch]">
          <h2 id={id} className="text-title font-semibold">
            {title}
          </h2>
        </div>
        {dek ? (
          <p className="max-w-[52ch] text-dek text-muted [.on-ink_&]:text-on-ink-muted">
            {dek}
          </p>
        ) : null}
        {aside}
      </div>
    </div>
  );
}
