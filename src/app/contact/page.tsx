import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/sections/page-header";
import { Section } from "@/components/ui/section";
import { ContactForm } from "@/components/forms/contact-form";
import { site, marketsSentence } from "@/lib/site";

export const metadata: Metadata = {
  title: "Start a project",
  description:
    "Send your project details and get a reply from the developer who would build it. Free scoping call, then a fixed scope and a fixed price before any code is written.",
  alternates: { canonical: "/contact" },
};

/**
 * Contact.
 *
 * The brief is explicit that a visitor should understand what happens after
 * they submit, so the steps sit beside the form rather than in a confirmation
 * they only see once it is too late to change their mind.
 *
 * No response-time promise is printed. None has been confirmed, and a missed
 * one costs more trust than the promise was worth.
 */
const whatHappens = [
  {
    step: "01",
    title: "You send the details",
    body: "Enough to tell whether it is a fit. No form fields you would have to invent an answer to.",
  },
  {
    step: "02",
    title: "You get a reply from the developer",
    body: "Not a sales sequence, and not an account manager. If it is not a fit, you will be told that rather than sold to.",
  },
  {
    step: "03",
    title: "A free scoping call",
    body: "We work out what the project actually has to do. No obligation and nothing to sign.",
  },
  {
    step: "04",
    title: "A fixed scope and a fixed price",
    body: "In writing, before any code is written. You decide from there.",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        meta="Start a project"
        title="Tell us what you need built"
        dek="The more you can say about what the project has to do, the more useful the first reply will be. If you are still working that out, say so — scoping it is part of the job."
      />

      <Section ground="paper" size="lg" labelledBy="form-title">
        <div className="grid gap-12 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            <h2
              id="form-title"
              className="text-subtitle font-semibold text-graphite"
            >
              Project details
            </h2>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>

          <div className="md:col-span-4 md:col-start-9">
            <h2 className="text-subtitle font-semibold text-graphite">
              What happens next
            </h2>
            <ol className="mt-8 flex flex-col">
              {whatHappens.map((item) => (
                <li
                  key={item.step}
                  className="border-t border-rule py-5 last:border-b"
                >
                  <span className="font-mono text-micro text-signal">
                    {item.step}
                  </span>
                  <h3 className="mt-2 text-[1.0625rem] font-semibold text-graphite">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-10">
              <h3 className="text-[1.0625rem] font-semibold text-graphite">
                Rather just email?
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                <a
                  href={`mailto:${site.email}`}
                  className="break-words text-graphite underline decoration-rule-strong underline-offset-4 transition-colors hover:text-signal hover:decoration-signal"
                >
                  {site.email}
                </a>
              </p>
              <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted">
                Working with businesses in {marketsSentence}.
              </p>
              <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted">
                Want to know the cost first?{" "}
                <Link
                  href="/pricing"
                  className="text-graphite underline decoration-rule-strong underline-offset-4 transition-colors hover:text-signal hover:decoration-signal"
                >
                  Pricing is published
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
