import { process } from "@/lib/content";

/**
 * Horizontal progression on desktop, vertical on mobile. The connecting rule
 * is drawn once per step rather than as one absolute overlay, so it reflows
 * correctly at every breakpoint instead of floating over the content.
 */
export default function Process() {
  return (
    <section className="border-t border-line bg-paper-50 py-section-tight">
      <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
        <div className="max-w-[36rem]">
          <p className="eyebrow">How it runs</p>
          <h2 className="mt-6 text-h1 font-semibold">Four stages. No black-box months.</h2>
          <p className="mt-6 leading-relaxed">
            You can open the staging URL at any point. Nothing disappears for six weeks
            and comes back as a surprise.
          </p>
        </div>

        <ol className="mt-16 grid gap-y-10 md:grid-cols-4 md:gap-x-8">
          {process.map((s) => (
            <li key={s.n} className="group relative">
              {/* mobile: vertical rule down the left. desktop: horizontal rule on top. */}
              <div className="border-l border-line-strong pl-6 md:border-l-0 md:border-t md:pl-0 md:pt-8">
                <span
                  aria-hidden="true"
                  className="absolute left-[-4.5px] top-1.5 h-[9px] w-[9px] rounded-full bg-brand-600 ring-4 ring-paper-50 md:left-0 md:top-[-4.5px]"
                />
                <p className="font-mono text-[0.72rem] tracking-[0.12em] text-muted">{s.n}</p>
                <h3 className="mt-3 text-[1.3rem] font-semibold tracking-[-0.02em]">
                  {s.title}
                </h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
