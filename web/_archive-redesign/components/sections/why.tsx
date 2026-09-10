import GridMotif from "@/components/ui/grid-motif";
import { differentiators } from "@/lib/content";

/**
 * The ink band that breaks the light rhythm, and the strongest argument on the
 * page — so the statements are set large and carry themselves, with the
 * supporting line kept deliberately quieter beneath.
 */
export default function Why() {
  return (
    <section className="on-dark relative overflow-hidden bg-ink-950 py-section-loose text-white/60">
      <GridMotif size={88} />
      <div className="relative mx-auto max-w-[76rem] px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow">Why Forgeline</p>
            <h2 className="mt-6 max-w-[13ch] text-h1 font-semibold text-white">
              Fewer people between you and the code.
            </h2>
            <p className="mt-7 max-w-[40ch] leading-relaxed">
              Most agency cost isn&rsquo;t engineering — it&rsquo;s coordination. Forgeline is
              built to remove that layer rather than bill you for it.
            </p>
          </div>

          <ul className="border-t border-white/12">
            {differentiators.map((d, i) => (
              <li
                key={d.title}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-5 border-b border-white/12 py-8"
              >
                <span className="pt-2 font-mono text-[0.72rem] text-white/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-[clamp(1.35rem,2.1vw,1.75rem)] font-semibold leading-[1.15] tracking-[-0.025em] text-white">
                    {d.title}
                  </h3>
                  <p className="mt-3 max-w-[54ch] text-[0.95rem] leading-relaxed">{d.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
