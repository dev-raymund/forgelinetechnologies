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
  /** Key into the icon set — see components/ui/service-icon.tsx. */
  icon: "window" | "dashboard" | "cart" | "code" | "plug" | "refresh";
};

export const services: Service[] = [
  {
    number: "01",
    title: "Websites & Digital Experiences",
    slug: "websites",
    icon: "window",
    summary:
      "Marketing and corporate sites that load fast, get found, and your own team can keep current.",
    description:
      "For businesses whose current site is slow, awkward to edit, or was built by someone who has since disappeared. You get a site that works properly on any device, that search engines can actually read, and that your team can update without raising a ticket for every wording change.",
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
    icon: "dashboard",
    summary:
      "Portals, dashboards, booking systems and internal tools — for when a spreadsheet has stopped coping.",
    description:
      "For businesses running important work through spreadsheets, email threads and software that almost fits. You get a system built around the process you actually follow, with proper logins and permissions, data you can rely on, and an interface your team will use without being made to.",
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
    icon: "cart",
    summary:
      "Shopify, WooCommerce and custom storefronts — built to sell, and to still be maintainable next year.",
    description:
      "For businesses selling online where the storefront has to handle real products, real payments and real shipping rules. You get a store on whichever platform genuinely suits your catalogue and your margins — and one where adding a product next year does not mean hiring a developer.",
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
    icon: "code",
    summary:
      "Software shaped around how your business actually works, not how a template assumed it would.",
    description:
      "For businesses with a process no off-the-shelf product supports — the quoting rule, the approval chain, the way stock gets counted. It is worth building at the point where the workaround costs more every month than the build would cost once. You get software that fits the business, instead of a business bent to fit the software.",
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
    icon: "plug",
    summary:
      "Connect your site or app to the systems you already use — payments, CRMs, databases and third-party services.",
    description:
      "For businesses entering the same information twice because two systems do not talk to each other. You get the connections that move data between your website, your CRM, your payment provider and your internal tools — so something is entered once and is then correct everywhere it appears.",
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
    icon: "refresh",
    summary:
      "A developer on hand month to month for the features, fixes and maintenance that come after launch.",
    description:
      "For businesses that need development to continue but do not need a full-time hire. You get the features that were not in the original scope, the fixes you will inevitably want, and the hosting, updates and monitoring that keep a site healthy — month to month, and cancellable.",
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
