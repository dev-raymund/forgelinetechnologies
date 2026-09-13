import { requireCapability } from "@/lib/auth/guard";
import { PageTitle } from "@/components/admin/ui";
import { PostForm } from "@/components/admin/post-form";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  await requireCapability("posts.manage", "/admin/blog/new");
  return (
    <>
      <PageTitle title="New post" count="Saved as a draft unless you publish it" />
      <PostForm
        preview=""
        initial={{
          id: null,
          title: "",
          slug: "",
          excerpt: "",
          body: "",
          coverUrl: "",
          seoTitle: "",
          seoDescription: "",
          ogImage: "",
          status: "draft",
        }}
      />
    </>
  );
}
