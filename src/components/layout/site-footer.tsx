import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { site, markets } from "@/lib/site";
import { services } from "@/data/services";

/**
 * Site footer.
 *
 * Carries the real navigation a visitor might still want at the bottom of a
 * page and the markets the work was actually delivered in.
 * No newsletter box: there is no newsletter, and a dead signup field is worse
 * than none.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="on-ink bg-ink text-on-ink">
      <div className="shell py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <Link href="/" className="inline-block text-white">
              <Logo />
            </Link>
            <p className="mt-5 max-w-[38ch] text-[0.9375rem] leading-relaxed text-on-ink-muted">
              A web engineering studio building websites, applications and
              custom software — scoped at a fixed price and built by the
              developer you brief.
            </p>
            <p className="mt-6 text-[0.9375rem]">
              {site.email ? (
                <a
                  href={`mailto:${site.email}`}
                  className="break-words text-on-ink underline decoration-rule-ink-strong underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                >
                  {site.email}
                </a>
              ) : (
                <Link
                  href="/contact"
                  className="text-on-ink underline decoration-rule-ink-strong underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                >
                  Start a project
                </Link>
              )}
            </p>
          </div>

          <nav className="md:col-span-3" aria-labelledby="footer-services">
            <h2
              id="footer-services"
              className="text-[0.9375rem] font-semibold text-white"
            >
              Services
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="text-[0.9375rem] text-on-ink-muted transition-colors hover:text-accent"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="md:col-span-2" aria-labelledby="footer-studio">
            <h2
              id="footer-studio"
              className="text-[0.9375rem] font-semibold text-white"
            >
              Studio
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {[
                { href: "/work", label: "Work" },
                { href: "/blog", label: "Blog" },
                { href: "/build-audit", label: "Build Audit" },
                { href: "/pricing", label: "Pricing" },
                { href: "/process", label: "How we work" },
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[0.9375rem] text-on-ink-muted transition-colors hover:text-accent"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-2">
            <h2 className="text-[0.9375rem] font-semibold text-white">
              Elsewhere
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <a
                  href={site.social.linkedin}
                  className="text-[0.9375rem] text-on-ink-muted transition-colors hover:text-accent"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href={site.social.github}
                  className="text-[0.9375rem] text-on-ink-muted transition-colors hover:text-accent"
                >
                  GitHub
                </a>
              </li>

            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-rule-ink pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-micro text-on-ink-muted">
            {year} {site.name}
          </p>
          <p className="font-mono text-micro text-on-ink-muted">
            Work delivered in {markets.join(", ")}
          </p>
        </div>
      </div>
    </footer>
  );
}
