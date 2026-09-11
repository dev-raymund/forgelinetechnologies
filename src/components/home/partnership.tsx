import { Section } from "@/components/ui/section";
import { partner } from "@/lib/site";

/**
 * Partnership.
 *
 * Kept small on purpose. The brief is explicit that this must not dominate
 * the homepage, and the job it has to do is narrow: tell a visitor that
 * broader capability is reachable without implying Forgeline is a department
 * of something else.
 *
 * No claim is made about ownership or structure, because none has been
 * confirmed. "Partner companies" is the whole of what is known.
 *
 * Wording is written from scratch — none of TechZQuad's own copy is reused.
 */
export function Partnership() {
  return (
    <Section ground="paper" size="sm" labelledBy="partner-title">
      <div className="border border-rule bg-white p-7 md:p-10">
        <div className="grid gap-8 md:grid-cols-12 md:items-start md:gap-10">
          <div className="md:col-span-5">
            <h2
              id="partner-title"
              className="text-subtitle font-semibold text-graphite"
            >
              Part of a wider technology ecosystem
            </h2>
            <p className="mt-3 max-w-[40ch] text-[0.9375rem] leading-relaxed text-muted">
              Forgeline and {partner.name} are partner companies covering
              different ground. Forgeline builds the digital product;{" "}
              {partner.name} handles the wider business technology around it.
              Where a project needs both, you can draw on both without finding
              a second supplier and then managing the gap between them.
            </p>
          </div>

          <dl className="grid gap-6 sm:grid-cols-2 md:col-span-6 md:col-start-7">
            <div className="border-t border-graphite/80 pt-4">
              <dt className="text-[0.9375rem] font-semibold text-graphite">
                Forgeline
              </dt>
              <dd className="mt-1.5 text-[0.875rem] leading-relaxed text-muted">
                Digital product and web engineering — websites, applications,
                commerce, APIs and custom software.
              </dd>
            </div>
            <div className="border-t border-rule-strong pt-4">
              <dt className="text-[0.9375rem] font-semibold text-graphite">
                <a
                  href={partner.url}
                  className="underline decoration-rule-strong underline-offset-4 transition-colors hover:text-graphite hover:decoration-accent"
                >
                  {partner.name}
                </a>
              </dt>
              <dd className="mt-1.5 text-[0.875rem] leading-relaxed text-muted">
                {partner.summary}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </Section>
  );
}
