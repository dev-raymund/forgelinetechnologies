import { techStack, techPhilosophy } from "@/lib/content";

/**
 * Rows, not a logo wall: the grouping is the argument. Each row is a hairline
 * entry with the category as a mono label and the technologies set inline as
 * text — which reads as an engineering inventory rather than a badge parade.
 */
export default function Tech() {
  return (
    <section className="border-t border-line bg-paper py-section-tight">
      <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-end">
          <div>
            <p className="eyebrow">Engineering</p>
            <h2 className="mt-6 max-w-[14ch] text-h1 font-semibold">
              {techPhilosophy.heading}
            </h2>
          </div>
          <p className="max-w-[46ch] text-[1.02rem] leading-relaxed lg:pb-2">
            {techPhilosophy.body}
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {techPhilosophy.criteria.map((c) => (
              <li key={c} className="flex items-center gap-2 text-[0.85rem] text-muted">
                <span className="h-1 w-1 rounded-full bg-brand-500" aria-hidden="true" />
                {c}
              </li>
            ))}
          </ul>
        </div>

        <dl className="mt-16 border-t border-line">
          {techStack.map((g) => (
            <div
              key={g.group}
              className="grid items-baseline gap-x-10 gap-y-3 border-b border-line py-7 md:grid-cols-[13rem_minmax(0,1fr)]"
            >
              <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted">
                {g.group}
              </dt>
              <dd className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {g.items.map((t, i) => (
                  <span key={t} className="flex items-center gap-3">
                    {i > 0 && (
                      <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
                    )}
                    <span className="text-[1.02rem] text-ink-800">{t}</span>
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
