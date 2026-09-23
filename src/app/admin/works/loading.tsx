import { SkeletonPage, SkeletonPagination, SkeletonTable } from "@/components/admin/skeleton";

/** Columns: Project, Category, Status, Featured, Live site, Updated, open. */
export default function Loading() {
  return (
    <SkeletonPage action>
      <SkeletonTable rows={10} columns={["flex-1", "w-24", "w-20", "w-20", "w-24", "w-24", "w-14"]} />
      <SkeletonPagination />
    </SkeletonPage>
  );
}
