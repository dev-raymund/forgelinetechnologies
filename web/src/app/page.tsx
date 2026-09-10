import type { Metadata } from "next";
import { openGraph } from "@/lib/metadata";
import { getPublishedWorks, getPublishedPosts } from "@/lib/queries";
import { shouldSurfaceBlog } from "@/lib/blog";
import "./site.css";
import StaticTop from "@/components/static-top";
import StaticBottom from "@/components/static-bottom";
import WorkSection from "@/components/work-section";
import BlogTeaser from "@/components/blog-teaser";
import SiteScripts from "@/components/site-scripts";

// Content is DB-driven and revalidated on save, so cache the render.
export const revalidate = 3600;

export const metadata: Metadata = {
  // `absolute` so the homepage title is not suffixed by the layout template.
  title: {
    absolute: "Forgeline Technologies — Full-stack web development studio",
  },
  alternates: { canonical: "/" },
  openGraph: openGraph({
    url: "/",
    title: "Forgeline Technologies — Full-stack web development studio",
    description:
      "Web apps, websites and e-commerce, built front-end to back-end at a fixed price. The developer you brief is the developer who builds it.",
  }),
};

export default async function HomePage() {
  const [works, posts] = await Promise.all([getPublishedWorks(), getPublishedPosts()]);

  return (
    <>
      <StaticTop />
      <WorkSection works={works} />
      {/* Same gate as the nav and sitemap: no point sending prospects to a
          blog that has nothing to read yet. */}
      {shouldSurfaceBlog(posts.length) ? <BlogTeaser posts={posts.slice(0, 3)} /> : null}
      <StaticBottom />
      <SiteScripts />
    </>
  );
}
