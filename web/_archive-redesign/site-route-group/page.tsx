import type { Metadata } from "next";
import { getPublishedWorks } from "@/lib/queries";
import { site } from "@/lib/content";
import Hero from "@/components/sections/hero";
import Credibility from "@/components/sections/credibility";
import Capabilities from "@/components/sections/capabilities";
import FeaturedWork from "@/components/sections/featured-work";
import Why from "@/components/sections/why";
import Tech from "@/components/sections/tech";
import Process from "@/components/sections/process";
import Partnership from "@/components/sections/partnership";
import Founder from "@/components/sections/founder";
import Faq from "@/components/sections/faq";
import Cta from "@/components/sections/cta";

// Work is DB-driven and revalidated on save from the admin.
export const revalidate = 3600;

export const metadata: Metadata = {
  // `absolute` so the home title isn't suffixed by the layout template.
  title: { absolute: `${site.name} — ${site.tagline}` },
  description: site.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const works = await getPublishedWorks();

  return (
    <>
      <Hero />
      <Credibility />
      <Capabilities />
      <FeaturedWork works={works.slice(0, 5)} />
      <Why />
      <Tech />
      <Process />
      <Partnership />
      <Founder />
      <Faq />
      <Cta />
    </>
  );
}
