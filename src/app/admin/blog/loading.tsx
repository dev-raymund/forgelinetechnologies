import { SkeletonPage, SkeletonPagination, SkeletonTable } from "@/components/admin/skeleton";

/** Columns: Title, Status, Author, Published, Updated, open. */
export default function Loading() {
  return (
    <SkeletonPage action>
      <SkeletonTable rows={10} columns={["flex-1", "w-20", "w-28", "w-24", "w-24", "w-14"]} />
      <SkeletonPagination />
    </SkeletonPage>
  );
}
