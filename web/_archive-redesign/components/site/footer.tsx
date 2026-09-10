import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Logo from "./logo";
import { site, capabilities, engagements, navLinks, partnership } from "@/lib/content";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark bg-ink-950 text-white/60">
      <div className="mx-auto max-w-[76rem] px-6 py-20 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="text-white" aria-label="Forgeline Technologies — home">
              <Logo />
            </Link>
            <p className="mt-5 max-w-[34ch] text-[0.92rem] leading-relaxed">
              {site.description}
            </p>
            <a
              href={`mailto:${site.email}`}
              className="mt-5 inline-flex items-center gap-1.5 text-[0.92rem] text-white transition-colors hover:text-brand-300"
            >
              {site.email}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          <FooterCol title="Company">
            {navLinks.map((l) => (
              <FooterLink key={l.href} href={l.href}>
                {l.label}
              </FooterLink>
            ))}
            <FooterLink href="/contact">Contact</FooterLink>
          </FooterCol>

          <FooterCol title="Capabilities">
            {capabilities.slice(0, 5).map((c) => (
              <FooterLink key={c.slug} href={`/services#${c.slug}`}>
                {c.title}
              </FooterLink>
            ))}
          </FooterCol>

          <div>
            <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-white/40">
              Engagements
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {engagements.map((e) => (
                <FooterLink key={e.slug} href={`/services#${e.slug}`}>
                  {e.name}
                </FooterLink>
              ))}
            </ul>

            <h2 className="mt-8 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-white/40">
              Partner
            </h2>
            <p className="mt-4">
              <a
                href={partnership.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-[0.92rem] transition-colors hover:text-white"
              >
                {partnership.name}
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </a>
            </p>
            <p className="mt-1.5 max-w-[24ch] text-[0.78rem] leading-snug text-white/40">
              Business technology &amp; IT, alongside our web engineering.
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/12 pt-8 text-[0.82rem] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-white/40">
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-[0.92rem] transition-colors hover:text-white">
        {children}
      </Link>
    </li>
  );
}
