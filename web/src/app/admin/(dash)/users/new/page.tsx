import UserForm from "../user-form";
import { requireAdminRole } from "@/lib/guards";
import PageShell from "../../page-shell";

export default async function NewUserPage() {
  // Editors must not reach user management, even by typing the URL.
  await requireAdminRole();
  return (
    <PageShell title="Add user" crumb={{ href: "/admin/users", label: "Users" }}>
      <UserForm />
    </PageShell>
  );
}
