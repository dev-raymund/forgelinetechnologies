import { Bar, SkeletonPage, SkeletonPagination, SkeletonTable } from "@/components/admin/skeleton";

/** The add-user panel, then Name, Email, Role, Status, Added, actions. */
export default function Loading() {
  return (
    <SkeletonPage>
      <Bar className="mb-5 h-10 w-36" />
      <SkeletonTable rows={6} columns={["flex-1", "w-44", "w-16", "w-16", "w-24", "w-20"]} />
      <SkeletonPagination />
    </SkeletonPage>
  );
}
