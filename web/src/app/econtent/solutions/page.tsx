import Link from "next/link";
import SectionHead from "../_components/ec-section-head";
import PlaceholderNotice from "../_components/ec-placeholder";
import Wave from "../_components/ec-wave";
import EcIcon from "../_components/ec-icon";
import { services, processSteps } from "../_data";

export const metadata = { title: "Solutions" };

export default function SolutionsPage() {
  return (
    <>
      <section className="ec-page-head ec-has-wave">
        <div className="ec-wrap">
          <h1>Solutions</h1>
          <p>
            Build, automate, or take over something that already exists — here is what each of
            those actually involves.
          </p>
        </div>
        <Wave fill="#ffffff" />
      </section>

      <PlaceholderNotice />

      <section className="ec-section">
        <div className="ec-wrap ec-grid" style={{ gap: 28 }}>
          {services.map((s, i) => (
            <article
              className="ec-card"
              key={s.slug}
              id={s.slug}
              style={{ scrollMarginTop: 90 }}
            >
              <div className="ec-grid ec-grid-2" style={{ gap: 32, alignItems: "start" }}>
                <div>
                  <div className="ec-card-icon" aria-hidden="true">
                    <EcIcon name={s.icon} />
                  </div>
                  <span className="ec-tag">{String(i + 1).padStart(2, "0")}</span>
                  <h2 style={{ fontSize: 28 }}>{s.title}</h2>
                  <p>{s.summary}</p>
                  <Link className="ec-btn ec-btn-ghost ec-btn-sm" href="/econtent/contact">
                    Ask about this
                  </Link>
                </div>
                <ul className="ec-feat" style={{ marginTop: 0 }}>
                  {s.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ec-section ec-band">
        <div className="ec-wrap">
          <SectionHead kicker="Process" title="The same four stages, whatever the project" center />
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
    </>
  );
}
