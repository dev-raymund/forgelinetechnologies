"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth/session";
import {
  BriefcaseIcon,
  FileTextIcon,
  GaugeIcon,
  InboxIcon,
  SignOutIcon,
  StarIcon,
  UsersIcon,
} from "@/components/admin/icons";

/**
 * Sidebar on desktop, a disclosure on mobile.
 *
 * A client component because it needs the current path to mark the active
 * link, a little state for the mobile panel, and `useLinkStatus` to show which
 * link is loading. The links and the capability filtering are decided on the
 * server and passed in.
 */

const ICONS: Record<string, (p: { className?: string }) => React.ReactElement> = {
  gauge: GaugeIcon,
  inbox: InboxIcon,
  star: StarIcon,
  file: FileTextIcon,
  briefcase: BriefcaseIcon,
  users: UsersIcon,
};

/**
 * A spinner on the link you just clicked.
 *
 * `useLinkStatus` reports the pending state of its nearest parent Link, so the
 * feedback lands on the thing that was clicked rather than somewhere generic.
 * That matters most on the slow navigations — a list that has to reach the
 * database — which are exactly the ones that otherwise feel broken.
 */
function LinkSpinner() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden="true"
      className="ml-auto size-3 shrink-0 animate-spin rounded-full border border-current border-t-transparent opacity-70"
    />
  );
}

export function AdminNav({
  links,
  user,
  logout,
}: {
  links: { href: string; label: string; icon: string }[];
  user: SessionUser;
  logout: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const nav = (
    <ul className="flex flex-col gap-0.5">
      {links.map((l) => {
        const Icon = ICONS[l.icon] ?? GaugeIcon;
        const active = isActive(l.href);
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-sm px-3 py-2 text-[0.9375rem] transition-colors ${
                active ? "bg-ink text-white" : "text-graphite hover:bg-black/[0.05]"
              }`}
            >
              <Icon className={active ? "opacity-90" : "opacity-55"} />
              {l.label}
              <LinkSpinner />
            </Link>
          </li>
        );
      })}
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
          className="flex w-full items-center justify-center gap-2 rounded-sm border border-rule-strong px-3 py-2 text-[0.875rem] font-medium text-graphite transition-colors hover:bg-black/[0.05]"
        >
          <SignOutIcon className="opacity-60" />
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
