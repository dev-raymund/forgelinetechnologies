import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { hero } from "@/lib/content";
import GridMotif from "@/components/ui/grid-motif";


export default function Hero() {
  return (
    <section className="on-dark relative overflow-hidden bg-ink-950 pt-32 pb-20 text-white/70 lg:pt-40 lg:pb-28">
      <GridMotif />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/4 h-[34rem] w-[34rem] rounded-full opacity-25 blur-[120px]"
        style={{ background: "radial-gradient(circle, #0b63ce, transparent 70%)" }}
      />

      <div className="relative mx-auto grid max-w-[76rem] gap-16 px-6 lg:grid-cols-[1.35fr_1fr] lg:items-end lg:gap-20 lg:px-8">
        <div>
          <p className="eyebrow reveal">{hero.eyebrow}</p>

          <h1 className="reveal mt-7 max-w-[19ch] text-display font-semibold text-white [animation-delay:80ms]">
            {hero.headline}
          </h1>

          <p className="reveal mt-7 max-w-[52ch] text-[1.05rem] leading-relaxed text-white/65 [animation-delay:160ms]">
            {hero.lede}
          </p>

          <p className="reveal mt-6 border-l-2 border-brand-500 pl-4 text-[0.98rem] font-medium text-white/85 [animation-delay:200ms]">
            {hero.proof}
          </p>

          <div className="reveal mt-9 flex flex-wrap gap-3 [animation-delay:280ms]">
            <ButtonLink href="/contact" size="lg">
              Start a project
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/work" variant="ghost-dark" size="lg">
              View our work
            </ButtonLink>
          </div>
        </div>

        <dl className="reveal divide-y divide-white/12 border-t border-white/12 [animation-delay:320ms]">
          {hero.spec.map((s) => (
            <div key={s.k} className="flex items-baseline justify-between gap-6 py-4">
              <dt className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-white/40">
                {s.k}
              </dt>
              <dd className="text-right text-[0.88rem] text-white/80">{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
