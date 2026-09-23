import { Bar, SkeletonGrid, SkeletonPage } from "@/components/admin/skeleton";

/** The upload panel, then the thumbnail grid. */
export default function Loading() {
  return (
    <SkeletonPage>
      <Bar className="mb-5 h-24 w-full" />
      <SkeletonGrid count={12} />
    </SkeletonPage>
  );
}
