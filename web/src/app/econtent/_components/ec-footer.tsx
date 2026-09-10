import Link from "next/link";
import { brand, nav, services } from "../_data";

export default function EcFooter() {
  return (
    <footer className="ec-footer">
      <div className="ec-wrap">
        <div className="ec-footer-grid">
          <div>
            <Link className="ec-brand" href="/econtent">
              <span className="ec-brand-mark" aria-hidden="true">
                e
              </span>
              {brand.name}
            </Link>
            <p style={{ marginTop: 16, maxWidth: "38ch", fontSize: 14.5 }}>{brand.blurb}</p>
          </div>

          <div>
            <h4>Pages</h4>
            <ul className="ec-footer-links">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Solutions</h4>
            <ul className="ec-footer-links">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link href={`/econtent/solutions#${s.slug}`}>{s.title}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Get in touch</h4>
            <ul className="ec-footer-links">
              <li>
                <a href={`mailto:${brand.email}`}>{brand.email}</a>
              </li>
              <li>
                <a href={`tel:${brand.phone.replace(/\s/g, "")}`}>{brand.phone}</a>
              </li>
              <li>{brand.location}</li>
            </ul>
          </div>
        </div>

        <div className="ec-footer-bottom">
          <span>
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </span>
          <span>Placeholder site — content pending client sign-off.</span>
        </div>
      </div>
    </footer>
  );
}
