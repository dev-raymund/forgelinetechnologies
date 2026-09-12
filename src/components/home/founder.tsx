import Link from "next/link";
import { Section } from "@/components/ui/section";
import { People } from "@/components/sections/people";
import { founder } from "@/lib/site";

/**
 * Why the studio exists, and who is behind it.
 *
 * Editorial introduction, not a profile page. The large founder portrait that
 * used to sit beside this story is gone: the same face appeared again in the
 * row below, and a three-person studio showing one person big and two small
 * reads as a founder plus staff rather than a team.
 *
 * Written in the first person because it is one person's account of why the
 * studio exists. Every claim here is one the previous site already made.
 */
export function Founder() {
  return (
    <Section ground="white" size="lg" labelledBy="founder-title">
      <div className="grid gap-10 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-4">
          <h2
            id="founder-title"
            className="text-title max-w-[16ch] font-semibold text-graphite"
          >
            Why this studio exists
          </h2>
        </div>

        <div className="md:col-span-7 md:col-start-6">
          <div className="max-w-[62ch] space-y-5 text-dek leading-relaxed text-muted">
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
              Forgeline is the correction. Scope agreed before work starts. A
              price you approve up front. The developer you brief is the
              developer who builds it. Clean code, a clean handover, and a
              product that actually goes live.
            </p>
          </div>

          {/* The story is first person, so it needs an author. */}
          <p className="mt-7 text-[0.9375rem] font-semibold text-graphite">
            {founder.name}
          </p>
          <p className="font-mono text-micro text-faint">{founder.role}</p>
        </div>
      </div>

      {/* The same three people as About, at homepage density — faces, names
          and jobs. What each of them actually does is the thing About adds,
          which is what the link below is for. */}
      <People compact />

      <Link
        href="/about"
        className="mt-9 inline-block text-[0.9375rem] font-medium text-graphite underline decoration-rule-strong underline-offset-[6px] transition-colors hover:decoration-accent"
      >
        More about the studio
      </Link>
    </Section>
  );
}
