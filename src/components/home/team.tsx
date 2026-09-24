import { Section, SectionHeading } from "@/components/ui/section";
import { People } from "@/components/sections/people";

/**
 * The people, on the homepage.
 *
 * The site argues it is an engineering team rather than a developer for hire,
 * and an argument like that is cheap until the team has faces and names. This
 * is where the claim gets evidence.
 *
 * It runs `People` in its compact density: faces, names and roles, and nothing
 * more. What each person actually does belongs on About, where a reader has
 * asked for it. Showing a different set of people in the two places would be
 * worse than showing none, which is why both read from the same list.
 */
export function Team() {
  return (
    <Section ground="white" size="md" labelledBy="team-title">
      <SectionHeading
        id="team-title"
        eyebrow="The team"
        title="The people who would build it"
        dek="A small team, and you work with all of it. You know who you are talking to, who is coordinating the work, and who is writing the code."
      />
      <People compact />
    </Section>
  );
}
