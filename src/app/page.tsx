import type { Metadata } from "next";
import { site } from "@/lib/site";
import {
  organizationSchema,
  websiteSchema,
  faqSchema,
  jsonLd,
} from "@/lib/structured-data";
import { Hero } from "@/components/home/hero";
import { Problem } from "@/components/home/problem";
import { ServicesOverview } from "@/components/home/services-overview";
import { FeaturedWork } from "@/components/home/featured-work";
import { WhyForgeline } from "@/components/home/why-forgeline";
import { Promise } from "@/components/home/promise";
import { Technology } from "@/components/home/technology";
import { Process } from "@/components/home/process";
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
 * The order is an argument, not a list of sections: what we build, why the
 * arrangement is different, what we commit to, proof that we have built it,
 * how the work runs, who is behind it, and then the objections — before
 * finally asking.
 *
 * The Promise sits immediately after the differentiator because that is where
 * a reader is most receptive to it: they have just been told why the model is
 * unusual, and the next honest question is what it actually commits us to.
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
        dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema()) }}
      />

      <Hero />
      <Problem />
      <ServicesOverview />
      <WhyForgeline />
      <Promise />
      <FeaturedWork />
      <Process />
      <Technology ground="paper" />
      <Founder />
      <Faq />
      <ClosingCta />
    </>
  );
}
