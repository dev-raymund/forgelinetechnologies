import { ButtonLink } from "@/components/ui/button";
import { stats, marketsSentence } from "@/lib/site";
import { HeroVisual } from "@/components/home/hero-visual";
import { ArrowRight, Search } from "@/components/ui/icon";
import { Counter } from "@/components/ui/counter";

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
        <div className="railed railed-inset pt-20 pb-14 md:pt-28 md:pb-20">
          <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
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
                  Forgeline Technologies builds and supports websites, web
                  applications, e-commerce and custom software for businesses
                  that need technology to work properly — with the scope and
                  the price agreed before development starts, and direct
                  access to the people building it.
                </p>
              </div>

              <div
                className="rise mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
                style={{ animationDelay: "440ms" }}
              >
                <ButtonLink
                  href="/contact"
                  ground="ink"
                  variant="solid"
                  icon={<ArrowRight />}
                >
                  Start a project
                </ButtonLink>
                {/* Two entry points, deliberately. Half the market knows what it
                  wants built; the other half knows something is wrong and
                  cannot specify it. "Start a project" only serves the first. */}
                <ButtonLink
                  href="/build-audit"
                  ground="ink"
                  variant="outline"
                  icon={<Search />}
                >
                  Book a Build Audit
                </ButtonLink>
              </div>
            </div>

            {/* Hidden below lg. On a phone the hero should get to the point,
                and a schematic this detailed would be unreadable at 390px
                while pushing the actual proposition off the screen. */}
            <div className="hidden text-white lg:col-span-5 lg:block">
              <HeroVisual />
            </div>
          </div>
        </div>
      </div>

      {/* Credibility band. Sits inside the dark block rather than below it, so
          the figures read as part of the opening statement. */}
      <div className="border-t border-rule-ink">
        <div className="shell">
          <div className="railed railed-inset py-8 md:py-10">
            <dl className="grid grid-cols-3 gap-x-6 gap-y-7 sm:gap-x-8">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse">
                  <dt className="mt-1.5 text-[0.8125rem] text-on-ink-muted">
                    {stat.label}
                  </dt>
                  <dd className="font-mono text-[1.75rem] font-medium tracking-tight text-white md:text-[2rem]">
                    <Counter value={stat.value} />
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
