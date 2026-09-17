import { requireCapability } from "@/lib/auth/guard";
import { PageTitle } from "@/components/admin/ui";
import { ImportForm } from "@/components/admin/prospecting/import-form";

export const metadata = { title: "Import prospects" };

/**
 * `commitImport`, the server action this page's form calls, refreshes each
 * changed prospect's snapshot sequentially after the rows are already
 * committed (up to four round trips per prospect). 60 leaves headroom so a
 * re-import that changes many rows does not time out after it has already
 * been saved, matching the comment on the prospects list page, which does
 * the same thing for the same reason.
 */
export const maxDuration = 60;

export default async function ProspectingImportPage() {
  await requireCapability("prospecting.manage", "/admin/prospecting/import");
  return (
    <>
      <PageTitle
        title="Import prospects"
        count="CSV columns: company, website, industry, country, location, contact, contact_source"
      />
      <ImportForm />
    </>
  );
}
