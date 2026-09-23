import { Bar, SkeletonFacts, SkeletonPage, SkeletonPanel } from "@/components/admin/skeleton";

/** One enquiry: the details panel, the message, then the notes thread. */
export default function Loading() {
  return (
    <SkeletonPage action>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-sm border border-rule bg-white p-5">
            <Bar className="h-5 w-28" />
            <SkeletonFacts count={6} />
          </section>
          <SkeletonPanel lines={4} />
        </div>
        <div className="space-y-6 lg:col-span-5">
          <SkeletonPanel lines={2} />
          <section className="rounded-sm border border-rule bg-white p-5">
            <Bar className="h-5 w-24" />
            <Bar className="mt-3 h-20 w-full" />
            <Bar className="mt-3 h-9 w-28" />
          </section>
        </div>
      </div>
    </SkeletonPage>
  );
}
