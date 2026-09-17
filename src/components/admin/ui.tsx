import Link from "next/link";
import type { Route } from "next";

/**
 * Admin primitives.
 *
 * Hand-rolled rather than a component library: the project ships seven runtime
 * dependencies and these are four small pieces. Adding shadcn/Radix here would
 * cost more than it saves, and the public design tokens already exist.
 */

export function PageTitle({
  title,
  count,
  action,
}: {
  title: string;
  count?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-[1.5rem] font-semibold text-graphite">{title}</h1>
        {count ? (
          <p className="mt-1 font-mono text-micro text-faint">{count}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Card({
  label,
  value,
  href,
  emphasis,
}: {
  label: string;
  value: number;
  href?: Route;
  emphasis?: boolean;
}) {
  const inner = (
    <>
      <span className="block font-mono text-[1.75rem] font-medium tracking-tight text-graphite">
        {value}
      </span>
      <span className="mt-1 block text-[0.875rem] text-muted">{label}</span>
    </>
  );
  const base = `block rounded-sm border bg-white px-4 py-4 ${
    emphasis && value > 0 ? "border-accent" : "border-rule"
  }`;
  return href ? (
    <Link href={href} className={`${base} transition-colors hover:border-rule-strong`}>
      {inner}
    </Link>
  ) : (
    <div className={base}>{inner}</div>
  );
}

const TONES: Record<string, string> = {
  new: "bg-accent/15 text-graphite",
  pending: "bg-accent/15 text-graphite",
  published: "bg-ink text-on-ink",
  approved: "bg-ink/10 text-graphite",
  draft: "bg-black/[0.06] text-muted",
  archived: "bg-black/[0.06] text-muted",
  rejected: "bg-black/[0.06] text-muted",
  qualified: "bg-ink text-on-ink",
  dismissed: "bg-black/[0.06] text-muted",
};

export function Status({ value }: { value: string }) {
  return (
    <span
      className={`inline-block rounded-sm px-2 py-0.5 font-mono text-micro ${
        TONES[value] ?? "bg-black/[0.06] text-muted"
      }`}
    >
      {value}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-dashed border-rule-strong bg-white px-5 py-10 text-center text-[0.9375rem] text-muted">
      {children}
    </div>
  );
}

export function when(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
