import { Bar, SkeletonChips, SkeletonPage, SkeletonPagination } from "@/components/admin/skeleton";

/** Status chips, then the stacked review cards, each with its controls row. */
export default function Loading() {
  return (
    <SkeletonPage action>
      <SkeletonChips count={5} />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-sm border border-rule bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Bar className="h-5 w-48" />
                <Bar className="mt-2 h-3 w-64 bg-black/[0.05]" />
              </div>
              <Bar className="h-6 w-20" />
            </div>
            <Bar className="mt-4 h-4 w-full" />
            <Bar className="mt-2 h-4 w-11/12" />
            <Bar className="mt-2 h-4 w-2/3" />
            <div className="mt-4 flex gap-2 border-t border-rule pt-4">
              <Bar className="h-8 w-24" />
              <Bar className="h-8 w-24" />
              <Bar className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
      <SkeletonPagination />
    </SkeletonPage>
  );
}
