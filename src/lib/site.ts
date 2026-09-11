/**
 * Single source of truth for the site's public identity.
 *
 * The canonical host is the apex domain. DNS already treats it that way
 * (www is a CNAME to the apex), so metadata, robots and sitemap all agree.
 * If Vercel is ever set to serve www as primary, change it here only.
 *
 * Spelling note: the wordmark in /assets/forgeline-logo.svg reads
 * "Forgeline" — one capital. Earlier code used "ForgeLine"; the logo wins.
 */
export const site = {
  name: "Forgeline Technologies",
  shortName: "Forgeline",
  tagline: "Web development and digital product engineering",
  description:
    "Forgeline Technologies builds websites, web applications, e-commerce platforms and custom software — scoped at a fixed price and built by the developer you brief.",
  url: "https://forgelinetechnologies.com",
  email: "raymundhermoso.dev@gmail.com",
  social: {
    github: "https://github.com/dev-raymund",
    linkedin: "https://www.linkedin.com/in/raymund-hermoso-b00586207/",
  },
} as const;

/**
 * Credibility figures.
 *
 * Every one of these is verifiable: the project count matches the portfolio
 * exactly, and the countries are the markets real clients were delivered in.
 *
 * These render as text server-side. The previous site animated them up from
 * a literal `0` in the HTML, so every crawler and every no-JS visitor saw a
 * studio claiming six years of nothing. Animate from the rendered value or
 * do not animate at all.
 */
export const stats = [
  { value: "6+", label: "Years building" },
  { value: "17", label: "Projects shipped" },
  { value: "4", label: "Countries served" },
  { value: "100%", label: "Code ownership" },
] as const;

/** Markets with delivered work behind the "4 countries" figure. */
export const markets = ["Australia", "New Zealand", "United States", "Philippines"] as const;

/**
 * The same four in running prose. Two of them take a definite article, which
 * no join() of the list above can produce — so the sentence form is written
 * once here rather than assembled wrongly at each call site.
 */
export const marketsSentence =
  "Australia, New Zealand, the United States and the Philippines";

export const founder = {
  name: "Raymund Hermoso",
  role: "Founder & Lead Developer",
  photo: "/assets/raymund-hermoso-photo.png",
  photoAlt: "Raymund Hermoso, founder and lead developer of Forgeline Technologies",
} as const;

/**
 * Partner company. Complementary, not a parent and not a competitor.
 * Do not describe Forgeline as a sub-brand — that relationship has not been
 * stated and claiming it would be wrong.
 */
export const partner = {
  name: "TechZQuad",
  url: "https://www.techzquad.com/",
  summary:
    "Broader business technology and IT — automation, CRM, infrastructure, support and training.",
} as const;
