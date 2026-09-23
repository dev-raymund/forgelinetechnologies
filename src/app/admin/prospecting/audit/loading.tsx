import { Bar, SkeletonPage } from "@/components/admin/skeleton";

/** The single URL form: one label, one input, its note, and the button. */
export default function Loading() {
  return (
    <SkeletonPage>
      <div className="max-w-[42rem] rounded-sm border border-rule bg-white p-5 md:p-6">
        <Bar className="h-3 w-24" />
        <Bar className="mt-1.5 h-11 w-full" />
        <Bar className="mt-3 h-3 w-4/5 bg-black/[0.05]" />
        <Bar className="mt-2 h-3 w-2/3 bg-black/[0.05]" />
        <Bar className="mt-6 h-11 w-40" />
      </div>
    </SkeletonPage>
  );
}
