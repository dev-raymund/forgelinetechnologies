/**
 * Service lines.
 *
 * Six, deliberately. The previous site listed capabilities as a flat wall of
 * words; a buyer could not tell which one to ask for. Each entry here has to
 * earn its place by being something a client would actually commission on
 * its own.
 *
 * `evidence` points at real project slugs. A service claim next to a live
 * build is worth more than another paragraph of description.
 */

export type Service = {
  /** Display index — "01", "02". Editorial numbering, not an id. */
  number: string;
  title: string;
  slug: string;
  /** One line. Used in nav, cards and metadata. */
  summary: string;
  /** The homepage/overview paragraph. */
  description: string;
  /** Concrete deliverables. Nouns, not adjectives. */
  includes: string[];
  /** Project slugs that demonstrate this service. */
  evidence: string[];
};

export const services: Service[] = [
  {
    number: "01",
    title: "Websites & Digital Experiences",
    slug: "websites",
    summary:
      "Marketing sites, corporate sites and landing pages built for speed, search and conversion.",
    description:
      "The site most businesses have is slow, hard to edit, and built by someone who has since disappeared. We build the other kind: fast, structured so your team can actually change the content, and engineered so search engines and customers both find what they came for.",
    includes: [
      "Marketing and corporate websites",
      "Landing pages and campaign sites",
      "Content architecture your team can edit",
      "Technical SEO, metadata and structured data",
      "Core Web Vitals and performance work",
      "Accessibility to WCAG principles",
    ],
    evidence: ["bh-sellers-advocate", "stickman-wealth", "kalinga-house"],
  },
  {
    number: "02",
    title: "Web Applications",
    slug: "web-applications",
    summary:
      "Portals, dashboards, booking systems and internal tools — software that runs in a browser.",
    description:
      "When a spreadsheet stops coping and off-the-shelf software almost fits, the gap is a web application. We build the portals, dashboards and internal tools that carry real work: authentication, roles, data you can trust, and an interface people will actually use.",
    includes: [
      "Customer and client portals",
      "Dashboards and reporting interfaces",
      "Booking and scheduling systems",
      "Internal business tools",
      "Authentication, roles and permissions",
      "SaaS product engineering",
    ],
    evidence: ["talk-global-study", "karratha-lock-service"],
  },
  {
    number: "03",
    title: "E-commerce",
    slug: "ecommerce",
    summary:
      "Shopify, WooCommerce and custom commerce — storefronts built to sell and to maintain.",
    description:
      "A storefront is a product catalogue, a payment system, a shipping system and a content site wearing one coat. We build on Shopify or WooCommerce where the platform earns its keep, and custom where it does not — then make sure adding a product next year does not require a developer.",
    includes: [
      "Shopify and WooCommerce builds",
      "Custom commerce and checkout",
      "Product templates and catalogue structure",
      "Payments and shipping integration",
      "Storefront performance",
      "Migrations between platforms",
    ],
    evidence: ["mission-estate", "nutracraft", "leaft-blade", "multihull-central"],
  },
  {
    number: "04",
    title: "Custom Software",
    slug: "custom-software",
    summary:
      "Software shaped around how your business actually works, not how a template assumed it would.",
    description:
      "Every business has a process that no product quite supports — the quoting rule, the approval chain, the way stock is counted. Custom software is worth building at exactly that point: where the workaround costs more every month than the build would cost once.",
    includes: [
      "Business systems and workflow tools",
      "Data modelling and database design",
      "Process automation",
      "Reporting and exports",
      "Replacing spreadsheets that outgrew themselves",
      "Legacy system replacement",
    ],
    evidence: ["talk-global-study", "marci-metzger-realty"],
  },
  {
    number: "05",
    title: "APIs & Integrations",
    slug: "apis-integrations",
    summary:
      "Connecting websites, applications, databases and third-party systems so data moves once.",
    description:
      "Most businesses already own the systems they need; the data just does not move between them. We build the REST APIs and integrations that connect a site to a CRM, a payment provider, a listing feed or an internal database — so information is entered once and is correct everywhere.",
    includes: [
      "REST API design and build",
      "Third-party service integration",
      "CRM and payment provider connections",
      "Listing and data feed integration",
      "Authentication between systems",
      "Scheduled syncs and webhooks",
    ],
    evidence: ["talk-global-study", "lisa-sherman-realty"],
  },
  {
    number: "06",
    title: "Ongoing Development",
    slug: "ongoing-development",
    summary:
      "A developer on tap, month to month — features, fixes and maintenance after launch.",
    description:
      "Launch is the start of a website's life, not the end of it. Ongoing development covers the features you did not scope yet, the fixes you will need, and the hosting, updates and monitoring that keep a site healthy — without hiring someone full time.",
    includes: [
      "New features and improvements",
      "Bug fixes and technical support",
      "Hosting, updates and backups",
      "Uptime and performance monitoring",
      "Security patching",
      "Month to month, cancel anytime",
    ],
    evidence: ["multihull-central", "perfect-floors"],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
