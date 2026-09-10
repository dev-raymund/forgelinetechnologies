"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import Logo from "./logo";
import { navLinks } from "@/lib/content";

/**
 * Every page opens on an ink hero, so the bar starts transparent with light
 * type and flips to paper once it has left that band. `solid` also covers the
 * open mobile panel, which needs the light treatment regardless of scroll.
 */
export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Route change closes the panel; body scroll lock belongs with the open state.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid
          ? "border-b border-line bg-paper/85 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[76rem] items-center justify-between px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Forgeline Technologies — home"
          className={`py-4 transition-colors ${solid ? "text-ink-900" : "text-white"}`}
        >
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {navLinks.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center px-3.5 text-[0.86rem] transition-colors duration-200 ${
                  solid
                    ? active
                      ? "text-ink-900"
                      : "text-copy hover:text-ink-900"
                    : active
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/contact"
            className={`ml-4 inline-flex h-9 items-center gap-2 rounded-[3px] border px-4 text-[0.86rem] font-medium transition-colors duration-200 ${
              solid
                ? "border-ink-900 bg-ink-900 text-white hover:border-brand-600 hover:bg-brand-600"
                : "border-white/30 bg-transparent text-white hover:border-white hover:bg-white hover:text-ink-900"
            }`}
          >
            Start a project
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className={`-mr-2 inline-flex h-11 w-11 items-center justify-center md:hidden ${solid ? "text-ink-900" : "text-white"}`}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile panel: large editorial type rather than a shrunken desktop menu */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-line bg-paper md:hidden"
      >
        <nav className="mx-auto max-w-[76rem] px-6 py-6" aria-label="Mobile">
          <ul className="flex flex-col">
            {navLinks.map((l, i) => (
              <li key={l.href} className={i > 0 ? "border-t border-line" : ""}>
                <Link
                  href={l.href}
                  className="flex items-center justify-between py-4 font-display text-2xl tracking-[-0.02em] text-ink-900"
                >
                  {l.label}
                  <ArrowRight className="h-4 w-4 text-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/contact"
            className="mt-6 flex h-12 items-center justify-center gap-2 rounded-[3px] bg-ink-900 px-6 font-medium text-white"
          >
            Start a project
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
