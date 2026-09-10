import type { Metadata } from "next";
import { basePath } from "@/lib/env";
import "./site.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://forgelinetechnologies.com"),
  title: {
    default: "Forgeline Technologies — Full-stack web development studio",
    template: "%s — Forgeline Technologies",
  },
  description:
    "Full-stack web development studio. WordPress, Shopify, and custom web apps for businesses that need the thing to actually ship.",
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
