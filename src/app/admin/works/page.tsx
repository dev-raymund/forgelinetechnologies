import { requireCapability } from "@/lib/auth/guard";
import { Empty, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Works" };

export default async function Page() {
  await requireCapability("works.manage", "/admin/works");
  return (
    <>
      <PageTitle title="Works" />
      <Empty>Not built yet.</Empty>
    </>
  );
}
