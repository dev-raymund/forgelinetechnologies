"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Logo } from "@/components/ui/logo";
import { ArrowRight } from "@/components/ui/icon";

/**
 * Site header.
 *
 * Navy rather than paper, so it merges into the dark opening of every page —
 * the homepage hero and the PageHeader band both sit on ink, and a white bar
 * above them cut the top of the site in half. Now the header and the opening
 * read as one field, and the seam only appears once you scroll past it.
 *
 * The scrolled state comes from a one-pixel sentinel watched by an
 * IntersectionObserver rather than a scroll listener: it fires twice in the
 * life of a scroll instead of on every frame, and it needs no throttling.
 */
const nav = [
  { href: "/work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/process", label: "How we work" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const sentinel = useRef<HTMLDivElement>(null);

  // Reset on navigation, adjusted during render rather than in an effect —
  // an effect would paint the new page with the menu still over it.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) =>
      setStuck(!entry.isIntersecting),
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
    <>
      <div
        ref={sentinel}
        aria-hidden="true"
        className="absolute top-0 h-px w-px"
      />

      <header
        data-stuck={stuck || undefined}
        className="site-header on-ink sticky top-0 z-40 bg-ink text-on-ink"
      >
        {/* The faint engineering grid from the hero schematic, carried up into
            the header so the two read as the same surface. */}
        <div aria-hidden="true" className="header-grid absolute inset-0" />

        <div className="shell relative">
          <div className="flex h-[4.25rem] items-center justify-between gap-8 md:h-20">
            <Link
              href="/"
              className="text-white transition-opacity hover:opacity-85"
            >
              <Logo />
            </Link>

            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-7">
                {nav.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`relative py-2 text-[0.9375rem] transition-colors hover:text-white ${
                          active ? "text-white" : "text-on-ink-muted"
                        }`}
                      >
                        {item.label}
                        {/* The current page is marked in the brand accent —
                            an underline rather than a colour change, because
                            orange cannot carry text at this size. */}
                        <span
                          aria-hidden="true"
                          className={`absolute inset-x-0 -bottom-0.5 h-0.5 origin-left bg-accent transition-transform duration-300 ${
                            active ? "scale-x-100" : "scale-x-0"
                          }`}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="hidden lg:block">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-accent-deep"
              >
                Start a conversation
                <ArrowRight />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={panelId}
              className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-sm text-white lg:hidden"
            >
              <span className="sr-only">
                {open ? "Close menu" : "Open menu"}
              </span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
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
          className="relative border-t border-rule-ink bg-ink lg:hidden"
        >
          <nav aria-label="Primary" className="shell py-6">
            <ul className="flex flex-col">
              {nav.map((item) => (
                <li
                  key={item.href}
                  className="border-b border-rule-ink last:border-0"
                >
                  <Link
                    href={item.href}
                    className="block py-3.5 text-lg text-on-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/contact"
              className="mt-6 flex items-center justify-center gap-2 rounded-sm bg-accent px-4 py-3.5 text-center font-medium text-white"
            >
              Start a conversation
              <ArrowRight />
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
