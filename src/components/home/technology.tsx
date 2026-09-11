import { Section, SectionHeading } from "@/components/ui/section";
import { techGroups } from "@/data/technologies";

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
export function Technology() {
  return (
    <Section id="technology" ground="white" size="md" labelledBy="tech-title">
      <SectionHeading
        id="tech-title"
        title="Tools chosen per problem"
        dek="No stack is right for every project. WordPress is the correct answer more often than developers like to admit, and it is the wrong one when a business needs software rather than pages."
      />

      <dl className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {techGroups.map((group) => (
          <div key={group.title} className="border-t border-rule pt-5">
            <dt className="text-[1.0625rem] font-semibold text-graphite">
              {group.title}
            </dt>
            <dd>
              <p className="mt-1.5 max-w-[36ch] text-[0.875rem] leading-relaxed text-muted">
                {group.note}
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
                {group.items.map((item) => (
                  <li
                    key={item.name}
                    className="font-mono text-[0.75rem] text-faint"
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
