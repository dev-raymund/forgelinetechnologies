"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconGrid, IconBriefcase, IconPen, IconUsers } from "@/components/admin-icons";

export type NavCounts = { works: number; posts: number; users: number };

export default function AdminNav({
  canManageUsers,
  counts,
}: {
  canManageUsers: boolean;
  counts: NavCounts;
}) {
  const path = usePathname();

  const links = [
    { href: "/admin", label: "Dashboard", Icon: IconGrid, count: undefined as number | undefined },
    { href: "/admin/works", label: "Work", Icon: IconBriefcase, count: counts.works },
    { href: "/admin/posts", label: "Blog", Icon: IconPen, count: counts.posts },
    ...(canManageUsers
      ? [{ href: "/admin/users", label: "Users", Icon: IconUsers, count: counts.users }]
      : []),
  ];

  return (
    <>
      <p className="adm-side-label">Manage</p>
      <nav className="adm-side-nav">
        {links.map(({ href, label, Icon, count }) => {
          const on = href === "/admin" ? path === "/admin" : path.startsWith(href);
          return (
            <Link key={href} href={href} className={on ? "on" : undefined}>
              <Icon />
              {label}
              {count !== undefined && <span className="count">{count}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
