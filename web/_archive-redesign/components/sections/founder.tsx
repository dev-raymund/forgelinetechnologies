import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { founder } from "@/lib/content";

/**
 * Editorial profile, not a hero portrait.
 *
 * The story leads and holds the wider column; the portrait is capped at a
 * fixed max-width so it can never grow into the section, and is treated the
 * way a design publication would treat a contributor photo — desaturated at
 * rest, hairline frame, mono caption and a small metadata rail beneath.
 */
export default function Founder() {
  return (
    <section className="border-t border-line bg-paper py-section">
      <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_0.7fr] lg:gap-20">
          {/* story first */}
          <div>
            <p className="eyebrow">Who you&rsquo;re working with</p>
            <h2 className="mt-5 max-w-[19ch] text-h2 font-semibold">
              Forgeline exists because handovers kept going badly.
            </h2>
            <div className="mt-6 flex max-w-[56ch] flex-col gap-4 leading-relaxed">
              {founder.bio.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <ButtonLink href="/about" variant="ghost" className="mt-8">
              More about Forgeline
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>

          {/* supporting portrait — deliberately capped */}
          <figure className="max-w-[15.5rem] lg:pt-1">
            <div className="group relative aspect-[4/5] overflow-hidden rounded-[3px] border border-line bg-paper-100">
              <Image
                src={founder.photo}
                alt={`${founder.name}, ${founder.role} at Forgeline Technologies`}
                fill
                sizes="248px"
                className="object-cover object-top grayscale-[0.55] transition-[filter,transform] duration-700 ease-out group-hover:scale-[1.02] group-hover:grayscale-0"
              />
            </div>
            <figcaption className="mt-4">
              <p className="font-display text-[0.98rem] font-semibold tracking-[-0.02em] text-ink-900">
                {founder.name}
              </p>
              <p className="mt-0.5 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-muted">
                {founder.role}
              </p>
              <dl className="mt-4 border-t border-line pt-3">
                {founder.credentials.map((c) => (
                  <div key={c} className="border-b border-line py-2 last:border-b-0">
                    <dd className="text-[0.8rem] leading-snug text-copy">{c}</dd>
                  </div>
                ))}
              </dl>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
