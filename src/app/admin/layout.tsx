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
  return (
    <>
      {/*
        Runs during parse, before anything is painted, so the dashboard never
        flashes light before switching to dark. Reads the same key the toggle
        writes, and falls back to the operating system preference.

        Wrapped in try/catch because localStorage throws outright in a private
        window with site data blocked, and a themeing preference is not worth
        a blank page.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{var c=localStorage.getItem('forgeline-admin-theme');var d=c==='dark'||((c===null||c==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.adminTheme=d?'dark':'light'}catch(e){}`,
        }}
      />
      {user ? <AdminShell user={user}>{children}</AdminShell> : children}
    </>
  );
}
