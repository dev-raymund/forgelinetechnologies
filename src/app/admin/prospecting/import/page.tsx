import { requireCapability } from "@/lib/auth/guard";
import { PageTitle } from "@/components/admin/ui";
import { ImportForm } from "@/components/admin/prospecting/import-form";

export const metadata = { title: "Import prospects" };

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
