import { logout } from "@/lib/auth/actions";
import { roleHas, type Capability } from "@/lib/auth/guard";
import type { SessionUser } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/nav";

/**
 * The admin chrome.
 *
 * Visually separate from the public site on purpose: denser, plainer, and
 * without the marketing typography. Someone should be able to tell at a glance
 * which of the two they are looking at — and screenshots of a dashboard should
 * never be mistaken for the product.
 *
 * The nav is filtered by capability so an editor is not shown a door they
 * cannot open. That is presentation only; the guard on each route is what
 * actually stops them.
 */

/** `icon` is a key, not a component: the nav is a client component and a
    function cannot cross that boundary as a prop. */
const LINKS: {
  href: string;
  label: string;
  capability: Capability;
  icon: string;
}[] = [
  { href: "/admin", label: "Dashboard", capability: "inquiries.manage", icon: "gauge" },
  { href: "/admin/inquiries", label: "Inquiries", capability: "inquiries.manage", icon: "inbox" },
  { href: "/admin/reviews", label: "Reviews", capability: "reviews.manage", icon: "star" },
  { href: "/admin/blog", label: "Blog posts", capability: "posts.manage", icon: "file" },
  { href: "/admin/works", label: "Works", capability: "works.manage", icon: "briefcase" },
  { href: "/admin/prospecting/audit", label: "Prospecting audit", capability: "prospecting.manage", icon: "gauge" },
  { href: "/admin/users", label: "Users", capability: "users.manage", icon: "users" },
];

export function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const links = LINKS.filter((l) => roleHas(user.role, l.capability));

  return (
    <div className="admin-root min-h-dvh text-graphite">
      <AdminNav links={links} user={user} logout={logout} />
      <div className="lg:pl-[15rem]">
        <main className="mx-auto max-w-[78rem] px-5 py-8 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
