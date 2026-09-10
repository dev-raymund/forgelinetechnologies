import Link from "next/link";

type Variant = "primary" | "ghost" | "ghost-dark";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-sans font-medium transition-colors duration-200 " +
  "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-brand-500 rounded-[3px]";

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  ghost: "border border-line-strong text-ink-900 hover:border-ink-900",
  "ghost-dark": "border border-white/25 text-white hover:border-white/70 hover:bg-white/5",
};

const sizes: Record<Size, string> = {
  md: "h-10 px-5 text-[0.9rem]",
  lg: "h-12 px-7 text-[0.95rem]",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  const external = href.startsWith("http");
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export const buttonClass = (variant: Variant = "primary", size: Size = "md") =>
  `${base} ${variants[variant]} ${sizes[size]}`;
