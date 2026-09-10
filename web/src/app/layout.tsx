import type { Metadata } from "next";
import { basePath } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL("https://forgelinetechnologies.com"),
  title: {
    default: "Forgeline Technologies — Full-stack web development studio",
    template: "%s — Forgeline Technologies",
  },
  description:
    "Full-stack web development studio. WordPress, Shopify, and custom web apps for businesses that need the thing to actually ship.",

  /* NOTE: canonical and openGraph.url are deliberately NOT set here.
     Metadata is inherited by every child route, so a canonical declared in
     the layout would make /blog claim to be a duplicate of "/". Each page
     sets its own. Canonical host is the apex domain, matching sitemap.ts
     and robots.ts — change all three together or they will disagree. */

  /* Open Graph and Twitter are declared once here and inherited by every
     route. Individual pages override only what differs. The image is not
     listed explicitly: the opengraph-image.tsx convention file is detected
     automatically and applied to both og:image and twitter:image. */
  openGraph: {
    type: "website",
    siteName: "Forgeline Technologies",
    locale: "en_US",
    title: "Forgeline Technologies — Full-stack web development studio",
    description:
      "Web apps, websites and e-commerce, built front-end to back-end at a fixed price. The developer you brief is the developer who builds it.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Forgeline Technologies — Full-stack web development studio",
    description:
      "Web apps, websites and e-commerce, built front-end to back-end at a fixed price.",
  },
  // metadata.icons paths are NOT basePath-aware in Next, unlike Link and
  // next/image — so the prefix has to be applied by hand or the favicon 404s
  // on any prefixed deployment.
  icons: { icon: `${basePath}/assets/favicon.svg` },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Browser extensions (password managers, form fillers) inject attributes
          onto <body> before React hydrates, which React reports as a mismatch.
          This suppresses attribute diffs on THIS element only — one level deep,
          so genuine hydration bugs further down the tree still surface. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
