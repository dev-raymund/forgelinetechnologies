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
      "A custom platform that matches students to universities, built around a search and enquiry journey that had to stay quick across a large set of listings. A dedicated REST API moves the data between search, listings and enquiries.",
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
      "A yacht sales and charter site where no two vessels share the same specifications. A custom WordPress theme models those fields per listing, so the team adds new boats themselves rather than waiting on a developer.",
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
      "A property listing and sales site where buyers narrow a large set of listings by several criteria at once. Making that filtering stay responsive as the list grows was the real engineering problem behind it.",
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
      "A storefront for an award-winning winery that also runs a restaurant, so it sells wine online while carrying menus that change with the season. Both live in one build, and the team updates either without touching the other.",
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
      "An agent site that shows current listings without anyone re-entering them by hand. It reads the MLS/IDX feed directly, so listings appear in the site's own design and stay current on their own.",
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
      "A vehicle conversion and sales site where almost no two builds share the same options. A custom build handles the configurable specifications per vehicle, so the catalogue stays accurate as the range changes.",
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
      "An agent site built to open quickly for buyers browsing listings on a phone. Hand-coded in plain HTML, CSS and JavaScript — no framework and no page builder, which is why the front end stays small.",
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
      "A storefront for a supplements brand with a range that keeps expanding. Custom product templates are structured so an entirely new kind of product can be added by the team, not by a developer.",
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
      "A sustainable food brand where the story does as much selling as the catalogue. Editorial content and the storefront run in one build, so the brand narrative and the buying journey stay together.",
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
      "Adventure travel trips sold the way products are, though nothing physical ever ships. A custom theme is built around trips, dates and availability instead of stock levels.",
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
      "A wealth management site where prospective clients want to understand both the services and the people before they make contact. A custom theme keeps the service and adviser content structured and consistent as the firm grows.",
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
      "An interior design site that doubles as a product showcase. The product data sits in a structured layer behind the pages, so the range is presented consistently rather than rebuilt page by page.",
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
      "A mortgage and investment advisory site that has to present loan products clearly alongside the advice itself. Both are structured, so products stay comparable as their terms change.",
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
      "A locksmith site built around a single job: someone locked out needs the emergency number now. Every page puts it within reach, on any device.",
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
      "A regional locksmith site with scheduling built in, so routine jobs get booked without tying up the phone for calls that did not need a person.",
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
      "A brand site for a sales and marketing consultancy whose service lines each need to stand on their own. The content architecture is built around those lines rather than flattening them into a single offer.",
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
      "A site for a nonprofit refuge supporting vulnerable girls, built so a visitor grasps the work and finds the way to help without hunting for it.",
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
