import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/ui/section";
import { founder } from "@/lib/site";

/**
 * Founder.
 *
 * Editorial introduction, not a profile page. The portrait is held to a
 * narrow column: the brief is explicit that the story matters more than the
 * picture, and a large founder photograph on a homepage reads as vanity
 * rather than credibility.
 *
 * Written in the first person because it is one person's account of why the
 * studio exists. Every claim here is one the previous site already made.
 */
export function Founder() {
  return (
    <Section ground="white" size="lg" labelledBy="founder-title">
      <div className="grid gap-10 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-3">
          <div className="relative aspect-[4/5] w-40 overflow-hidden border border-rule bg-paper sm:w-48 md:w-full md:max-w-[15rem]">
            <Image
              src={founder.photo}
              alt={founder.photoAlt}
              fill
              sizes="(min-width: 768px) 15rem, 12rem"
              className="object-cover"
            />
          </div>
          <p className="mt-4 text-[0.9375rem] font-semibold text-graphite">
            {founder.name}
          </p>
          <p className="font-mono text-micro text-faint">{founder.role}</p>
        </div>

        <div className="md:col-span-8 md:col-start-5">
          <h2
            id="founder-title"
            className="text-title max-w-[20ch] font-semibold text-graphite"
          >
            Why this studio exists
          </h2>

          <div className="mt-7 max-w-[62ch] space-y-5 text-dek leading-relaxed text-muted">
            <p>
              Over six years working with agencies and enterprise teams across
              Australia and New Zealand, I kept watching the same projects fail
              the same way. They ran over budget. They shipped something that
              did not match what the business actually needed. Some never
              launched at all. The ones that did were handed over badly enough
              that nobody could maintain them afterwards.
            </p>
            <p>
              Almost none of it was a technical problem. It was distance —
              between the person who understood the requirement and the person
              writing the code, with enough people in between that the brief
              arrived unrecognisable.
            </p>
            <p className="text-graphite">
              Forgeline is the correction. Scope agreed before work starts.
              A price you approve up front. The developer you brief is the
              developer who builds it. Clean code, a clean handover, and a
              product that actually goes live.
            </p>
          </div>

          <Link
            href="/about"
            className="mt-8 inline-block text-[0.9375rem] font-medium text-graphite underline decoration-rule-strong underline-offset-[6px] transition-colors hover:text-signal hover:decoration-signal"
          >
            More about the studio
          </Link>
        </div>
      </div>
    </Section>
  );
}
