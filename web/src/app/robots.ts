import type { MetadataRoute } from "next";
import { isStaging } from "@/lib/env";

const BASE = "https://forgelinetechnologies.com";

export default function robots(): MetadataRoute.Robots {
  // A staging deployment serves the same content as production, so block it
  // wholesale rather than letting it compete as duplicate content.
  if (isStaging) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/econtent"] },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
