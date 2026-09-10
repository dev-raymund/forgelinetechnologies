import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/queries";

const BASE = "https://forgelinetechnologies.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.8 },
  ];

  try {
    const posts = await getPublishedPosts();
    return [
      ...base,
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
