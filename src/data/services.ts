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
  /**
   * Which of the four client needs this answers. The grouping is how a visitor
   * navigates eight services without reading eight descriptions: most arrive
   * knowing whether they need something built, improved, connected or
   * automated, even when they cannot name the service.
   */
  group: "Build" | "Improve" | "Connect" | "Automate";
  /**
   * The situation in the client's words. Leads the entry, because a service
   * name only means something to someone who has already diagnosed themselves.
   */
  problem: string;
  /** Key into the icon set — see components/ui/service-icon.tsx. */
  icon:
    | "window"
    | "dashboard"
    | "cart"
    | "code"
    | "plug"
    | "refresh"
    | "search"
    | "workflow";
  /**
   * Services that genuinely tend to be commissioned alongside this one. Shown
   * on the detail page so a visitor finds the rest of the job without being
   * sold at — a new website usually needs SEO, an application usually needs
   * integrations.
   */
  related: string[];
  /**
   * Questions specific to this service. Optional: only the lines where buyers
   * reliably ask the same thing carry one.
   */
  faqs?: { question: string; answer: string }[];
};

export const services: Service[] = [
  {
    number: "01",
    title: "Websites & Digital Experiences",
    slug: "websites",
    group: "Build",
    problem:
      "Your site looks dated, reads badly on a phone, or nobody can find it.",
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
    related: ["seo", "ongoing-development"],
  },
  {
    number: "02",
    title: "Web Applications",
    slug: "web-applications",
    group: "Build",
    problem:
      "A spreadsheet is doing a job it was never built to do.",
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
    related: ["apis-integrations", "automation"],
  },
  {
    number: "03",
    title: "E-commerce",
    slug: "ecommerce",
    group: "Build",
    problem:
      "The store cannot do what you now need it to sell.",
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
    related: ["seo", "apis-integrations"],
  },
  {
    number: "04",
    title: "Custom Software",
    slug: "custom-software",
    group: "Build",
    problem:
      "Nothing off the shelf fits the way the business actually runs.",
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
    related: ["apis-integrations", "automation"],
  },
  {
    number: "05",
    title: "APIs & Integrations",
    slug: "apis-integrations",
    group: "Connect",
    problem:
      "Two systems hold the same information and neither knows about the other.",
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
    related: ["automation", "web-applications"],
  },
  {
    number: "06",
    title: "SEO",
    slug: "seo",
    group: "Improve",
    problem:
      "The site is fine to look at, but search engines cannot make sense of it.",
    icon: "search",
    summary:
      "Technical and on-page work that makes a site easier to find, and easier for search engines to read.",
    description:
      "For businesses whose site looks fine but is effectively invisible in search. You get the foundations put right — how pages are structured, labelled and linked, and how fast they load — so search engines can tell what you do and who you do it for. No ranking promises: nobody can honestly make those, and anyone who does is guessing.",
    includes: [
      "Technical SEO audit",
      "Metadata and structured data",
      "Sitemap and robots configuration",
      "Internal linking structure",
      "Core Web Vitals and page speed",
      "On-page and content structure",
      "Search Console and analytics setup",
      "Local SEO where it applies",
      "SEO-safe platform migrations",
      "Ongoing improvements",
    ],
    // No project here is an SEO engagement, so nothing is claimed as one.
    // The technical SEO work listed above ships inside every website build.
    evidence: [],
    related: ["websites", "ongoing-development"],
    faqs: [
      {
        question: "Can you guarantee a first-page ranking?",
        answer:
          "No, and neither can anyone else — rankings depend on competitors, on your market and on search engines nobody controls. What can be guaranteed is that the technical side is correct: pages that load fast, are structured properly, and can actually be read and indexed. That is the part that is in anyone's hands.",
      },
      {
        question: "How long before it shows any effect?",
        answer:
          "Technical fixes register within weeks; anything competitive takes months. If a site was previously blocking crawlers or shipping broken metadata, the change can be quicker, because the problem was a fault rather than competition.",
      },
      {
        question: "Do you write the content as well?",
        answer:
          "We structure it — headings, internal links, metadata, the way pages relate. Writing the words is usually better done by you or a specialist who knows the subject. We will tell you plainly what is missing.",
      },
      {
        question: "We are moving platforms. Will we lose our rankings?",
        answer:
          "That is the main risk in a migration and it is avoidable. URLs get mapped, redirects get put in place before launch, and metadata and structured data carry across. Most ranking losses in a replatform are a redirect map nobody wrote.",
      },
    ],
  },
  {
    number: "07",
    title: "Automation",
    slug: "automation",
    group: "Automate",
    problem:
      "Someone repeats the same task every week, and it never needed a person.",
    icon: "workflow",
    summary:
      "Connect the systems you already use and take the repetitive work out of the week.",
    description:
      "For businesses typing the same information into two systems, or doing by hand something that happens the same way every time. You get the connections and workflows that move data between your website, your CRM, your inbox and your internal tools — so something entered once is correct everywhere, and the work that never needed a person stops taking one.",
    includes: [
      "Form-to-CRM workflows",
      "Lead routing and notifications",
      "Email and onboarding sequences",
      "Scheduled jobs and data syncing",
      "Webhooks and API integrations",
      "Payment and invoicing workflows",
      "Reporting and exports",
      "AI-assisted steps where they genuinely help",
      "Automation audit of your current process",
    ],
    evidence: ["karratha-lock-service", "lisa-sherman-realty", "talk-global-study"],
    related: ["apis-integrations", "web-applications"],
    faqs: [
      {
        question: "Where is automation actually worth it?",
        answer:
          "Where a task happens often, the same way each time, and a person adds nothing by doing it — copying an enquiry into a CRM, chasing the same follow-up, re-keying an order. If a task needs judgement, leave it with the person who has the judgement.",
      },
      {
        question: "Is this an AI product?",
        answer:
          "No. Most useful automation is plumbing — one system telling another what happened. AI gets used where it earns its place, like sorting or summarising free text, and left out where a rule is more reliable and cheaper to run.",
      },
      {
        question: "Will it work with the tools we already have?",
        answer:
          "Usually. Most business software exposes an API or webhooks, and where one does not there is normally a workable path. The audit establishes that before anything is quoted, so you are not paying to discover a dead end.",
      },
      {
        question: "What happens when an automation breaks?",
        answer:
          "It should tell you rather than fail quietly, which is the difference between an automation and a liability. Failures notify someone, and anything that moves data keeps a record you can check.",
      },
    ],
  },
  {
    number: "08",
    title: "Ongoing Development",
    slug: "ongoing-development",
    group: "Improve",
    problem:
      "It launched, and then there was nobody left to keep improving it.",
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
    related: ["seo", "automation"],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
