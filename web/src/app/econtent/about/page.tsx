import Link from "next/link";
import SectionHead from "../_components/ec-section-head";
import PlaceholderNotice from "../_components/ec-placeholder";
import Wave from "../_components/ec-wave";
import { brand, stats, values, processSteps } from "../_data";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <section className="ec-page-head ec-has-wave">
        <div className="ec-wrap">
          <h1>About {brand.name}</h1>
          <p>
            A small senior team that builds and maintains software for businesses who need a
            partner rather than a vendor.
          </p>
        </div>
        <Wave fill="#ffffff" />
      </section>

      <PlaceholderNotice />

      <section className="ec-section">
        <div className="ec-wrap ec-grid ec-grid-2" style={{ gap: 48, alignItems: "start" }}>
          <div>
            <span className="ec-kicker">Our story</span>
            <h2>Started because handovers kept going badly</h2>
            <p>
              Placeholder copy. Two or three paragraphs on why the company exists, who started it
              and what you kept seeing go wrong that you decided to fix.
            </p>
            <p>
              Keep it concrete and specific to you — this is the page prospects read right before
              they decide whether to email, and generic agency history is the fastest way to lose
              them.
            </p>
          </div>
          <div className="ec-stats" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {stats.map((s) => (
              <div className="ec-stat" key={s.label}>
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ec-section ec-band">
        <div className="ec-wrap">
          <SectionHead kicker="How we work" title="Three things we hold to" center />
          <div className="ec-grid ec-grid-3">
            {values.map((v) => (
              <article className="ec-card" key={v.title}>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ec-section">
        <div className="ec-wrap">
          <SectionHead
            kicker="Process"
            title="What working together looks like"
            body="Four stages, each with something you can look at before the next one starts."
            center
          />
          <div className="ec-grid ec-grid-4">
            {processSteps.map((step) => (
              <article className="ec-card" key={step.n}>
                <div className="ec-card-icon" aria-hidden="true">
                  <strong>{step.n}</strong>
                </div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ec-section ec-dark">
        <div className="ec-wrap" style={{ textAlign: "center" }}>
          <h2>Want to talk it through?</h2>
          <p style={{ maxWidth: "52ch", margin: "0 auto 28px" }}>
            A 20-minute call is usually enough to tell whether there is a project here.
          </p>
          <Link className="ec-btn" href="/econtent/contact">
            Get in touch
          </Link>
        </div>
      </section>
    </>
  );
}
