import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getWorkSlugs } from "@/lib/works";
import { getPublishedPosts } from "@/lib/queries";
import { services } from "@/data/services";

/**
 * Sitemap.
 *
 * Built from the same data the pages render from, so a project or service
 * added to src/data can never be missing here. The previous site listed two
 * URLs for a studio selling six service lines into four countries.
 *
 * Filtered views of /work (?kind=…) are deliberately absent: they are the same
 * collection reordered, and listing them would compete with /work in search.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const workSlugs = await getWorkSlugs();
  const blogPosts = await getPublishedPosts();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${site.url}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/build-audit`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/work`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/services`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site.url}/process`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${site.url}/about`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${site.url}/contact`, changeFrequency: "yearly", priority: 0.8 },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${site.url}/services/${s.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const projectRoutes: MetadataRoute.Sitemap = workSlugs.map((slug) => ({
    url: `${site.url}/work/${slug}`,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  /* Published posts only. `getPublishedPosts` filters on status, so a draft
     can never reach the sitemap — which is the one place a mistake would
     actively invite crawlers to a page that 404s. */
  const postRoutes: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...serviceRoutes, ...projectRoutes, ...postRoutes].map((r) => ({
    ...r,
    lastModified: now,
  }));
}
