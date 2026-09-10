/**
 * Whether the blog is worth showing to a prospect yet.
 *
 * The blog is built and functional, but a nearly-empty one is a negative
 * trust signal — it reads as something that was started and abandoned. So the
 * public entry points (primary nav, sitemap, homepage teaser) stay hidden
 * until there is enough there to be worth a click.
 *
 * The route itself always works: /blog and /blog/[slug] render normally, and
 * posts can be written and published in /admin at any time. Only the links
 * pointing at them are gated.
 *
 * To restore the blog: publish three useful posts. The nav link must be added
 * back by hand in components/static-top.tsx (see the comment there); the
 * sitemap entry and homepage teaser restore themselves automatically once
 * this threshold is met.
 */
export const MIN_PUBLIC_POSTS = 3;

export function shouldSurfaceBlog(publishedCount: number): boolean {
  return publishedCount >= MIN_PUBLIC_POSTS;
}
