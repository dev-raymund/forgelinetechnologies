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
  /** Filename in /assets/tech, without extension. */
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
    note: "What the customer actually touches, built to stay fast on a phone.",
    items: [
      { name: "React", icon: "react" },
      { name: "Next.js" },
      { name: "TypeScript" },
      { name: "JavaScript", icon: "javascript" },
      { name: "Vue", icon: "vuedotjs" },
      { name: "Tailwind CSS", icon: "tailwindcss" },
      { name: "jQuery", icon: "jquery" },
    ],
  },
  {
    title: "Back-end",
    note: "The part that has to be correct, not just pleasant.",
    items: [
      { name: "PHP", icon: "php" },
      { name: "Laravel", icon: "laravel" },
      { name: "Node.js", icon: "nodedotjs" },
      { name: "REST APIs" },
    ],
  },
  {
    title: "Commerce & CMS",
    note: "Platforms used where they earn their keep, and skipped where they do not.",
    items: [
      { name: "WordPress", icon: "wordpress" },
      { name: "WooCommerce", icon: "woocommerce" },
      { name: "Shopify", icon: "shopify" },
    ],
  },
  {
    title: "Data",
    note: "Modelled once, properly, because this is the expensive thing to change later.",
    items: [
      { name: "PostgreSQL" },
      { name: "MySQL", icon: "mysql" },
      { name: "MongoDB", icon: "mongodb" },
    ],
  },
  {
    title: "Tooling & Delivery",
    note: "How work gets from a branch to production without drama.",
    items: [
      { name: "Git", icon: "git" },
      { name: "Docker", icon: "docker" },
      { name: "Vercel" },
      { name: "Figma", icon: "figma" },
    ],
  },
];
