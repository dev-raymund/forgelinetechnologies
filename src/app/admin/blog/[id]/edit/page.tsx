import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireCapability } from "@/lib/auth/guard";
import { getDb, posts } from "@/db";
import { renderMarkdown } from "@/lib/markdown";
import { listMedia } from "@/lib/media/library";
import { PageTitle } from "@/components/admin/ui";
import { PostForm } from "@/components/admin/post-form";

export const metadata = { title: "Edit post" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  await requireCapability("posts.manage", `/admin/blog/${raw}/edit`);
  if (!Number.isInteger(id) || id < 1) notFound();

  const [row] = await getDb().select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!row) notFound();

  const { items: mediaItems, blobError: mediaError } = await listMedia();

  return (
    <>
      <PageTitle title={row.title} count={`/blog/${row.slug}`} />
      <PostForm
        // Rendered here, with the same function the public page calls, so the
        // preview cannot drift from what a reader will actually see.
        preview={renderMarkdown(row.body)}
        mediaItems={mediaItems}
        mediaError={mediaError}
        initial={{
          id: row.id,
          title: row.title,
          slug: row.slug,
          excerpt: row.excerpt,
          body: row.body,
          coverUrl: row.coverUrl,
          seoTitle: row.seoTitle,
          seoDescription: row.seoDescription,
          ogImage: row.ogImage,
          status: row.status,
        }}
      />
    </>
  );
}
