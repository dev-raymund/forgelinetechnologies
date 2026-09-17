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
/**
 * Canonical origin.
 *
 * Order matters, and getting it wrong is expensive: every canonical tag, the
 * sitemap, robots.txt and the Open Graph image URL are built from this. Before
 * this fallback existed the whole site advertised forgelinetechnologies.com
 * while being served from vercel.app — so every canonical pointed at a URL
 * that returned 404, the sitemap listed thirty dead addresses, and social
 * shares resolved a broken image.
 *
 *   1. NEXT_PUBLIC_SITE_URL   explicit override, wins everywhere
 *   2. VERCEL_PROJECT_PRODUCTION_URL   the project's real production domain,
 *      injected by Vercel at build. Self-correcting: it returns the .vercel.app
 *      host today and the custom domain the moment one is attached.
 *   3. the apex domain, for local development
 *
 * Read only on the server — nothing in a client component touches `site.url`,
 * so the non-public variable at step 2 is safe here.
 */
function resolveOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return "https://forgelinetechnologies.com";
}

const origin = resolveOrigin();

export const site = {
  name: "Forgeline Technologies",
  shortName: "Forgeline",
  tagline: "Web development and digital product engineering",
  description:
    "Forgeline Technologies designs, develops and supports websites, web applications, e-commerce and custom software for businesses that need reliable technology — scoped and priced before work starts, and built by the people you brief.",
  url: origin,
  /**
   * The address shown publicly on the site, and nothing else.
   *
   * Deliberately separate from CONTACT_EMAIL, and deliberately with no
   * fallback. CONTACT_EMAIL is where enquiry notifications are delivered — a
   * personal mailbox is perfectly fine there because it is never displayed.
   * This one is published, so it defaults to empty rather than to a personal
   * address: the contact form is the route in, and an unset value simply
   * means the site shows no mailbox at all.
   *
   * Set NEXT_PUBLIC_CONTACT_EMAIL only when there is an address you are happy
   * for the public and every scraper to have.
   */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  social: {
    github: "https://github.com/dev-raymund",
    linkedin: "https://www.linkedin.com/in/raymund-hermoso-b00586207/",
  },
} as const;

/**
 * Turns a repository-relative asset path into an absolute URL. For a picked
 * Blob URL — already absolute — this is a no-op; for a committed asset like
 * `/assets/projects/mhc.jpg` it prefixes `site.url`.
 *
 * Needed anywhere an image reaches structured data (JSON-LD) by hand rather
 * than through Next's Metadata API: a `<script type="application/ld+json">`
 * is plain text a crawler parses with no base URL of its own, so a relative
 * `image` there is simply broken, and naive `${site.url}${src}` string
 * concatenation on an already-absolute Blob URL produces a mangled
 * `https://forgelinetechnologies.comhttps://...` value instead. Next's own
 * `generateMetadata`/`openGraph` fields do not need this: they resolve a
 * relative URL against `metadataBase` (set in `src/app/layout.tsx`) on their
 * own.
 */
export function absoluteUrl(src: string): string {
  return src.startsWith("/") ? `${site.url}${src}` : src;
}

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
 *
 * Three, not four. "100% code ownership" used to sit here and it is not a
 * metric — it is a promise, and a promise in a row of measurements makes the
 * measurements look like promises too. It still appears where it belongs, in
 * the closing CTA and the FAQ. Symmetry is not worth a weaker signal.
 */
export const stats = [
  { value: "6+", label: "Years building" },
  { value: "17", label: "Projects shipped" },
  { value: "4", label: "Countries served" },
] as const;

/** Markets with delivered work behind the "4 countries" figure. */
export const markets = [
  "Australia",
  "New Zealand",
  "United States",
  "Philippines",
] as const;

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
  photoAlt:
    "Raymund Hermoso, founder and lead developer of Forgeline Technologies",
} as const;
