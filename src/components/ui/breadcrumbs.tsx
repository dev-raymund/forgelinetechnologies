import Link from "next/link";

/**
 * Visible breadcrumb trail for nested routes.
 *
 * Paired with BreadcrumbList structured data on the same pages — the visible
 * trail and the schema are built from the same array, so they cannot drift.
 *
 * The current page is the last crumb and is not a link: linking to the page
 * someone is already on is a dead control.
 */
export function Breadcrumbs({
  trail,
}: {
  trail: { name: string; path: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-7">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-2">
              {last ? (
                <span
                  aria-current="page"
                  className="font-mono text-micro text-on-ink-muted"
                >
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link
                    href={crumb.path}
                    className="font-mono text-micro text-on-ink-muted underline decoration-rule-ink-strong underline-offset-4 transition-colors hover:text-white hover:decoration-accent"
                  >
                    {crumb.name}
                  </Link>
                  <span aria-hidden="true" className="text-on-ink-muted">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
