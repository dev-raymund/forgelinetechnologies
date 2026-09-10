import { notFound } from "next/navigation";
import { getWork } from "@/lib/queries";
import WorkForm from "../work-form";
import PageShell from "../../page-shell";

export const dynamic = "force-dynamic";

export default async function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await getWork(Number(id));
  if (!work) notFound();

  return (
    <PageShell title="Edit project" crumb={{ href: "/admin/works", label: "Work" }}>
      <WorkForm work={work} />
    </PageShell>
  );
}
