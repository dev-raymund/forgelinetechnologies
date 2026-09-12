/**
 * Partner companies.
 *
 * Real relationships only. One entry today, because one is what exists —
 * padding this list with logos of companies that have not agreed to appear
 * would be the same class of invention as a fabricated testimonial, and the
 * first person to notice would be the partner.
 *
 * The grid is built to scale, so adding a confirmed partner is a single entry
 * here and nothing else.
 */
export type Partner = {
  name: string;
  /** What they cover. One line, shown as the logo's accessible description. */
  role: string;
  logo: string;
  url: string;
};

export const partners: Partner[] = [
  {
    name: "TechZQuad",
    role: "Business technology and IT — automation, CRM, infrastructure and support",
    logo: "/assets/techzquad-logo.png",
    url: "https://www.techzquad.com/",
  },
];
