import { site, founder, engagements, faqs } from "@/lib/content";

/**
 * JSON-LD describing the studio, its published price ranges and the FAQ.
 * Every value is sourced from lib/content, so the markup can't drift from
 * what the page actually says — which is the thing Google penalises.
 */
export default function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${site.url}/#organization`,
        name: site.name,
        url: site.url,
        email: site.email,
        description: site.description,
        founder: { "@type": "Person", name: founder.name, jobTitle: founder.role },
        areaServed: ["AU", "NZ", "PH", "US"],
        knowsAbout: [
          "Web development",
          "Web application development",
          "E-commerce development",
          "API integration",
        ],
        makesOffer: engagements.map((e) => ({
          "@type": "Offer",
          name: e.name,
          description: e.summary,
          priceSpecification: {
            "@type": "PriceSpecification",
            price: e.price.replace(/[$,]/g, ""),
            priceCurrency: "USD",
            valueAddedTaxIncluded: false,
          },
        })),
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        publisher: { "@id": `${site.url}/#organization` },
      },
      {
        "@type": "FAQPage",
        "@id": `${site.url}/#faq`,
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
