import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * Deliberately no Content-Security-Policy. The page carries inline scripts it
 * genuinely needs — the JSON-LD blocks, the `.js` gate that keeps scroll
 * reveals safe without JavaScript, and the analytics snippets — so any CSP
 * here would need 'unsafe-inline', which gives up most of what a CSP is for
 * while still being able to break the site on a future change. A nonce-based
 * policy is the right answer and it needs middleware; that is a deliberate
 * follow-up, not an oversight.
 *
 * HSTS is set by Vercel on its own domains, but stating it here means the
 * header survives a move to any other host.
 */
const securityHeaders = [
  // Stops a browser second-guessing a declared content type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the origin cross-site, the full path same-site. Keeps referrer
  // useful for analytics without leaking query strings to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing here is meant to be framed; this blocks clickjacking.
  { key: "X-Frame-Options", value: "DENY" },
  // The site asks for none of these, so deny them outright.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  /* Uploaded media is served from exactly one Blob store: `ft-blob-public`
     (store_oGAQjTOQEdAMuk2m). Only that store's host is allowed, and only under the
     upload prefix.

     Never widen this to a wildcard such as `*.public.blob.vercel-storage.com`.
     /_next/image is a public endpoint whose `url` parameter is caller-supplied, and
     the matcher checks only the hostname pattern, so a wildcard would let anyone
     make this domain fetch, resize and serve images from ANY Vercel Blob store,
     against this project's image-optimisation usage.

     Only works render images through next/image; blog covers and the media library
     use a plain <img>. If the Blob store is ever replaced, update this host before
     choosing an image from the new store for a work, or that work's page cannot
     render it. */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ogaqjtoqedamuk2m.public.blob.vercel-storage.com",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
