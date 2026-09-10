/* Homepage sections: testimonials, founder, FAQ, lead form, footer.
   Maintained directly in this file. */
import LeadForm from "@/components/forms/lead-form";

export default function StaticBottom() {
  return (
    <>


    
    <section className="wrap band" id="testimonials" hidden={true}>
      <div className="sec-head">
        <p className="kicker">Testimonials</p>
        <h2>What clients are <span className="grad-text">saying</span></h2>
        <p className="sub">
          Short, specific words from the people whose projects shipped.
        </p>
      </div>

      <div className="editor-note">
        <strong>Editor's note — delete this block before going live.</strong>
        The two cards below are placeholders, not real testimonials. Replace each
        quote with a client's own words (with their permission to publish name and
        company), then remove the <code>is-placeholder</code> class and the
        <code>Placeholder</code> tag from each card.
      </div>

      <div className="tgrid">
        <figure className="tcard is-placeholder">
          <span className="ph-tag">Placeholder</span>
          <blockquote className="tquote">
            [Replace with a real client quote — two or three sentences in their own
            words. The strongest ones name a concrete result: what changed for the
            business after launch.]
          </blockquote>
          <figcaption className="tmeta">
            <span className="tavatar" aria-hidden="true">?</span>
            <span>
              <span className="tname">[Client name]</span>
              <span className="trole">[Role, Company]</span>
            </span>
          </figcaption>
        </figure>

        <figure className="tcard is-placeholder">
          <span className="ph-tag">Placeholder</span>
          <blockquote className="tquote">
            [Replace with a second real quote. A good one speaks to the process —
            scope held, timeline met, questions answered — rather than repeating
            the first card's angle.]
          </blockquote>
          <figcaption className="tmeta">
            <span className="tavatar" aria-hidden="true">?</span>
            <span>
              <span className="tname">[Client name]</span>
              <span className="trole">[Role, Company]</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </section>

    
    <section className="wrap wv-white" id="about">
      <div className="sec-head">
        <p className="kicker">Founder's note</p>
        <h2>Why <span className="grad-text">Forgeline</span> exists</h2>
      </div>
      <div className="about">
        <div className="founder-wrap">
          <figure className="founder-card surface">
            <img src="assets/raymund-hermoso-photo.png" alt="Raymund Hermoso, Founder of Forgeline Technologies" />
            <figcaption>
              <strong>Raymund Hermoso</strong>
              <span>Founder &amp; Lead Developer</span>
            </figcaption>
          </figure>
        </div>
        <div className="about-body">
          <p className="about-lead">I started Forgeline after years building for agencies and enterprise teams — and watching too many businesses get burned by web projects that ran over budget, missed the point, or simply never shipped.</p>
          <p>Forgeline is my answer to that: a studio that treats your product like the revenue tool it is. Clear scope, honest pricing, and clean work that actually launches.</p>
          <p>And when you work with Forgeline, you work directly with me — no account managers, no juniors learning on your dime. Just a developer who's accountable for the result, backed by 6+ years and enterprise experience at PPD–ThermoFisher and agencies across Australia &amp; New Zealand.</p>
          <p className="signature">Raymund Hermoso<span>Founder, Forgeline Technologies</span></p>
        </div>
      </div>
    </section>


    
    <section className="wrap narrow band wv-blue" id="faq">
      <div className="sec-head">
        <p className="kicker">FAQ</p>
        <h2>Good to <span className="grad-text">know</span></h2>
      </div>
      <div className="faq">
        <div className="surface">
          <h4>What can you build?</h4>
          <p className="muted">Full-stack web apps, websites, and e-commerce — front-end to back-end. We pick the right tools for the job: React, Node, Laravel, WordPress, Shopify, and more.</p>
        </div>
        <div className="surface">
          <h4>I'm not technical — can you still help?</h4>
          <p className="muted">Absolutely. We translate what's in your head into a clear plan and handle the technical side end to end. No jargon required.</p>
        </div>
        <div className="surface">
          <h4>Who owns the site and code?</h4>
          <p className="muted">You do — 100%. Everything ships to your accounts with a full handover and a short walkthrough.</p>
        </div>
        <div className="surface">
          <h4>How does pricing work?</h4>
          <p className="muted">Every project starts with a free scoping call, then a fixed quote. You know the price before we start — no hourly surprises.</p>
        </div>
        <div className="surface">
          <h4>How soon can we start?</h4>
          <p className="muted">Usually within a week, depending on the queue. Book a scoping call and we'll confirm timing.</p>
        </div>
      </div>
    </section>

    
    <section className="wrap narrow wv-white wv-alt" id="contact">
      <div className="cta-card">
        <div className="sec-head">
          <p className="kicker">Get started</p>
          <h2>Start a <span className="grad-text">project</span></h2>
          <p className="sub">
            Tell us what you're building. We'll reply within a day and set up a free
            20-minute scoping call.
          </p>
        </div>

        
        <LeadForm />
      </div>
    </section>

    
    <footer className="footer wv-deep">
      <div className="wrap">
        <p className="brand"><svg className="fg-logo" viewBox="0 0 190 44" role="img" aria-label="Forgeline Technologies">
          <defs>
            <linearGradient id="fgGradF" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#016ecc" /><stop offset="1" stopColor="#19d2fe" />
            </linearGradient>
            <clipPath id="fgClipF"><circle cx="20" cy="22" r="19" /></clipPath>
          </defs>
          <circle className="fg-tile" cx="20" cy="22" r="19" />
          <g clipPath="url(#fgClipF)">
            <path className="fg-wave" d="M0.0,30.6C0.6,30.7 2.2,31.1 3.3,31.2C4.4,31.4 5.6,31.4 6.7,31.4C7.8,31.4 8.9,31.2 10.0,31.1C11.1,30.9 12.2,30.6 13.3,30.3C14.4,30.0 15.6,29.7 16.7,29.4C17.8,29.0 18.9,28.7 20.0,28.4C21.1,28.2 22.2,27.9 23.3,27.8C24.4,27.6 25.6,27.6 26.7,27.6C27.8,27.6 28.9,27.8 30.0,27.9C31.1,28.1 32.2,28.4 33.3,28.7C34.4,29.0 35.6,29.3 36.7,29.6C37.8,30.0 39.4,30.4 40.0,30.6L40,42L0,42Z" />
          </g>
          <path className="fg-mark" d="M12.5 12.5 H28.5 V17.5 H18 V31.5 H12.5 Z" />
          <rect className="fg-bar" x="18" y="20.2" width="8.4" height="4.6" rx="0.6" />
          <text className="fg-word" x="48" y="25" fontSize="20.5" fontWeight="900" letterSpacing="-0.5">Forgeline</text>
          <text className="fg-sub" x="49" y="37" fontSize="7.6" fontWeight="700" letterSpacing="3.1">TECHNOLOGIES</text>
        </svg></p>
        <p className="muted small">Full-stack web development studio. &copy; {new Date().getFullYear()} Forgeline Technologies.</p>
        <p className="links">
          <a href="https://github.com/dev-raymund" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.2 5.1 18.2 5.4 18.2 5.4c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z" /></svg></a>
          <a href="https://www.linkedin.com/in/raymund-hermoso-b00586207/" target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" /></svg></a>
          <a href="mailto:raymundhermoso.dev@gmail.com" aria-label="Email" title="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg></a>
        </p>
      </div>
    </footer>


    </>
  );
}
