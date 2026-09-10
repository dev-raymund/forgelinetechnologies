import type { Metadata } from "next";
import Nav from "@/components/site/nav";
import Footer from "@/components/site/footer";
import StructuredData from "@/components/site/structured-data";
import { site } from "@/lib/content";
import { isStaging } from "@/lib/env";
import "./forge.css";

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  alternates: { canonical: "/" },
  // Belt and braces alongside robots.ts: a staging deployment carrying the
  // same copy as production must never be indexed.
  ...(isStaging ? { robots: { index: false, follow: false } } : {}),
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[3px] focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <StructuredData />
      <Nav />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
