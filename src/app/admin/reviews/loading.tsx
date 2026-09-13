import { Bar, SkeletonPage } from "@/components/admin/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-sm border border-rule bg-white p-5">
            <Bar className="h-5 w-48" />
            <Bar className="mt-2 h-3 w-64" />
            <Bar className="mt-4 h-4 w-full" />
            <Bar className="mt-2 h-4 w-3/4" />
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
