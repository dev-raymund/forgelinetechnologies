import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireCapability } from "@/lib/auth/guard";
import { getDb, projects } from "@/db";
import { PageTitle } from "@/components/admin/ui";
import { WorkForm } from "@/components/admin/work-form";

export const metadata = { title: "Edit project" };

export default async function EditWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  await requireCapability("works.manage", `/admin/works/${raw}/edit`);
  if (!Number.isInteger(id) || id < 1) notFound();

  const [row] = await getDb().select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!row) notFound();

  return (
    <>
      <PageTitle title={row.title} count={`/work/${row.slug}`} />
      <WorkForm
        initial={{
          id: row.id,
          title: row.title,
          slug: row.slug,
          kind: row.kind,
          sector: row.sector,
          description: row.description,
          imageUrl: row.imageUrl,
          imageAlt: row.imageAlt,
          liveUrl: row.liveUrl,
          stack: (row.stack ?? []).join(", "),
          overview: row.overview,
          challenge: row.challenge,
          approach: row.approach,
          outcome: row.outcome,
          status: row.status,
          featured: row.featured,
          sortOrder: row.sortOrder,
        }}
      />
    </>
  );
}
