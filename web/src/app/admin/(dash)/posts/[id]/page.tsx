import { notFound } from "next/navigation";
import { getPost } from "@/lib/queries";
import PostForm from "../post-form";
import PageShell from "../../page-shell";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(Number(id));
  if (!post) notFound();

  return (
    <PageShell title="Edit post" crumb={{ href: "/admin/posts", label: "Blog" }}>
      <PostForm post={post} />
    </PageShell>
  );
}
