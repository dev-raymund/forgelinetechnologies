import { Bar, SkeletonFacts, SkeletonPage, SkeletonPanel } from "@/components/admin/skeleton";

/**
 * The two-column prospect page: Business, Contact, Opportunity and Outreach on
 * the left; Pipeline, Website and Suppression on the right; history below.
 */
export default function Loading() {
  return (
    <SkeletonPage action>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-sm border border-rule bg-white p-5">
            <Bar className="h-5 w-28" />
            <SkeletonFacts count={6} />
          </section>
          <section className="rounded-sm border border-rule bg-white p-5">
            <Bar className="h-5 w-24" />
            <SkeletonFacts count={2} />
          </section>
          <section className="rounded-sm border border-rule bg-white p-5">
            <Bar className="h-2.5 w-24 bg-black/[0.05]" />
            <Bar className="mt-2 h-8 w-56" />
            <Bar className="mt-5 h-16 w-full" />
            <Bar className="mt-4 h-9 w-44" />
          </section>
          <SkeletonPanel lines={2} />
        </div>
        <div className="space-y-6 lg:col-span-5">
          <section className="rounded-sm border border-rule bg-white p-5">
            <Bar className="h-5 w-24" />
            <Bar className="mt-3 h-3 w-full bg-black/[0.05]" />
            <Bar className="mt-4 h-10 w-full" />
          </section>
          <SkeletonPanel lines={2} />
          <SkeletonPanel lines={2} />
        </div>
      </div>
      <div className="mt-6">
        <Bar className="mb-3 h-5 w-40" />
        <div className="rounded-sm border border-rule bg-white">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-rule px-4 py-3.5 last:border-b-0">
              <Bar className="h-4 w-14" />
              <Bar className="h-4 w-24" />
              <Bar className="h-4 w-20" />
              <Bar className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
