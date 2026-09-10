import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/queries";
import { shouldSurfaceBlog } from "@/lib/blog";

const BASE = "https://forgelinetechnologies.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "monthly", priority: 1 },
  ];

  try {
    const posts = await getPublishedPosts();

    // Don't advertise the blog until it is worth visiting. Individual posts
    // stay out too — listing them would route crawlers straight past the
    // hidden index into a near-empty section.
    if (!shouldSurfaceBlog(posts.length)) return base;

    return [
      ...base,
      { url: `${BASE}/blog`, changeFrequency: "weekly" as const, priority: 0.8 },
      ...posts.map((p) => ({
        url: `${BASE}/blog/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // A sitemap missing its posts beats a build that fails on a cold database.
    return base;
  }
}
