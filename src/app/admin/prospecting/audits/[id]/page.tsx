import { notFound } from "next/navigation";
import { requireCapability } from "@/lib/auth/guard";
import { getAuditForAdmin } from "@/lib/prospecting/audit";
import { PageTitle } from "@/components/admin/ui";
import { AuditReport } from "@/components/admin/prospecting/audit-report";

export const metadata = { title: "Audit report" };

/**
 * The audit runs in this invocation via `after`, once the response is sent.
 * Its bounded fetches cap out near 30 seconds, so 60 leaves clear headroom.
 */
export const maxDuration = 60;

export default async function ProspectingAuditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCapability("prospecting.manage", "/admin/prospecting/audit");
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const result = await getAuditForAdmin(id);
  if (!result) notFound();

  return (
    <>
      <PageTitle title="Audit report" count={`Evidence review · audit #${id}`} />
      <AuditReport audit={result.audit} findings={result.findings} />
    </>
  );
}
