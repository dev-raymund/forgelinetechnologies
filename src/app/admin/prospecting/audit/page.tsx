import { requireCapability } from "@/lib/auth/guard";
import { PageTitle } from "@/components/admin/ui";
import { ScanPanel } from "@/components/admin/prospecting/scan-panel";

export const metadata = { title: "New prospect" };

/**
 * `analyzeWebsite`, the server action this page's form calls, runs the quick
 * scan inline: one bounded fetch with a ten second timeout. 60 leaves clear
 * headroom, matching the other prospecting pages.
 */
export const maxDuration = 60;

export default async function ProspectingScanPage() {
  await requireCapability("prospecting.manage", "/admin/prospecting/audit");
  return (
    <>
      <PageTitle
        title="New prospect"
        count="Read one homepage, and see whether there is a reason to make contact"
      />
      <ScanPanel />
    </>
  );
}
