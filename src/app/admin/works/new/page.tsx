import { requireCapability } from "@/lib/auth/guard";
import { PageTitle } from "@/components/admin/ui";
import { WorkForm } from "@/components/admin/work-form";

export const metadata = { title: "New project" };

export default async function NewWorkPage() {
  await requireCapability("works.manage", "/admin/works/new");
  return (
    <>
      <PageTitle title="New project" count="Saved as a draft unless you publish it" />
      <WorkForm
        initial={{
          id: null,
          title: "",
          slug: "",
          kind: "Website",
          sector: "",
          description: "",
          imageUrl: "",
          imageAlt: "",
          liveUrl: "",
          stack: "",
          overview: "",
          challenge: "",
          approach: "",
          outcome: "",
          status: "draft",
          featured: false,
          sortOrder: 0,
        }}
      />
    </>
  );
}
