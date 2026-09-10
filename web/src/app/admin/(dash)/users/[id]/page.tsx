import { notFound } from "next/navigation";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import UserForm from "../user-form";
import { requireAdminRole } from "@/lib/guards";
import PageShell from "../../page-shell";

export const dynamic = "force-dynamic";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  // Editors must not reach user management, even by typing the URL.
  await requireAdminRole();
  const { id } = await params;
  const userId = Number(id);
  const [[user], me] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    getCurrentUser(),
  ]);
  if (!user) notFound();

  const [others] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.active, true), ne(users.id, userId)));

  return (
    <PageShell title="Edit user" crumb={{ href: "/admin/users", label: "Users" }}>
      <UserForm
        user={user}
        isSelf={user.id === me?.id}
        isOnlyAdmin={user.role === "admin" && user.active && (others?.n ?? 0) === 0}
      />
    </PageShell>
  );
}
