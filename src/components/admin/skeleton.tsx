/**
 * Loading placeholders.
 *
 * Shaped like the content they stand in for — a table looks like a table, a
 * card grid like a card grid — so the layout does not jump when the real thing
 * arrives. A generic spinner would be less work and worse: it tells you
 * something is happening but not what is about to appear.
 *
 * The pulse is disabled under prefers-reduced-motion by the global rule in
 * globals.css, which zeroes animation duration and delay.
 */
export function Bar({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-sm bg-black/[0.07] ${className}`}
    />
  );
}

export function SkeletonPage({
  title = true,
  children,
}: {
  title?: boolean;
  children?: React.ReactNode;
}) {
  return (
    // Announced once, politely, rather than on every placeholder element.
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading…</span>
      {title ? (
        <div className="mb-7">
          <Bar className="h-7 w-56" />
          <Bar className="mt-2 h-3 w-32" />
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-sm border border-rule bg-white">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-rule px-4 py-3.5 last:border-b-0">
          <Bar className="h-4 flex-1" />
          <Bar className="h-4 w-28" />
          <Bar className="h-4 w-16" />
          <Bar className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-sm border border-rule bg-white px-4 py-4">
          <Bar className="h-7 w-12" />
          <Bar className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}
