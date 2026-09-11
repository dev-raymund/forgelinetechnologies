import { ButtonLink } from "@/components/ui/button";
import { stats, marketsSentence } from "@/lib/site";

/**
 * Hero.
 *
 * Typography-led, on the dark ground the brief asks for. The headline runs as
 * two statements: what the studio builds, then who builds it. The second is
 * the actual differentiator, so it gets its own sentence at display size
 * rather than being demoted to the paragraph underneath.
 *
 * The right-hand side is deliberately empty. Asymmetry here comes from space
 * rather than from a decorative object, which is both more confident and one
 * less thing to load.
 *
 * This is the page's single orchestrated motion moment — a short stagger on
 * load and nothing else. `prefers-reduced-motion` is honoured globally.
 *
 * The figures are real and rendered as text. The previous site animated them
 * up from a literal 0 in the HTML, so crawlers and no-JS visitors saw a studio
 * claiming six years of nothing.
 */
export function Hero() {
  return (
    <section className="on-ink bg-ink text-on-ink" aria-labelledby="hero-title">
      <div className="shell">
        <div className="railed railed-inset pt-20 pb-14 md:pt-32 md:pb-20">
          <h1
            id="hero-title"
            className="text-display max-w-[19ch] font-semibold text-white"
          >
            <span className="rise block" style={{ animationDelay: "60ms" }}>
              Websites, web applications and custom software.
            </span>
            {/* Subordinate by size, not just by colour. Two sentences set at
                the same scale compete; the differentiator reads better as the
                answering clause than as a second shout. */}
            <span
              className="rise mt-[0.28em] block text-[0.62em] font-normal tracking-[-0.02em] text-on-ink-muted"
              style={{ animationDelay: "200ms" }}
            >
              Built by the developer you brief.
            </span>
          </h1>

          <div
            className="rise mt-10 max-w-[56ch]"
            style={{ animationDelay: "340ms" }}
          >
            <p className="text-dek text-on-ink-muted">
              Forgeline is a web engineering studio. You get a fixed scope, a
              fixed price, and direct access to the person writing the code —
              from the first call through to the day it goes live.
            </p>
          </div>

          <div
            className="rise mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ animationDelay: "440ms" }}
          >
            <ButtonLink href="/contact" ground="ink" variant="solid">
              Start a project
            </ButtonLink>
            <ButtonLink href="/work" ground="ink" variant="outline">
              View our work
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Credibility band. Sits inside the dark block rather than below it, so
          the figures read as part of the opening statement. */}
      <div className="border-t border-rule-ink">
        <div className="shell">
          <div className="railed railed-inset py-8 md:py-10">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-7 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block font-mono text-[1.75rem] font-medium tracking-tight text-white md:text-[2rem]">
                      {stat.value}
                    </span>
                    <span className="mt-1.5 block text-[0.8125rem] text-on-ink-muted">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 text-[0.8125rem] text-on-ink-muted">
              Work delivered in {marketsSentence}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
