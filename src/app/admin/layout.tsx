import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/shell";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Forgeline Admin" },
  // The dashboard must never be indexed, and must not leak through a referrer.
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

/** Session state is per-request, so nothing under /admin may be cached. */
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Null on the login screen, which renders bare. Every other page calls
  // requireUser itself — this is for the chrome, not for access control.
  const user = await getSessionUser();
  if (!user) return <>{children}</>;
  return <AdminShell user={user}>{children}</AdminShell>;
}
