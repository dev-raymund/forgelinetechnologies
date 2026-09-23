import {
  SkeletonChips,
  SkeletonFilters,
  SkeletonPage,
  SkeletonPagination,
  SkeletonTable,
} from "@/components/admin/skeleton";

/** Search, status chips, then Name, Company, Project, Status, Received, open. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonFilters fields={1} />
      <SkeletonChips count={5} />
      <SkeletonTable rows={10} columns={["flex-1", "w-32", "w-28", "w-20", "w-24", "w-14"]} />
      <SkeletonPagination />
    </SkeletonPage>
  );
}
