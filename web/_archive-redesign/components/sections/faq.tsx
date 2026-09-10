import { Plus } from "lucide-react";
import { faqs } from "@/lib/content";

/**
 * Native <details>/<summary>: keyboard-operable and screen-reader-announced
 * with zero JavaScript. An ARIA accordion would be more code and strictly
 * worse. Content can't transition from display:none, so the open state fades
 * the answer in instead — fast, and killed under reduced-motion.
 */
export default function Faq() {
  return (
    <section className="border-t border-line bg-paper py-section-tight">
      <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.6fr] lg:gap-24">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow">Questions</p>
            <h2 className="mt-6 max-w-[11ch] text-h1 font-semibold">
              Asked before every project.
            </h2>
          </div>

          <div className="border-t border-line">
            {faqs.map((f) => (
              <details key={f.q} className="faq-item group border-b border-line">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-8 py-7 text-left [&::-webkit-details-marker]:hidden">
                  <h3 className="text-[clamp(1.1rem,1.6vw,1.32rem)] font-semibold leading-[1.3] tracking-[-0.02em] text-ink-900 transition-colors duration-200 group-hover:text-brand-600">
                    {f.q}
                  </h3>
                  <Plus
                    className="mt-1 h-4 w-4 shrink-0 text-muted transition-transform duration-300 ease-out group-open:rotate-45 group-hover:text-brand-600"
                    aria-hidden="true"
                  />
                </summary>
                <p className="faq-answer max-w-[62ch] pb-7 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
