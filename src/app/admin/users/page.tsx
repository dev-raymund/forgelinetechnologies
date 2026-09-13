import { requireCapability } from "@/lib/auth/guard";
import { Empty, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Users" };

export default async function Page() {
  await requireCapability("users.manage", "/admin/users");
  return (
    <>
      <PageTitle title="Users" />
      <Empty>Not built yet.</Empty>
    </>
  );
}
