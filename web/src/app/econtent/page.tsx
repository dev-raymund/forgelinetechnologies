import type { Metadata } from "next";
import Link from "next/link";
import SectionHead from "./_components/ec-section-head";
import EcIcon from "./_components/ec-icon";
import Wave from "./_components/ec-wave";
import PlaceholderNotice from "./_components/ec-placeholder";
import {
  brand,
  stats,
  services,
  clients,
  testimonials,
  projects,
  episodes,
  articles,
  formatDate,
} from "./_data";

// `absolute` bypasses BOTH title templates — this layout's and the root
// Forgeline one above it. Without it the home title picks up the parent's
// "%s — Forgeline Technologies" suffix.
export const metadata: Metadata = {
  title: { absolute: `${brand.name} — ${brand.tagline}` },
  description: brand.blurb,
};

export default function EcontentHome() {
  return (
    <>
      {/* hero */}
      <section className="ec-hero ec-has-wave">
        <div className="ec-wrap ec-hero-inner">
          <div>
            <span className="ec-badge">
              <span className="ec-ping" aria-hidden="true" /> Taking projects for Q4
            </span>
            <h1>{brand.tagline}</h1>
            <p className="ec-lede">{brand.blurb}</p>
            <div className="ec-hero-cta">
              <Link className="ec-btn" href="/econtent/contact">
                Start a project
              </Link>
              <Link className="ec-btn ec-btn-ghost" href="/econtent/solutions">
                See what we do
              </Link>
            </div>
          </div>

          <div className="ec-hero-panel" aria-hidden="true">
            <div className="ec-hero-panel-bar">
              <span />
              <span />
              <span />
            </div>
            {[
              ["Discovery call booked", "day 1"],
              ["Scope + fixed quote sent", "day 3"],
              ["Design signed off", "week 2"],
              ["Staging URL live", "week 3"],
              ["Launched & monitored", "week 6"],
            ].map(([label, when]) => (
              <div className="ec-hero-row" key={label}>
                <span className="ec-hero-tick">✓</span>
                {label}
                <em>{when}</em>
              </div>
            ))}
          </div>
        </div>
        <Wave fill="#ffffff" />
      </section>

      <PlaceholderNotice />

      {/* client logo strip */}
      <section className="ec-logos">
        <div className="ec-wrap">
          <p className="ec-logos-label">Teams we build for</p>
          <div className="ec-logos-row">
            {clients.slice(0, 6).map((c) => (
              <span className="ec-logo-chip" key={c}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* stats */}
      <section className="ec-section">
        <div className="ec-wrap">
          <div className="ec-stats">
            {stats.map((s) => (
              <div className="ec-stat" key={s.label}>
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* services */}
      <section className="ec-section ec-band ec-has-wave" id="solutions">
        <div className="ec-wrap">
          <SectionHead
            kicker="What we do"
            title="Four ways we help, one team behind them"
            body="Most clients start with one and grow into the others. Nothing is outsourced to a partner you never meet."
            center
          />
          <div className="ec-grid ec-grid-2">
            {services.map((s) => (
              <article className="ec-card" key={s.slug} id={s.slug}>
                <div className="ec-card-icon" aria-hidden="true">
                  <EcIcon name={s.icon} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.summary}</p>
                <ul className="ec-feat">
                  {s.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
        <Wave fill="#ffffff" />
      </section>

      {/* testimonials */}
      <section className="ec-section">
        <div className="ec-wrap">
          <SectionHead
            kicker="Testimonials"
            title="What clients say"
            body="Placeholder quotes — replace with real ones you have permission to publish."
            center
          />
          <div className="ec-grid ec-grid-3">
            {testimonials.map((t, i) => (
              <figure className="ec-quote" key={i}>
                <blockquote>{t.quote}</blockquote>
                <figcaption>
                  <span className="ec-avatar" aria-hidden="true">
                    {t.name.charAt(0)}
                  </span>
                  <span>
                    <cite>{t.name}</cite>
                    <small>{t.role}</small>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* client wall */}
      <section className="ec-section ec-band ec-has-wave">
        <div className="ec-wrap">
          <SectionHead kicker="Clients" title="A few of the names on the roster" center />
          <div className="ec-logos-row">
            {clients.map((c) => (
              <span className="ec-logo-chip" key={c}>
                {c}
              </span>
            ))}
          </div>
        </div>
        <Wave fill="#ffffff" />
      </section>

      {/* featured work */}
      <section className="ec-section">
        <div className="ec-wrap">
          <SectionHead
            kicker="Featured work"
            title="Recent projects"
            body="Three builds that show the range — a product, a store and an internal automation."
          />
          <div className="ec-grid ec-grid-3">
            {projects.map((p) => (
              <article className="ec-work" key={p.slug}>
                <div className="ec-work-thumb" aria-hidden="true">
                  {p.title.charAt(0)}
                </div>
                <div className="ec-work-body">
                  <span className="ec-tag">{p.category}</span>
                  <h3>{p.title}</h3>
                  <p>{p.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* podcast */}
      <section className="ec-section ec-dark ec-has-wave">
        <div className="ec-wrap">
          <div className="ec-grid ec-grid-2" style={{ alignItems: "start", gap: 48 }}>
            <div>
              <span className="ec-kicker">The podcast</span>
              <h2>Conversations about building software in the open</h2>
              <p>
                Short episodes with founders, operators and developers on what actually shipped,
                what it cost and what they would do differently.
              </p>
              <Link className="ec-btn" href="/econtent/podcast">
                All episodes
              </Link>
            </div>
            <div>
              {episodes.map((ep) => (
                <div className="ec-ep" key={ep.number}>
                  <span className="ec-ep-num" aria-hidden="true">
                    EP{ep.number}
                  </span>
                  <div>
                    <h3>{ep.title}</h3>
                    <p>{ep.summary}</p>
                    <small>
                      {formatDate(ep.date)} · {ep.duration}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Wave fill="#ffffff" />
      </section>

      {/* blog */}
      <section className="ec-section">
        <div className="ec-wrap">
          <SectionHead kicker="From the blog" title="Notes on the work" />
          <div className="ec-grid ec-grid-3">
            {articles.map((a) => (
              <article className="ec-post" key={a.slug}>
                <h3>{a.title}</h3>
                <p>{a.excerpt}</p>
                <div className="ec-post-meta">
                  {formatDate(a.date)} · {a.readingTime}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="ec-section ec-dark">
        <div className="ec-wrap" style={{ textAlign: "center" }}>
          <h2>Got something that needs building?</h2>
          <p style={{ maxWidth: "56ch", margin: "0 auto 28px" }}>
            Tell us what you are trying to do. You will get a straight answer on scope, cost and
            timeline — or a referral if we are not the right fit.
          </p>
          <Link className="ec-btn" href="/econtent/contact">
            Book a discovery call
          </Link>
        </div>
      </section>
    </>
  );
}
