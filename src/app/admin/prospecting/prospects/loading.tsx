import {
  SkeletonChips,
  SkeletonFilters,
  SkeletonPage,
  SkeletonPagination,
  SkeletonTable,
} from "@/components/admin/skeleton";

/**
 * Pipeline counts, the search and two selects, then Company, Website,
 * Opportunity, Service, Status, Updated, open.
 */
export default function Loading() {
  return (
    <SkeletonPage action>
      <SkeletonChips count={6} />
      <SkeletonFilters fields={3} />
      <SkeletonTable rows={10} columns={["flex-1", "w-36", "w-32", "w-28", "w-20", "w-24", "w-14"]} />
      <SkeletonPagination />
    </SkeletonPage>
  );
}
