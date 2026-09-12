/**
 * Technology, grouped by the job it does.
 *
 * A flat wall of logos tells a buyer nothing except that you can use a search
 * engine. Grouping by role makes a different and truer point: tools are
 * chosen per problem, and the studio is not married to any of them.
 *
 * `icon` maps to /assets/tech/<icon>.svg. Entries without one render as a
 * plain typographic label, which is fine — not every tool needs a logo.
 */

export type Technology = {
  name: string;
  /**
   * Filename in /assets/tech, without extension. Optional: "REST APIs" is a
   * technique rather than a product, so it has no brand mark and renders as a
   * plain label. Better than borrowing someone else's logo for it.
   */
  icon?: string;
};

export type TechGroup = {
  title: string;
  /** Why this group exists, in one line. */
  note: string;
  items: Technology[];
};

export const techGroups: TechGroup[] = [
  {
    title: "Front-end",
    note: "What your customers actually touch. Built to stay fast on a phone, which is where most of them are.",
    items: [
      { name: "React", icon: "react" },
      { name: "Next.js", icon: "nextdotjs" },
      { name: "TypeScript", icon: "typescript" },
      { name: "JavaScript", icon: "javascript" },
      { name: "Vue", icon: "vuedotjs" },
      { name: "Tailwind CSS", icon: "tailwindcss" },
      { name: "jQuery", icon: "jquery" },
    ],
  },
  {
    title: "Back-end",
    note: "The part that has to be correct rather than merely pleasant — logins, business rules, money.",
    items: [
      { name: "PHP", icon: "php" },
      { name: "Laravel", icon: "laravel" },
      { name: "Node.js", icon: "nodedotjs" },
      { name: "REST APIs" },
    ],
  },
  {
    title: "Commerce & CMS",
    note: "Used where the platform genuinely earns its keep, and skipped where it would get in the way.",
    items: [
      { name: "WordPress", icon: "wordpress" },
      { name: "WooCommerce", icon: "woocommerce" },
      { name: "Shopify", icon: "shopify" },
    ],
  },
  {
    title: "Data",
    note: "Your data is structured around how the business actually works, so the system stays maintainable as it grows.",
    items: [
      { name: "PostgreSQL", icon: "postgresql" },
      { name: "MySQL", icon: "mysql" },
      { name: "MongoDB", icon: "mongodb" },
    ],
  },
  {
    title: "Tooling & Delivery",
    note: "How a change reaches your live site without drama, and how it gets undone if it needs to be.",
    items: [
      { name: "Git", icon: "git" },
      { name: "Docker", icon: "docker" },
      { name: "Vercel", icon: "vercel" },
      { name: "Figma", icon: "figma" },
    ],
  },
];
