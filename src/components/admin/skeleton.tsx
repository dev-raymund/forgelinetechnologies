/**
 * Loading placeholders.
 *
 * Shaped like the content they stand in for, closely enough that the page does
 * not move when the real thing arrives. That is the whole job: a placeholder
 * whose columns, header row, filters and buttons sit somewhere else is worse
 * than a spinner, because it promises a layout and then breaks it.
 *
 * So `SkeletonTable` takes the real column widths, `SkeletonPage` knows whether
 * the page has an action button, and each route's `loading.tsx` describes that
 * route rather than reaching for a generic table.
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

/**
 * The page shell: title, subtitle, and the action button most list pages put
 * on the right.
 */
export function SkeletonPage({
  title = true,
  action = false,
  children,
}: {
  title?: boolean;
  action?: boolean;
  children?: React.ReactNode;
}) {
  return (
    // Announced once, politely, rather than on every placeholder element.
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading…</span>
      {title ? (
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Bar className="h-7 w-56" />
            <Bar className="mt-2 h-3 w-40" />
          </div>
          {action ? <Bar className="h-9 w-32" /> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/** The search-and-select row above several lists. */
export function SkeletonFilters({ fields = 3 }: { fields?: number }) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Bar className="h-3 w-16" />
          <Bar className="mt-1.5 h-9 w-40" />
        </div>
      ))}
      <Bar className="h-9 w-20" />
    </div>
  );
}

/** The status chips some lists show under the title. */
export function SkeletonChips({ count = 5 }: { count?: number }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Bar key={i} className="h-8 w-28" />
      ))}
    </div>
  );
}

/**
 * A table, including its header row.
 *
 * `columns` are Tailwind width classes in the real table's proportions, so the
 * placeholder rows line up with the columns that replace them. The default is a
 * plain five-column list.
 */
export function SkeletonTable({
  rows = 8,
  columns = ["flex-1", "w-32", "w-24", "w-24", "w-20"],
}: {
  rows?: number;
  columns?: string[];
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-rule bg-white">
      <div className="flex items-center gap-4 border-b border-rule px-4 py-2.5">
        {columns.map((width, i) => (
          <Bar key={i} className={`h-2.5 ${width} max-w-24 bg-black/[0.05]`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="flex items-center gap-4 border-b border-rule px-4 py-3.5 last:border-b-0"
        >
          {columns.map((width, i) => (
            <Bar key={i} className={`h-4 ${width}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** The paging row under a table. */
export function SkeletonPagination() {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
      <Bar className="h-3 w-40" />
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bar key={i} className="h-8 w-9" />
        ))}
      </div>
    </div>
  );
}

/** The dashboard's stat grid. */
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

/** One bordered panel with a heading and a few lines, as the detail pages use. */
export function SkeletonPanel({
  lines = 3,
  heading = true,
  className = "",
}: {
  lines?: number;
  heading?: boolean;
  className?: string;
}) {
  return (
    <section className={`rounded-sm border border-rule bg-white p-5 ${className}`}>
      {heading ? <Bar className="h-5 w-40" /> : null}
      {Array.from({ length: lines }).map((_, i) => (
        <Bar key={i} className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"} ${heading || i ? "mt-3" : ""}`} />
      ))}
    </section>
  );
}

/** A two-column grid of label/value pairs, as the detail panels use. */
export function SkeletonFacts({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Bar className="h-2.5 w-20 bg-black/[0.05]" />
          <Bar className="mt-1.5 h-4 w-36" />
        </div>
      ))}
    </div>
  );
}

/** An editor: a few labelled fields and a save button. */
export function SkeletonForm({ fields = 5 }: { fields?: number }) {
  return (
    <div className="max-w-[48rem] rounded-sm border border-rule bg-white p-5 md:p-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className={i ? "mt-5" : ""}>
          <Bar className="h-3 w-24" />
          <Bar className={`mt-1.5 ${i === fields - 1 ? "h-40" : "h-10"} w-full`} />
        </div>
      ))}
      <Bar className="mt-6 h-10 w-32" />
    </div>
  );
}

/** The media library's thumbnail grid. */
export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-sm border border-rule bg-white">
          <Bar className="aspect-[4/3] w-full rounded-none" />
          <div className="p-3">
            <Bar className="h-3 w-3/4" />
            <Bar className="mt-2 h-2.5 w-1/2 bg-black/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  );
}
