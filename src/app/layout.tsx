import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { site, founder } from "@/lib/site";
import { Analytics } from "@/components/analytics";
import "./globals.css";

/**
 * Archivo carries the whole site. It is a squarish grotesque — the vertical
 * terminals and flat joins read as engineered rather than friendly, which is
 * the point. Weights are pinned to the four actually used; every extra weight
 * is bytes a visitor pays for.
 */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/**
 * Mono is reserved for things that genuinely are data: stack names, figures,
 * indices, URLs. It is not a decorative label face — using it for every small
 * caption is the tell of a page that wants to look technical rather than be
 * about something technical.
 */
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: founder.name, url: site.social.linkedin }],
  creator: founder.name,
  publisher: site.name,
  // Every page sets its own canonical; this only supplies the default origin.
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_AU",
    url: site.url,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  // No keywords array: search engines have ignored it for two decades and it
  // only advertises that the page was optimised by someone who did not know.
};

/**
 * The document shell, and nothing more.
 *
 * The public header, footer and skip link moved to app/(site)/layout.tsx when
 * /admin arrived: the dashboard must not wear the marketing chrome, and a
 * signed-in admin page showing a "Start a project" button reads as the public
 * site. Route groups change nothing about URLs — every public path is exactly
 * where it was.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh antialiased">
        {/* Marks that scripts are running, so CSS can hide reveal targets
            before their entrance. Without JS the class never lands and every
            section renders visible. Inline and first in the body so it
            executes during parse rather than after first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
