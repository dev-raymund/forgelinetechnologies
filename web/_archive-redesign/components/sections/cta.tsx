import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cta } from "@/lib/content";

export default function Cta() {
  return (
    <section className="on-dark relative overflow-hidden bg-ink-900 py-section-loose text-white/65">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-56 right-0 h-[30rem] w-[30rem] rounded-full opacity-30 blur-[130px]"
        style={{ background: "radial-gradient(circle, #0b63ce, transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-[76rem] px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow">Start here</p>
            <h2 className="mt-6 max-w-[16ch] text-h1 font-semibold text-white">
              {cta.heading}
            </h2>
            <p className="mt-6 max-w-[46ch] leading-relaxed">
              {cta.body}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end lg:pb-2">
            <ButtonLink href="/contact" size="lg">
              Start a project
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/work" variant="ghost-dark" size="lg">
              View our work
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
