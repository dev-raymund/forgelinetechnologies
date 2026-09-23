import { SkeletonForm, SkeletonPage } from "@/components/admin/skeleton";

/** The editor form: labelled fields and a body textarea. */
export default function Loading() {
  return (
    <SkeletonPage action>
      <SkeletonForm fields={6} />
    </SkeletonPage>
  );
}
