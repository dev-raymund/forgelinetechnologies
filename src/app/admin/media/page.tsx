import { requireCapability } from "@/lib/auth/guard";
import { listMedia } from "@/lib/media/library";
import { PageTitle } from "@/components/admin/ui";
import { MediaLibrary } from "@/components/admin/media/media-library";

export const metadata = { title: "Media" };

export default async function MediaPage() {
  await requireCapability("media.manage", "/admin/media");
  const { items, blobError } = await listMedia();

  return (
    <>
      <PageTitle
        title="Media"
        count={`${items.length} ${items.length === 1 ? "image" : "images"}`}
      />
      <MediaLibrary items={items} blobError={blobError} />
    </>
  );
}
