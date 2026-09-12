import { Section, SectionHeading } from "@/components/ui/section";
import { techGroups } from "@/data/technologies";
import { TechIcon } from "@/components/ui/tech-icon";
import { Reveal } from "@/components/ui/reveal";

/**
 * Technology.
 *
 * Deliberately a quiet section. A grid of brand logos is the standard
 * treatment and it says nothing a buyer can use — every studio can list the
 * same fifteen marks. Grouping by the job each tool does makes the point that
 * matters instead: tools get picked per problem, and the studio is not tied
 * to any of them.
 *
 * Set in mono because these genuinely are technical names, not because small
 * text looks more serious in a monospace face.
 */
export function Technology({
  ground = "white",
}: {
  /** Set per page so the alternation stays correct wherever this is placed. */
  ground?: "paper" | "white";
} = {}) {
  return (
    <Section id="technology" ground={ground} size="md" labelledBy="tech-title">
      <SectionHeading
        id="tech-title"
        eyebrow="Technology"
        title="Technology that fits the job"
        dek="We do not force every project into the same stack. The recommendation follows the requirements — what the system has to do, what it must connect to, how it needs to perform, and who will maintain it after launch. WordPress is the right answer more often than developers like to admit, and the wrong one when a business needs software rather than pages."
      />

      <dl className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {techGroups.map((group, i) => (
          <div key={group.title} className="border-t border-rule pt-5">
            <Reveal delay={i * 55}>
              <dt className="text-[1.0625rem] font-semibold text-graphite">
                {group.title}
              </dt>
              <dd>
                <p className="mt-1.5 max-w-[36ch] text-[0.875rem] leading-relaxed text-muted">
                  {group.note}
                </p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li
                      key={item.name}
                      className="group/chip inline-flex items-center gap-1.5 rounded-sm border border-rule bg-white px-2 py-1 transition-colors hover:border-rule-strong"
                    >
                      {item.icon ? (
                        <TechIcon
                          icon={item.icon}
                          className="text-faint transition-colors group-hover/chip:text-accent"
                        />
                      ) : null}
                      <span className="font-mono text-[0.75rem] text-muted">
                        {item.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </dd>
            </Reveal>
          </div>
        ))}
      </dl>
    </Section>
  );
}
