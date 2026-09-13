import { requireCapability } from "@/lib/auth/guard";
import { Empty, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Inquiries" };

export default async function Page() {
  await requireCapability("inquiries.manage", "/admin/inquiries");
  return (
    <>
      <PageTitle title="Inquiries" />
      <Empty>Not built yet.</Empty>
    </>
  );
}
