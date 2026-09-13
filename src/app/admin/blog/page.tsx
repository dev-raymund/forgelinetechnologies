import { requireCapability } from "@/lib/auth/guard";
import { Empty, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Blog posts" };

export default async function Page() {
  await requireCapability("posts.manage", "/admin/blog");
  return (
    <>
      <PageTitle title="Blog posts" />
      <Empty>Not built yet.</Empty>
    </>
  );
}
