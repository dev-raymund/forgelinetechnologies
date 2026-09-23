import { Bar, SkeletonCards, SkeletonPage } from "@/components/admin/skeleton";

/** Matches the dashboard: a greeting, eight stat cards, two recent lists. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonCards count={8} />
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, panel) => (
          <section key={panel}>
            <Bar className="mb-3 h-5 w-40" />
            <div className="rounded-sm border border-rule bg-white">
              {Array.from({ length: 5 }).map((_, row) => (
                <div key={row} className="border-b border-rule px-4 py-3 last:border-b-0">
                  <Bar className="h-4 w-1/2" />
                  <Bar className="mt-2 h-3 w-1/3 bg-black/[0.05]" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </SkeletonPage>
  );
}
