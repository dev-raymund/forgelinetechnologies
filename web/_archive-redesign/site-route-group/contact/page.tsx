import type { Metadata } from "next";
import { Mail, Clock, FileText, ShieldCheck } from "lucide-react";
import PageHero from "@/components/site/page-hero";
import InquiryForm from "@/components/forms/inquiry-form";
import { site, engagements, contactCopy } from "@/lib/content";

export const metadata: Metadata = {
  title: "Start a project",
  description:
    "Start a web development project with Forgeline. Send the details, get a free 20-minute scoping call and a fixed quote. We reply within one business day.",
  alternates: { canonical: "/contact" },
};

const expectations = [
  {
    icon: Clock,
    title: "A reply within a day",
    body: "One business day, from the person who'd do the work — not an autoresponder.",
  },
  {
    icon: FileText,
    title: "A free 20-minute call",
    body: "Enough to understand the problem and tell you whether we're the right fit.",
  },
  {
    icon: ShieldCheck,
    title: "A fixed quote",
    body: "A number you can plan around before anything starts. No hourly surprises.",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Start a project"
        title={contactCopy.heading}
        lede={contactCopy.lede}
      />

      <section className="bg-paper py-section">
        <div className="mx-auto max-w-[76rem] px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">
                What happens next
              </h2>
              <ul className="mt-6 flex flex-col gap-7">
                {expectations.map((e) => (
                  <li key={e.title} className="flex gap-4">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] border border-line text-brand-600">
                      <e.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-[1rem] font-semibold text-ink-900">{e.title}</h3>
                      <p className="mt-1 max-w-[36ch] text-[0.93rem] leading-relaxed">{e.body}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-10 border-t border-line pt-8">
                <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">
                  Prefer email
                </h2>
                <a
                  href={`mailto:${site.email}`}
                  className="mt-4 inline-flex items-center gap-2 text-[0.98rem] font-medium text-ink-900 underline-offset-4 hover:text-brand-600 hover:underline"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {site.email}
                </a>
              </div>

              <div className="mt-10 border-t border-line pt-8">
                <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted">
                  Starting prices
                </h2>
                <dl className="mt-4 flex flex-col gap-2.5">
                  {engagements.map((e) => (
                    <div key={e.slug} className="flex items-baseline justify-between gap-4 text-[0.92rem]">
                      <dt className="text-copy">{e.name}</dt>
                      <dd className="font-medium text-ink-900">
                        from {e.price}
                        <span className="text-muted"> / {e.cadence}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <InquiryForm />
          </div>
        </div>
      </section>
    </>
  );
}
