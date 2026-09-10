import PostForm from "../post-form";
import PageShell from "../../page-shell";

export default function NewPostPage() {
  return (
    <PageShell title="Write post" crumb={{ href: "/admin/posts", label: "Blog" }}>
      <PostForm />
    </PageShell>
  );
}
