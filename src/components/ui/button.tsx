import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * Two button weights, and deliberately no third.
 *
 * `solid` is the one action a section wants; `outline` is the alternative
 * that must stay available without competing. A page that offers three equal
 * buttons has not decided what it wants the visitor to do.
 *
 * No arrow glyph is appended to the label. The label says what happens.
 */
type Variant = "solid" | "outline";
type Ground = "paper" | "ink";

const base =
  "inline-flex items-center justify-center rounded-sm px-5 py-3 text-[0.9375rem] font-medium " +
  "transition-colors duration-200 ease-out";

const styles: Record<Ground, Record<Variant, string>> = {
  paper: {
    solid: "bg-accent-deep text-white hover:bg-accent-deeper",
    outline:
      "border border-rule-strong text-graphite hover:border-graphite hover:bg-white",
  },
  ink: {
    solid: "bg-white text-ink hover:bg-accent-deep hover:text-white",
    outline:
      "border border-rule-ink-strong text-on-ink hover:border-white hover:bg-white/5",
  },
};

export function ButtonLink({
  variant = "solid",
  ground = "paper",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; ground?: Ground }) {
  return (
    <Link
      {...props}
      className={`${base} ${styles[ground][variant]} ${className}`}
    />
  );
}
