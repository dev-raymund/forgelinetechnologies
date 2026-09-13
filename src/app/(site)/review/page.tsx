import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/sections/page-header";
import { PageVisual } from "@/components/sections/page-visual";
import { Section } from "@/components/ui/section";
import { ReviewForm } from "@/components/forms/review-form";
import { getDb, projects } from "@/db";
import { withRetry } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Leave a review",
  description:
    "Worked with Forgeline? Tell us how it went. Reviews are read before anything is published.",
  alternates: { canonical: "/review" },
  // Useful to the people sent here, not something to compete for in search.
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const list = await withRetry(() =>
    getDb()
      .select({ id: projects.id, title: projects.title })
      .from(projects)
      .where(eq(projects.status, "published"))
      .orderBy(asc(projects.sortOrder)),
  );

  return (
    <>
      <PageHeader
        visual={<PageVisual variant="about" />}
        meta="Client review"
        title="Tell us how it went"
        dek="If we have built something for you, we would like to hear how it has held up — the useful parts and the awkward ones. It takes a couple of minutes."
      />

      <Section ground="paper" size="lg" labelledBy="review-form">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <h2 id="review-form" className="text-subtitle font-semibold text-graphite">
              Your review
            </h2>
            <div className="mt-8">
              <ReviewForm projects={list} />
            </div>
          </div>

          <div className="md:col-span-4 md:col-start-9">
            <h2 className="text-subtitle font-semibold text-graphite">
              What happens to it
            </h2>
            <ol className="mt-8 flex flex-col gap-6">
              {[
                ["01", "We read it", "Every review reaches us directly. Nothing is automated."],
                ["02", "Nothing is published automatically", "It stays private until a person decides otherwise."],
                ["03", "Your email is never shown", "It is used to reply to you, and for nothing else."],
                ["04", "You can change your mind", "Reply to us and we will take it down."],
              ].map(([n, title, body]) => (
                <li key={n}>
                  <span className="font-mono text-micro text-faint">{n}</span>
                  <h3 className="mt-2 text-[1.0625rem] font-semibold text-graphite">{title}</h3>
                  <p className="mt-1.5 max-w-[38ch] text-[0.9375rem] leading-relaxed text-muted">
                    {body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>
    </>
  );
}
