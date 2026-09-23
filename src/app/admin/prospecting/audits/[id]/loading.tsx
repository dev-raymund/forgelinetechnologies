import { Bar, SkeletonFacts, SkeletonPage } from "@/components/admin/skeleton";

/** The stored report: header, the two signal panels, then the findings list. */
export default function Loading() {
  return (
    <SkeletonPage>
      <div className="space-y-8">
        <section className="rounded-sm border border-rule bg-white p-5 md:p-6">
          <Bar className="h-2.5 w-20 bg-black/[0.05]" />
          <Bar className="mt-2 h-6 w-48" />
          <SkeletonFacts count={4} />
        </section>
        <section>
          <Bar className="mb-3 h-5 w-40" />
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-sm border border-rule bg-white p-4">
                <Bar className="h-2.5 w-36 bg-black/[0.05]" />
                {Array.from({ length: 5 }).map((_, r) => (
                  <Bar key={r} className="mt-2.5 h-4 w-full" />
                ))}
              </div>
            ))}
          </div>
        </section>
        <section>
          <Bar className="mb-3 h-5 w-52" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-sm border border-rule bg-white p-4">
                <Bar className="h-3 w-40 bg-black/[0.05]" />
                <Bar className="mt-2 h-4 w-56" />
                <Bar className="mt-2 h-4 w-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </SkeletonPage>
  );
}
