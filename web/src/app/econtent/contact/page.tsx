import PlaceholderNotice from "../_components/ec-placeholder";
import Wave from "../_components/ec-wave";
import { brand, services } from "../_data";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <section className="ec-page-head ec-has-wave">
        <div className="ec-wrap">
          <h1>Let&rsquo;s talk</h1>
          <p>
            Tell us what you are trying to build or fix. You will get a straight answer on scope,
            cost and timeline — or a referral if we are not the right fit.
          </p>
        </div>
        <Wave fill="#ffffff" />
      </section>

      <PlaceholderNotice />

      <section className="ec-section">
        <div className="ec-wrap ec-contact-grid">
          <div>
            <span className="ec-kicker">Get in touch</span>
            <h2 style={{ fontSize: 30 }}>Reach us directly</h2>
            <p>
              Email is fastest. Include a link to the site or system in question if there is one —
              it saves a round trip.
            </p>
            <ul className="ec-contact-list">
              <li>
                <span>
                  <strong>Email</strong>
                  <a href={`mailto:${brand.email}`}>{brand.email}</a>
                </span>
              </li>
              <li>
                <span>
                  <strong>Phone</strong>
                  <a href={`tel:${brand.phone.replace(/\s/g, "")}`}>{brand.phone}</a>
                </span>
              </li>
              <li>
                <span>
                  <strong>Based in</strong>
                  {brand.location}
                </span>
              </li>
            </ul>
          </div>

          {/*
            TODO — this form has no delivery wired up. Before launch, either:
              a) add a server action here that posts to a free form endpoint, or
              b) point `action` at a hosted form service.
            Until then the note under the button tells people to email instead,
            rather than silently swallowing enquiries.
          */}
          <div className="ec-card">
            <form>
              <div className="ec-field">
                <label htmlFor="ec-name">Your name</label>
                <input id="ec-name" name="name" type="text" autoComplete="name" required />
              </div>
              <div className="ec-field">
                <label htmlFor="ec-email">Email</label>
                <input id="ec-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="ec-field">
                <label htmlFor="ec-service">What do you need?</label>
                <select id="ec-service" name="service" defaultValue="">
                  <option value="" disabled>
                    Choose one…
                  </option>
                  {services.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.title}
                    </option>
                  ))}
                  <option value="other">Something else</option>
                </select>
              </div>
              <div className="ec-field">
                <label htmlFor="ec-message">Tell us about the project</label>
                <textarea id="ec-message" name="message" required />
              </div>
              <button className="ec-btn" type="submit">
                Send enquiry
              </button>
              <p style={{ fontSize: 13, color: "var(--ec-text-2)", margin: "14px 0 0" }}>
                Form delivery isn&rsquo;t connected yet — email{" "}
                <a href={`mailto:${brand.email}`}>{brand.email}</a> in the meantime.
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
