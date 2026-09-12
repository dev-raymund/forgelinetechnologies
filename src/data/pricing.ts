/**
 * Packaged offers.
 *
 * Every figure here is carried forward verbatim from the previous site.
 * Published pricing is a genuine differentiator in this market — most studios
 * make you book a call to learn a number — so it stays, and it stays honest.
 *
 * Nothing here is invented. If a price changes, change it here and nowhere
 * else; these values are rendered, never duplicated into copy.
 */

export type Package = {
  name: string;
  /** Who it is for. Shown as metadata beside the name. */
  audience: string;
  price: string;
  /** "/ project" or "/ month". Rendered smaller than the figure. */
  unit: string;
  summary: string;
  includes: string[];
  /** One package is emphasised. Any more and emphasis means nothing. */
  highlight?: boolean;
};

export const packages: Package[] = [
  {
    name: "Web App Build",
    audience: "For founders",
    price: "from $4,000",
    unit: "/ project",
    summary:
      "Your idea built into a real, production-ready product — front-end to back-end, in 4–8 weeks.",
    includes: [
      "Discovery + scoping",
      "Front-end + back-end",
      "Auth, database, APIs",
      "Deployed + full handover",
    ],
    highlight: true,
  },
  {
    name: "Site Sprint",
    audience: "For small businesses",
    price: "from $800",
    unit: "/ project",
    summary: "A clean, fast website designed and shipped in one to two weeks.",
    includes: [
      "Custom-coded or CMS-built",
      "Up to ~5 pages, responsive",
      "Lead form + basic SEO",
      "Deployed live",
    ],
  },
  {
    name: "Build Partner",
    audience: "For ongoing work",
    price: "from $1,500",
    unit: "/ month",
    summary: "A dedicated developer on tap, month to month — cancel anytime.",
    includes: [
      "Ongoing features & fixes",
      "Front-end & back-end work",
      "Priority support",
      "Dedicated capacity",
    ],
  },
  {
    name: "Care Plan",
    audience: "For peace of mind",
    price: "from $150",
    unit: "/ month",
    summary: "Hosting, updates and maintenance handled so your site stays healthy.",
    includes: [
      "Hosting, backups, monitoring",
      "Updates & security",
      "Small fixes & tweaks",
      "Monthly report",
    ],
  },
];

export type AddOn = {
  name: string;
  price: string;
  summary: string;
};

/**
 * Anything quoted per project rather than from a published figure says so.
 * Inventing a number to fill the gap would undo the one thing this page has
 * going for it — that every figure on it is real.
 */
export const SCOPED = "Scoped to the project";

export const addOns: AddOn[] = [
  {
    name: "Online Store",
    price: "from $2,500",
    summary: "E-commerce build — Shopify, WooCommerce, or a fully custom checkout.",
  },
  {
    name: "Speed & SEO Tune-up",
    price: "from $400",
    summary: "Make a slow site fast — performance, SEO, Core Web Vitals.",
  },
  {
    name: "Migration & Redesign",
    price: "from $600",
    summary: "Move platforms or refresh an old site — without losing data or rankings.",
  },
  {
    name: "SEO Audit",
    price: SCOPED,
    summary:
      "A technical review of what is stopping search engines reading your site, and what to fix first.",
  },
  {
    name: "Ongoing SEO",
    price: SCOPED,
    summary:
      "Continuous technical and on-page work, reported against Search Console rather than against promises.",
  },
  {
    name: "Automation Audit",
    price: SCOPED,
    summary:
      "A look at what your team repeats every week and which of it is genuinely worth automating.",
  },
  {
    name: "Workflow Automation",
    price: SCOPED,
    summary:
      "Building the connections and workflows the audit identified — CRM, notifications, data syncing.",
  },
];
