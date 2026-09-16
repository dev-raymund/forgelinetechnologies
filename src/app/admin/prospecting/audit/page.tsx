import { requireCapability } from "@/lib/auth/guard";
import { PageTitle } from "@/components/admin/ui";
import { AuditForm } from "@/components/admin/prospecting/audit-form";

export const metadata = { title: "Prospecting audit" };

/**
 * The audit runs in this invocation via `after`, once the response is sent.
 * Its bounded fetches cap out near 30 seconds, so 60 leaves clear headroom.
 */
export const maxDuration = 60;

export default async function ProspectingAuditPage() {
  await requireCapability("prospecting.manage", "/admin/prospecting/audit");
  return (
    <>
      <PageTitle title="Prospecting audit" count="Manual, evidence-led review of one public URL" />
      <AuditForm />
    </>
  );
}
