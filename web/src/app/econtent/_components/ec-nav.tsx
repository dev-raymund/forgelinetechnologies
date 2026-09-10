"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand, nav } from "../_data";

export default function EcNav() {
  const pathname = usePathname();

  return (
    <header className="ec-nav">
      <div className="ec-nav-inner">
        <Link className="ec-brand" href="/econtent">
          <span className="ec-brand-mark" aria-hidden="true">
            e
          </span>
          {brand.name}
        </Link>
        <nav className="ec-nav-links" aria-label="Main">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Link className="ec-btn ec-btn-sm" href="/econtent/contact">
            Get a quote
          </Link>
        </nav>
      </div>
    </header>
  );
}
