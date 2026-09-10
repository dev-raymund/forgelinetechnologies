import type { Metadata } from "next";
import Image from "next/image";
import PageHero from "@/components/site/page-hero";
import Credibility from "@/components/sections/credibility";
import Why from "@/components/sections/why";
import Process from "@/components/sections/process";
import Partnership from "@/components/sections/partnership";
import Cta from "@/components/sections/cta";
import { founder, site } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Forgeline is a senior-led web engineering studio founded by Raymund Hermoso — six years across agencies in Australia and New Zealand, plus enterprise work at PPD–ThermoFisher. You brief the developer who builds it.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="A studio built around removing the middle layer."
        lede={site.description}
      />

      <Credibility />

      <section className="bg-paper py-section">
        <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
            <div>
              <p className="eyebrow">The founder</p>
              <h2 className="mt-6 max-w-[20ch] text-h1 font-semibold">
                Six years of watching the same thing go wrong.
              </h2>
              <div className="mt-8 flex flex-col gap-5 text-[1.05rem] leading-relaxed">
                {founder.bio.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>

              <dl className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-3">
                {founder.credentials.map((c) => (
                  <div key={c} className="bg-paper p-6">
                    <dd className="text-[0.95rem] font-medium text-ink-900">{c}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="lg:pt-16">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[3px] border border-line bg-paper-100">
                <Image
                  src={founder.photo}
                  alt={`${founder.name}, ${founder.role} at Forgeline Technologies`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 38vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-5 font-display text-[1.1rem] font-semibold text-ink-900">
                {founder.name}
              </p>
              <p className="text-[0.9rem] text-muted">{founder.role}</p>
            </div>
          </div>
        </div>
      </section>

      <Why />
      <Process />
      <Partnership />
      <Cta />
    </>
  );
}
