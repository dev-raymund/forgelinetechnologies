import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRight, Search, Mail } from "@/components/ui/icon";
import { site } from "@/lib/site";

/**
 * Closing call to action, with two doors.
 *
 * The previous version offered one: "Start a project". That only serves people
 * who have already decided what to build. A large share of enquiries come from
 * the other half — someone knows the site is slow, or that the team is
 * re-typing the same data every week, and cannot turn that into a brief.
 * Asking them to "start a project" asks them to do the hardest part first.
 *
 * So: one path for people who know, one for people who do not. Both land in
 * the same place; the difference is what the visitor has to have worked out
 * before they feel allowed to click.
 *
 * No response-time promise. None has been confirmed, and an unmet one costs
 * more than it buys.
 */
export function ClosingCta() {
  return (
    <section
      className="on-ink bg-ink text-on-ink"
      aria-labelledby="closing-title"
    >
      <div className="shell">
        <div className="railed railed-inset py-24 md:py-32">
          <h2
            id="closing-title"
            className="text-title max-w-[20ch] font-semibold text-white"
          >
            Two ways to start
          </h2>

          <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-10">
            <div className="border-t-2 border-accent pt-6">
              <p className="font-mono text-micro text-accent">
                You know what you need
              </p>
              <h3 className="mt-3 text-subtitle font-semibold text-white">
                Start a project
              </h3>
              <p className="mt-3 max-w-[44ch] text-[0.9375rem] leading-relaxed text-on-ink-muted">
                Send the details and you get a reply from the developer who
                would build it. If it is a fit, the next step is a call and a
                fixed quote. If it is not, you will be told that instead.
              </p>
              <div className="mt-7">
                <ButtonLink
                  href="/contact"
                  ground="ink"
                  variant="solid"
                  icon={<ArrowRight />}
                >
                  Start a project
                </ButtonLink>
              </div>
            </div>

            <div className="border-t border-rule-ink pt-6">
              <p className="font-mono text-micro text-on-ink-muted">
                You know something is wrong
              </p>
              <h3 className="mt-3 text-subtitle font-semibold text-white">
                Book a Build Audit
              </h3>
              <p className="mt-3 max-w-[44ch] text-[0.9375rem] leading-relaxed text-on-ink-muted">
                For when the problem is clear but the right solution is not. We
                establish what is actually wrong, what is worth keeping and
                what to do first — before anyone quotes you for a rebuild.
              </p>
              <div className="mt-7">
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
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-rule-ink pt-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[52ch] text-[0.9375rem] text-on-ink-muted">
              Either way: a fixed price agreed before work starts, and you own
              everything at the end of it.
            </p>
            {site.email ? (
              <a
                href={`mailto:${site.email}`}
                className="inline-flex shrink-0 items-center gap-2 text-[0.9375rem] font-medium text-on-ink underline decoration-rule-ink-strong underline-offset-4 transition-colors hover:decoration-accent"
              >
                Email directly
                <Mail />
              </a>
            ) : (
              <Link
                href="/pricing"
                className="shrink-0 text-[0.9375rem] font-medium text-on-ink underline decoration-rule-ink-strong underline-offset-4 transition-colors hover:decoration-accent"
              >
                View pricing
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
