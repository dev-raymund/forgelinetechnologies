import { getPublishedWorks, getPublishedPosts } from "@/lib/queries";
import StaticTop from "@/components/static-top";
import StaticBottom from "@/components/static-bottom";
import WorkSection from "@/components/work-section";
import BlogTeaser from "@/components/blog-teaser";
import SiteScripts from "@/components/site-scripts";

// Content is DB-driven and revalidated on save, so cache the render.
export const revalidate = 3600;

export default async function HomePage() {
  const [works, posts] = await Promise.all([getPublishedWorks(), getPublishedPosts()]);

  return (
    <>
      <StaticTop />
      <WorkSection works={works} />
      <BlogTeaser posts={posts.slice(0, 3)} />
      <StaticBottom />
      <SiteScripts />
    </>
  );
}
