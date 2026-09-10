import { stats } from "@/lib/content";

/**
 * Editorial statistics band: oversized numerals on a hairline grid, not four
 * cards. Rendered as plain text rather than JS count-ups — the live site
 * animates these from zero, so no-JS visitors and every first paint saw
 * "0 years / 0 projects", which is the opposite of a credibility section.
 */
export default function Credibility() {
  return (
    <section
      className="border-b border-line bg-paper"
      aria-label="Forgeline by the numbers"
    >
      <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={[
                "py-9 lg:py-11",
                // hairline verticals between cells, per breakpoint
                i % 2 === 1 ? "border-l border-line pl-6 lg:pl-10" : "pr-6",
                i > 1 ? "border-t border-line lg:border-t-0" : "",
                i > 0 ? "lg:border-l lg:pl-10" : "",
              ].join(" ")}
            >
              <p className="font-display text-[clamp(1.9rem,3vw,2.6rem)] font-semibold leading-[1] tracking-[-0.035em] tabular-nums text-ink-900">
                {s.value}
              </p>
              <p className="mt-3 font-mono text-[0.64rem] uppercase leading-[1.5] tracking-[0.16em] text-ink-800">
                {s.label}
              </p>
              <p className="mt-1 text-[0.78rem] text-muted">{s.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
