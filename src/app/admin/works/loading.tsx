import { SkeletonPage, SkeletonTable } from "@/components/admin/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonTable />
    </SkeletonPage>
  );
}
