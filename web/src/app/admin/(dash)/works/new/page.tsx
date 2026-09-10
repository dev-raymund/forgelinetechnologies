import WorkForm from "../work-form";
import PageShell from "../../page-shell";

export default function NewWorkPage() {
  return (
    <PageShell title="Add project" crumb={{ href: "/admin/works", label: "Work" }}>
      <WorkForm />
    </PageShell>
  );
}
