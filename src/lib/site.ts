/**
 * Single source of truth for the site's public identity.
 *
 * The canonical host is the apex domain. DNS already treats it that way
 * (www is a CNAME to the apex), so metadata, robots and sitemap all agree.
 * If Vercel is ever set to serve www as primary, change it here only.
 */
export const site = {
  name: "ForgeLine Technologies",
  tagline: "Web Development & Digital Solutions",
  url: "https://forgelinetechnologies.com",
} as const;
