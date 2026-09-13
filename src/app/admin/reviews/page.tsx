import { requireCapability } from "@/lib/auth/guard";
import { Empty, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Reviews" };

export default async function Page() {
  await requireCapability("reviews.manage", "/admin/reviews");
  return (
    <>
      <PageTitle title="Reviews" />
      <Empty>Not built yet.</Empty>
    </>
  );
}
