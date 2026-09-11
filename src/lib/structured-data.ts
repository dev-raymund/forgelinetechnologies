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
