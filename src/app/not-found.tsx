import type { Metadata } from "next";
import Link from "next/link";
import { services } from "@/data/services";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * 404.
 *
 * An empty-state screen is an invitation to act, so this offers the routes a
 * lost visitor most likely wanted rather than an apology and a dead end.
 *
 * Carries its own header and footer. Next resolves unmatched URLs against the
 * root not-found, which sits outside the (site) route group and so does not
 * inherit the public chrome — without these a 404 would arrive with no way to
 * navigate anywhere, which is the one thing a 404 must not do.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main">
    <section className="on-ink bg-ink text-on-ink">
      <div className="shell">
        <div className="railed railed-inset py-24 md:py-36">
          <p className="font-mono text-micro text-accent">Error 404</p>
          <h1 className="text-title mt-5 max-w-[18ch] font-semibold text-white">
            That page is not here
          </h1>
          <p className="mt-6 max-w-[52ch] text-dek text-on-ink-muted">
            The address may be wrong, or the page may have moved during the site
            rebuild. Here is where most people are heading.
          </p>

          <ul className="mt-10 grid gap-x-8 gap-y-4 sm:grid-cols-2 md:max-w-2xl">
            {[
              { href: "/work", label: "The work", note: "17 shipped projects" },
              { href: "/services", label: "Services", note: "What we build" },
              { href: "/pricing", label: "Pricing", note: "Published figures" },
              {
                href: "/contact",
                label: "Start a project",
                note: "Send the details",
              },
            ].map((l) => (
              <li key={l.href} className="border-t border-rule-ink pt-4">
                <Link href={l.href} className="group block">
                  <span className="block text-[1.0625rem] font-semibold text-white transition-colors group-hover:text-accent">
                    {l.label}
                  </span>
                  <span className="mt-1 block text-[0.875rem] text-on-ink-muted">
                    {l.note}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-12 text-[0.9375rem] text-on-ink-muted">
            Looking for a specific service?{" "}
            <Link
              href={`/services/${services[0].slug}`}
              className="text-on-ink underline decoration-rule-ink-strong underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              Start here
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
      </main>
      <SiteFooter />
    </>
  );
}
