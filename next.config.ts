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
  /* No `images.remotePatterns` yet, deliberately.

     A wildcard such as `*.public.blob.vercel-storage.com` turns /_next/image into
     an anonymous open proxy: that endpoint is public, its `url` parameter is
     whatever the caller sends, and the matcher checks only the hostname glob.
     Anyone could make this domain fetch, resize and serve images from ANY
     Vercel Blob store, against this project's image-optimisation usage.

     Only works render images through next/image; blog covers and the media
     library use a plain <img>, which needs no entry here. So nothing breaks
     without it today.

     When the public Blob store exists, add exactly that store's host, lower-cased,
     scoped to the upload prefix — BEFORE an uploaded image is chosen for a work:

       images: {
         remotePatterns: [
           { protocol: "https", hostname: "<store-id>.public.blob.vercel-storage.com", pathname: "/media/**" },
         ],
       },

     Without it, a work whose image is a Blob URL fails to render on its public page. */
};

export default nextConfig;
