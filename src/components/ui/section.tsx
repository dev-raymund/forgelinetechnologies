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
  eyebrow,
  title,
  dek,
  aside,
}: {
  id: string;
  /**
   * Short label above the heading — the same device the page headers already
   * use for `meta`. It exists so a heading can be plain ("How we work") while
   * the label still carries the named thing ("The Forgeline Build Method"),
   * instead of the heading having to do both jobs at once.
   */
  eyebrow?: string;
  title: string;
  dek?: string;
  /** Optional right-hand counterweight, e.g. a link or a count. */
  aside?: ReactNode;
}) {
  // A grid, not a flex row. Under flex the title column collapsed toward its
  // longest word whenever the dek competed for space, so a longer heading
  // broke into a stack of short lines. Explicit column spans give the title a
  // predictable measure regardless of how long either string is.
  const hasAside = Boolean(aside);

  return (
    <div className="relative mb-12 md:mb-16">
      <span className="rail-node hidden md:block" aria-hidden="true" />
      <div className="grid gap-6 md:grid-cols-12 md:items-end md:gap-10">
        <div className={hasAside ? "md:col-span-5" : "md:col-span-6"}>
          {eyebrow ? (
            // Never `text-accent` on a light ground: orange on paper measures
            // 2.80:1. On ink it is 5.42:1, so the accent is safe only there.
            <p className="mb-4 font-mono text-micro text-faint [.on-ink_&]:text-accent">
              {eyebrow}
            </p>
          ) : null}
          <h2 id={id} className="text-title font-semibold">
            {title}
          </h2>
        </div>
        {dek ? (
          <p
            className={`max-w-[52ch] text-dek text-muted [.on-ink_&]:text-on-ink-muted ${
              hasAside
                ? "md:col-span-4 md:col-start-6"
                : "md:col-span-5 md:col-start-8"
            }`}
          >
            {dek}
          </p>
        ) : null}
        {aside ? (
          <div className="md:col-span-2 md:col-start-11 md:justify-self-end">
            {aside}
          </div>
        ) : null}
      </div>
    </div>
  );
}
