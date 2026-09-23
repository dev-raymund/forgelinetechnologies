/**
 * Admin list paging.
 *
 * One page size and one result shape for every admin table, so a list page
 * reads the same wherever you land. Enquiry triage had this first; the rest of
 * the admin was returning whole tables and would have kept growing until a page
 * took seconds to render.
 *
 * Deliberately not `server-only`, and deliberately import-free: it is
 * arithmetic over numbers with nothing secret in it, and `prospect-store.ts`
 * is reached by the plain-Node test runner. `retry.ts` is split out for the
 * same reason.
 */

export const PAGE_SIZE = 25;

export type Paged<T> = {
  rows: T[];
  /** Matching rows, not rows on this page. */
  total: number;
  page: number;
  pages: number;
  pageSize: number;
};

/**
 * A page number from a query string.
 *
 * Anything unusable becomes 1 rather than an error: a hand-edited `?page=abc`
 * should show the first page, not a stack trace.
 */
export function pageFrom(raw: string | undefined): number {
  const n = Number(raw ?? "1");
  return Number.isSafeInteger(n) && n > 0 ? n : 1;
}

/** Rows to skip for a page. */
export function offsetFor(page: number, pageSize: number = PAGE_SIZE): number {
  return (Math.max(1, page) - 1) * pageSize;
}

/**
 * Wraps a page of rows with its totals.
 *
 * `pages` is at least 1 so an empty table still reads "Page 1 of 1" rather
 * than "Page 1 of 0".
 */
export function paged<T>(
  rows: T[],
  total: number,
  page: number,
  pageSize: number = PAGE_SIZE,
): Paged<T> {
  return {
    rows,
    total,
    page: Math.max(1, page),
    pages: Math.max(1, Math.ceil(total / pageSize)),
    pageSize,
  };
}
