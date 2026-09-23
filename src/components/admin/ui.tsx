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

/**
 * Paging for an admin list.
 *
 * Renders nothing for a single page — a control that cannot do anything is
 * just noise. `href` builds a URL for a page number, so each list keeps its own
 * filters in the query string.
 *
 * Numbered links, not only Previous and Next: on a long list "page 7 of 30" is
 * somewhere you want to jump to, not walk to. The window is narrow so the row
 * does not wrap on a phone, with first and last always reachable.
 */
export function Pagination({
  page,
  pages,
  total,
  label = "results",
  href,
}: {
  page: number;
  pages: number;
  total: number;
  /** Plural noun for the count, e.g. "posts". */
  label?: string;
  href: (page: number) => string;
}) {
  if (pages <= 1) return null;

  const numbers: (number | "gap")[] = [];
  for (let n = 1; n <= pages; n += 1) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) numbers.push(n);
    else if (numbers[numbers.length - 1] !== "gap") numbers.push("gap");
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4"
    >
      <p className="font-mono text-micro text-faint">
        Page {page} of {pages} · {total} {label}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <PageLink href={href(page - 1)} disabled={page === 1} rel="prev">
          Previous
        </PageLink>
        {numbers.map((n, i) =>
          n === "gap" ? (
            <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-faint">
              …
            </span>
          ) : (
            <Link
              key={n}
              href={href(n)}
              aria-label={`Page ${n}`}
              aria-current={n === page ? "page" : undefined}
              className={`min-w-8 rounded-sm px-2.5 py-1.5 text-center font-mono text-[0.8125rem] transition-colors ${
                n === page
                  ? "bg-ink text-on-ink"
                  : "border border-rule bg-white text-muted hover:border-rule-strong hover:text-graphite"
              }`}
            >
              {n}
            </Link>
          ),
        )}
        <PageLink href={href(page + 1)} disabled={page === pages} rel="next">
          Next
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  rel,
  children,
}: {
  href: string;
  disabled: boolean;
  rel: "prev" | "next";
  children: React.ReactNode;
}) {
  const base = "rounded-sm px-3 py-1.5 text-[0.8125rem] font-medium";
  // A disabled control stays in the layout so the row does not shift when you
  // reach an end, but it is a span rather than a link nothing would follow.
  if (disabled) {
    return <span aria-disabled="true" className={`${base} text-faint`}>{children}</span>;
  }
  return (
    <Link href={href} rel={rel} className={`${base} border border-rule bg-white text-muted hover:border-rule-strong hover:text-graphite`}>
      {children}
    </Link>
  );
}
