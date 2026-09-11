"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Logo } from "@/components/ui/logo";

/**
 * Site header.
 *
 * Client-side only because of the mobile disclosure. Everything else here is
 * static — the nav does not need JavaScript to render, only to collapse.
 *
 * The header sits on a hairline rather than a shadow. A drop shadow under a
 * navigation bar is the default that makes every site look like every other
 * site, and this one already has a structural language of fine rules.
 */
const nav = [
  { href: "/work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/process", label: "Process" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();

  // Close on route change: the panel is a page-level overlay, and leaving it
  // open across a navigation strands the visitor on top of the new page.
  //
  // Adjusted during render rather than in an effect. An effect would paint the
  // new page with the menu still over it for one frame before closing it, and
  // React flags the pattern for exactly that reason. Comparing against the
  // previous pathname in state is the documented way to reset on a change.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-md">
      <div className="shell">
        <div className="flex h-16 items-center justify-between gap-8 md:h-[4.5rem]">
          <Link
            href="/"
            className="text-graphite transition-colors hover:text-signal"
            aria-label={`${"Forgeline Technologies"} — home`}
          >
            <Logo />
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {nav.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`text-[0.9375rem] transition-colors hover:text-signal ${
                        active ? "text-graphite" : "text-muted"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="hidden lg:block">
            <Link
              href="/contact"
              className="rounded-sm bg-ink px-4 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-signal"
            >
              Start a project
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-sm text-graphite lg:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              {open ? (
                <path
                  d="M4 4l12 12M16 4L4 16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
              ) : (
                <path
                  d="M2 6h16M2 13h16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        id={panelId}
        hidden={!open}
        className="border-t border-rule bg-paper lg:hidden"
      >
        <nav aria-label="Primary" className="shell py-6">
          <ul className="flex flex-col">
            {nav.map((item) => (
              <li key={item.href} className="border-b border-rule last:border-0">
                <Link
                  href={item.href}
                  className="block py-3.5 text-lg text-graphite"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/contact"
            className="mt-6 block rounded-sm bg-ink px-4 py-3.5 text-center font-medium text-white"
          >
            Start a project
          </Link>
        </nav>
      </div>
    </header>
  );
}
