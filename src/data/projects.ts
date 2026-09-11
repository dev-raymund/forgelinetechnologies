/**
 * Portfolio projects.
 *
 * Seventeen real, live, verifiable builds. Every description states what was
 * actually built; none of them claim a metric, a result or an outcome that
 * has not been measured. Keep it that way — an invented conversion figure is
 * the fastest way to lose a technical buyer.
 *
 * The `projects` database table mirrors this shape, so any of it can move
 * behind the CMS later without the components changing.
 */

/** How the work was built. Doubles as the filter on /work. */
export type ProjectKind = "Website" | "Web App" | "E-commerce" | "Custom Build";

export type Project = {
  title: string;
  slug: string;
  kind: ProjectKind;
  /** Client's industry, shown beside the kind as metadata. */
  sector: string;
  description: string;
  image: string;
  imageAlt: string;
  liveUrl: string;
  /** Named technologies. Only what the build genuinely used. */
  stack: string[];
  /** Surfaced on the homepage. Curated, not the whole list. */
  featured?: boolean;

  /**
   * Case-study fields. All optional and all currently unset — the detail page
   * renders whichever are present and omits the rest.
   *
   * They exist so a real case study can be written for a project without a
   * schema change or a component rewrite. They are deliberately empty rather
   * than filled with plausible-sounding narrative: an invented challenge or a
   * fabricated result is the fastest way to lose a technical buyer, and the
   * brief is explicit that no fake case studies are to be created.
   */
  overview?: string;
  challenge?: string;
  approach?: string;
  /** Only ever populated with outcomes that were actually measured. */
  outcome?: string;
  gallery?: { src: string; alt: string }[];
};

export const projects: Project[] = [
  {
    title: "Talk Global Study",
    slug: "talk-global-study",
    kind: "Web App",
    sector: "Education",
    description:
      "A student-to-university matching platform, built as a custom application with a REST API carrying data between search, listings and the enquiry flow.",
    image: "/assets/projects/tgs-hub.jpg",
    imageAlt: "Talk Global Study student matching platform",
    liveUrl: "https://talkglobalstudy.com",
    stack: ["PHP", "REST API", "MySQL", "JavaScript"],
    featured: true,
  },
  {
    title: "Multihull Central",
    slug: "multihull-central",
    kind: "E-commerce",
    sector: "Yacht Sales",
    description:
      "Yacht sales and charter listings on a custom WordPress theme, with ACF modelling the specification fields each vessel needs.",
    image: "/assets/projects/mhc.jpg",
    imageAlt: "Multihull Central yacht sales and charter website",
    liveUrl: "https://www.multihullcentral.com/",
    stack: ["WordPress", "ACF", "PHP", "MySQL"],
    featured: true,
  },
  {
    title: "BH Sellers Advocate",
    slug: "bh-sellers-advocate",
    kind: "Website",
    sector: "Real Estate",
    description:
      "A property listing and sales site whose real engineering problem was the filtering — several criteria narrowing a large listing set without the page slowing down.",
    image: "/assets/projects/bh-sellers-advocate.jpg",
    imageAlt: "BH Sellers Advocate property listing website",
    liveUrl: "https://bhsellersadvocate.com.au/",
    stack: ["WordPress", "ACF", "PHP", "JavaScript"],
    featured: true,
  },
  {
    title: "Mission Estate",
    slug: "mission-estate",
    kind: "E-commerce",
    sector: "Winery",
    description:
      "An award-winning winery and restaurant storefront, combining online sales with seasonal menus that change through the year.",
    image: "/assets/projects/missionestate.jpg",
    imageAlt: "Mission Estate winery and restaurant storefront",
    liveUrl: "https://missionestate.co.nz/",
    stack: ["WooCommerce", "WordPress", "PHP"],
    featured: true,
  },
  {
    title: "Lisa Sherman Realty",
    slug: "lisa-sherman-realty",
    kind: "Website",
    sector: "Real Estate",
    description:
      "A real-estate agent site integrated with MLS/IDX, pulling live listing data from the external feed into the site's own presentation layer.",
    image: "/assets/projects/lisasherman.jpg",
    imageAlt: "Lisa Sherman Realty website with MLS listing integration",
    liveUrl: "https://lisashermanrealty.com/",
    stack: ["WordPress", "MLS/IDX", "PHP"],
    featured: true,
  },
  {
    title: "Bus 4x4",
    slug: "bus-4x4",
    kind: "E-commerce",
    sector: "Automotive",
    description:
      "Vehicle conversion and 4x4 bus sales, on a custom build using ACF to handle configurable options that differ for every vehicle.",
    image: "/assets/projects/bus4x4.jpg",
    imageAlt: "Bus 4x4 vehicle conversion and sales website",
    liveUrl: "https://www.bus4x4.com.au/",
    stack: ["WordPress", "ACF", "PHP"],
    featured: true,
  },
  {
    title: "Marci Metzger Realty",
    slug: "marci-metzger-realty",
    kind: "Custom Build",
    sector: "Real Estate",
    description:
      "A real-estate agent site hand-coded in plain HTML, CSS and JavaScript — no framework, no page builder, and a front end that stays small because of it.",
    image: "/assets/projects/real-estate.jpg",
    imageAlt: "Marci Metzger Realty hand-coded website",
    liveUrl: "https://real-estate-flame-two.vercel.app/",
    stack: ["HTML", "CSS", "JavaScript"],
  },
  {
    title: "Nutracraft",
    slug: "nutracraft",
    kind: "E-commerce",
    sector: "Supplements",
    description:
      "A supplements brand storefront with custom product templates, structured so new product types don't need a developer each time.",
    image: "/assets/projects/nutracraft.jpg",
    imageAlt: "Nutracraft supplements storefront",
    liveUrl: "https://nutracraft.com",
    stack: ["WooCommerce", "WordPress", "PHP"],
  },
  {
    title: "Leaft Blade",
    slug: "leaft-blade",
    kind: "E-commerce",
    sector: "Food",
    description:
      "A sustainable food brand where the storytelling carries as much weight as the catalogue — editorial content and commerce in a single build.",
    image: "/assets/projects/leaftblade.jpg",
    imageAlt: "Leaft Blade sustainable food brand storefront",
    liveUrl: "https://www.leaftblade.com/",
    stack: ["Shopify", "Liquid", "JavaScript"],
  },
  {
    title: "Off Route Adventures",
    slug: "off-route-adventures",
    kind: "E-commerce",
    sector: "Travel",
    description:
      "Adventure travel experiences sold as products, on a custom theme built around trip listings rather than physical stock.",
    image: "/assets/projects/offrouteadventures.jpg",
    imageAlt: "Off Route Adventures travel booking website",
    liveUrl: "https://offrouteadventures.com/",
    stack: ["WooCommerce", "WordPress", "PHP"],
  },
  {
    title: "Stickman Wealth",
    slug: "stickman-wealth",
    kind: "Website",
    sector: "Finance",
    description:
      "A wealth management and financial services site on a custom theme, with ACF structuring the service and adviser content.",
    image: "/assets/projects/stickmanwealth.jpg",
    imageAlt: "Stickman Wealth financial services website",
    liveUrl: "https://www.stickmanwealth.com.au/",
    stack: ["WordPress", "ACF", "PHP"],
  },
  {
    title: "Perfect Floors",
    slug: "perfect-floors",
    kind: "Website",
    sector: "Interior",
    description:
      "Interior design services and a product showcase, built on Avada with ACF handling the structured product data behind it.",
    image: "/assets/projects/perfect_floors.jpg",
    imageAlt: "Perfect Floors interior design website",
    liveUrl: "https://perfectfloors.com.au/",
    stack: ["WordPress", "Avada", "ACF"],
  },
  {
    title: "Fast Track Home Loans",
    slug: "fast-track-home-loans",
    kind: "Website",
    sector: "Finance",
    description:
      "A mortgage and investment advisory site on a custom theme, with ACF structuring loan products alongside the advisory content.",
    image: "/assets/projects/fast_track_home_loans.jpg",
    imageAlt: "Fast Track Home Loans mortgage advisory website",
    liveUrl: "https://fasttrackhomeloans.com.au/",
    stack: ["WordPress", "ACF", "PHP"],
  },
  {
    title: "Coffs City Lockmart",
    slug: "coffs-city-lockmart",
    kind: "Website",
    sector: "Local Business",
    description:
      "A locksmith service site built around one job: getting someone to the emergency contact fast, from any page and on any device.",
    image: "/assets/projects/coffscitylockmart.jpg",
    imageAlt: "Coffs City Lockmart locksmith website",
    liveUrl: "https://www.coffscitylockmart.com.au/",
    stack: ["WordPress", "PHP", "CSS"],
  },
  {
    title: "Karratha Lock Service",
    slug: "karratha-lock-service",
    kind: "Website",
    sector: "Local Business",
    description:
      "A regional locksmith site with appointment scheduling built in, so routine bookings arrive without a phone call.",
    image: "/assets/projects/karrathalocksmith.jpg",
    imageAlt: "Karratha Lock Service locksmith website",
    liveUrl: "https://karrathalockservice.com/",
    stack: ["WordPress", "PHP", "Scheduling"],
  },
  {
    title: "Ignition Consulting",
    slug: "ignition-consulting",
    kind: "Website",
    sector: "Consultancy",
    description:
      "A sales and marketing consultancy brand site, with the content architecture built around their distinct service lines.",
    image: "/assets/projects/weareignition.jpg",
    imageAlt: "Ignition Consulting brand website",
    liveUrl: "https://weareignition.co.nz/",
    stack: ["WordPress", "ACF", "PHP"],
  },
  {
    title: "Kalinga House",
    slug: "kalinga-house",
    kind: "Website",
    sector: "Nonprofit",
    description:
      "A mission-driven site for a nonprofit refuge supporting vulnerable girls, built to make the work — and the ways to help — immediately legible.",
    image: "/assets/projects/kalingahouse.jpg",
    imageAlt: "Kalinga House nonprofit refuge website",
    liveUrl: "https://kalingahouse.org/",
    stack: ["WordPress", "PHP", "CSS"],
  },
];

/** Curated homepage selection, in the order they should appear. */
export const featuredProjects = projects.filter((p) => p.featured);

/** Filter tabs on /work, built from the data so they can never drift. */
export const projectKinds: ProjectKind[] = [
  "Website",
  "Web App",
  "E-commerce",
  "Custom Build",
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** Projects sharing a kind, excluding one. Used for "related" on a detail page. */
export function relatedProjects(slug: string, limit = 3): Project[] {
  const current = getProject(slug);
  if (!current) return [];
  const sameKind = projects.filter(
    (p) => p.slug !== slug && p.kind === current.kind,
  );
  const rest = projects.filter((p) => p.slug !== slug && p.kind !== current.kind);
  return [...sameKind, ...rest].slice(0, limit);
}

/** True when a project has enough written for a case-study layout. */
export function hasCaseStudy(p: Project): boolean {
  return Boolean(p.overview || p.challenge || p.approach || p.outcome);
}
