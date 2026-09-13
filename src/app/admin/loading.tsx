import { SkeletonCards, SkeletonPage, SkeletonTable } from "@/components/admin/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonCards />
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <SkeletonTable rows={3} />
        <SkeletonTable rows={3} />
      </div>
    </SkeletonPage>
  );
}
