import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import EcNav from "./_components/ec-nav";
import EcFooter from "./_components/ec-footer";
import { brand } from "./_data";
import "./econtent.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--ec-font-family",
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s — ${brand.name}`,
  },
  description: brand.blurb,
  // Placeholder site: keep it out of search results until the content is real.
  robots: { index: false, follow: false },
};

export default function EcontentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ec" style={{ ["--ec-font" as string]: jakarta.style.fontFamily }}>
      <EcNav />
      <main>{children}</main>
      <EcFooter />
    </div>
  );
}
