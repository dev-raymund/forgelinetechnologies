import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/section";
import { getPublishedReviews } from "@/lib/reviews";

/**
 * Published client reviews.
 *
 * Renders nothing at all when there are none. An empty "what clients say"
 * section is worse than no section: it advertises that nobody has said
 * anything, and invents a gap the page did not have.
 *
 * The email address is never selected here, so it cannot reach the page by
 * accident.
 */
export async function Reviews() {
  const reviews = await getPublishedReviews(4);
  if (reviews.length === 0) return null;

  return (
    <Section ground="paper" size="lg" labelledBy="reviews-title">
      <SectionHeading
        id="reviews-title"
        eyebrow="In their words"
        title="What clients have said"
        dek="Published with permission, and unedited beyond the occasional typo. Every one is from a real project."
      />

      <ul className="grid gap-x-10 gap-y-10 md:grid-cols-2">
        {reviews.map((r) => (
          <li key={r.id} className="border-t border-rule pt-5">
            <p
              className="font-mono text-micro text-faint"
              aria-label={`${r.rating} out of 5`}
            >
              <span aria-hidden="true">
                {"★".repeat(r.rating)}
                {"☆".repeat(5 - r.rating)}
              </span>
            </p>
            <blockquote className="mt-3 max-w-[52ch] text-dek leading-relaxed text-graphite">
              {r.body}
            </blockquote>
            <p className="mt-4 text-[0.9375rem] font-medium text-graphite">
              {r.name}
              {r.company ? (
                <span className="font-normal text-muted"> · {r.company}</span>
              ) : null}
            </p>
            {r.projectSlug ? (
              <p className="mt-1">
                <Link
                  href={`/work/${r.projectSlug}`}
                  className="text-[0.875rem] text-muted underline decoration-rule-strong underline-offset-4 transition-colors hover:text-graphite hover:decoration-accent"
                >
                  {r.projectTitle}
                </Link>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}
