import { ButtonLink } from "@/components/ui/button";
import { site } from "@/lib/site";

/**
 * Closing call to action.
 *
 * The previous site had one conversion path and it was at the very bottom of
 * a single long page. This one closes the argument rather than merely ending
 * the page: it says what the next step actually is, so nobody has to guess
 * what "get in touch" commits them to.
 *
 * No response-time promise is printed here. None has been confirmed, and an
 * unmet one costs more trust than it buys.
 */
export function ClosingCta() {
  return (
    <section
      className="on-ink bg-ink text-on-ink"
      aria-labelledby="closing-title"
    >
      <div className="shell">
        <div className="railed railed-inset py-24 md:py-32">
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-7">
              <h2
                id="closing-title"
                className="text-title max-w-[18ch] font-semibold text-white"
              >
                Tell us what you need built
              </h2>
              <p className="mt-6 max-w-[52ch] text-dek text-on-ink-muted">
                Send the project details and they go straight to the developer
                who would build it. No sales sequence and no qualification
                call — the next conversation is about the actual project. If it
                is not a fit, you will be told that instead.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink href="/contact" ground="ink" variant="solid">
                  Start a project
                </ButtonLink>
                <a
                  href={`mailto:${site.email}`}
                  className="inline-flex items-center justify-center rounded-sm border border-rule-ink-strong px-5 py-3 text-[0.9375rem] font-medium text-on-ink transition-colors hover:border-white hover:bg-white/5"
                >
                  Email directly
                </a>
              </div>
            </div>

            <dl className="grid gap-6 self-end sm:grid-cols-2 md:col-span-4 md:col-start-9">
              <div className="border-t border-rule-ink pt-4">
                <dt className="text-[0.9375rem] font-semibold text-white">
                  Fixed price
                </dt>
                <dd className="mt-1.5 text-[0.875rem] leading-relaxed text-on-ink-muted">
                  Agreed before work starts, and it does not move unless you
                  change the scope.
                </dd>
              </div>
              <div className="border-t border-rule-ink pt-4">
                <dt className="text-[0.9375rem] font-semibold text-white">
                  You own it
                </dt>
                <dd className="mt-1.5 text-[0.875rem] leading-relaxed text-on-ink-muted">
                  Code, accounts and documentation transfer to you on handover.
                  No lock-in.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
