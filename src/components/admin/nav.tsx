"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth/session";

/**
 * Sidebar on desktop, a disclosure on mobile.
 *
 * A client component only because it needs the current path to mark the active
 * link and a little state for the mobile panel. The links themselves and the
 * capability filtering are decided on the server and passed in.
 */
export function AdminNav({
  links,
  user,
  logout,
}: {
  links: { href: string; label: string }[];
  user: SessionUser;
  logout: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const nav = (
    <ul className="flex flex-col gap-0.5">
      {links.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            onClick={() => setOpen(false)}
            aria-current={isActive(l.href) ? "page" : undefined}
            className={`block rounded-sm px-3 py-2 text-[0.9375rem] transition-colors ${
              isActive(l.href)
                ? "bg-ink text-white"
                : "text-graphite hover:bg-black/[0.05]"
            }`}
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  const account = (
    <div className="border-t border-rule pt-4">
      <p className="truncate text-[0.875rem] font-medium text-graphite">
        {user.name || user.email}
      </p>
      <p className="mt-0.5 font-mono text-micro text-faint">{user.role}</p>
      <form action={logout} className="mt-3">
        <button
          type="submit"
          className="w-full rounded-sm border border-rule-strong px-3 py-2 text-[0.875rem] font-medium text-graphite transition-colors hover:bg-black/[0.05]"
        >
          Sign out
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobile bar */}
      <div className="flex items-center justify-between border-b border-rule bg-white px-5 py-3 lg:hidden">
        <Link href="/admin" className="text-[0.9375rem] font-semibold">
          Forgeline <span className="font-normal text-faint">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-nav"
          className="rounded-sm border border-rule-strong px-3 py-1.5 text-[0.875rem] font-medium"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      <div
        id="admin-nav"
        hidden={!open}
        className="border-b border-rule bg-white px-5 py-4 lg:hidden"
      >
        {nav}
        <div className="mt-4">{account}</div>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[15rem] flex-col justify-between border-r border-rule bg-white px-4 py-6 lg:flex">
        <div>
          <Link href="/admin" className="block px-3 text-[1rem] font-semibold">
            Forgeline <span className="font-normal text-faint">Admin</span>
          </Link>
          <nav aria-label="Admin" className="mt-7">
            {nav}
          </nav>
        </div>
        {account}
      </aside>
    </>
  );
}
