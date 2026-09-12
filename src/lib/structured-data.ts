import { site, founder } from "@/lib/site";
import { faqs } from "@/data/faqs";
import { services } from "@/data/services";

/**
 * JSON-LD builders.
 *
 * Kept as plain objects so they can be unit-tested and so no component has to
 * hand-write a schema. Only claims that appear on the page are described —
 * structured data asserting something the page does not say is the kind of
 * thing that earns a manual action.
 */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    email: site.email,
    description: site.description,
    founder: {
      "@type": "Person",
      name: founder.name,
      jobTitle: founder.role,
    },
    sameAs: [site.social.linkedin, site.social.github],
    areaServed: ["AU", "NZ", "US", "PH"],
    knowsAbout: services.map((s) => s.title),
  };
}

/**
 * WebSite. Declares the site itself and its name, which is what search engines
 * use for a sitelinks title.
 *
 * No SearchAction: that property tells Google a site has its own search
 * endpoint, and this one does not. Declaring it would be describing a feature
 * that is not there.
 */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    url: site.url,
    name: site.name,
    description: site.description,
    publisher: { "@id": `${site.url}/#organization` },
    inLanguage: "en",
  };
}

/**
 * Breadcrumbs for nested routes. Mirrors the visible trail exactly — schema
 * that disagrees with the page is worse than none.
 */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${site.url}${crumb.path}`,
    })),
  };
}

export function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/**
 * Serialises for a <script> tag. `<` is escaped so a value can never close the
 * script element early, which is the one real injection risk with JSON-LD.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
