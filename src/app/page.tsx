import type { Metadata } from "next";
import { site } from "@/lib/site";
import { organizationSchema, faqSchema, jsonLd } from "@/lib/structured-data";
import { Hero } from "@/components/home/hero";
import { ServicesOverview } from "@/components/home/services-overview";
import { FeaturedWork } from "@/components/home/featured-work";
import { WhyForgeline } from "@/components/home/why-forgeline";
import { Technology } from "@/components/home/technology";
import { Process } from "@/components/home/process";
import { Partnership } from "@/components/home/partnership";
import { Founder } from "@/components/home/founder";
import { Faq } from "@/components/home/faq";
import { ClosingCta } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  // `absolute` so the homepage title is not suffixed by the layout template.
  title: {
    absolute: `${site.name} — Web Development & Digital Products`,
  },
  description: site.description,
  alternates: { canonical: "/" },
};

/**
 * Homepage.
 *
 * The order is an argument, not a list of sections: what we build, proof that
 * we have built it, why the arrangement is different, how the work runs, who
 * is behind it, and then the objections — before finally asking.
 *
 * Grounds alternate ink / white / paper so the page has peaks and valleys.
 * Sections carry their own weight via the `size` prop rather than everything
 * defaulting to enormous.
 */
export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema()) }}
      />

      <Hero />
      <ServicesOverview />
      <FeaturedWork />
      <WhyForgeline />
      <Technology />
      <Process />
      <Partnership />
      <Founder />
      <Faq />
      <ClosingCta />
    </>
  );
}
