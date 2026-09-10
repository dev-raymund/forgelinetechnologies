import PlaceholderNotice from "../_components/ec-placeholder";
import Wave from "../_components/ec-wave";
import { articles, formatDate } from "../_data";

export const metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <>
      <section className="ec-page-head ec-has-wave">
        <div className="ec-wrap">
          <h1>Blog</h1>
          <p>Notes on building, launching and maintaining software for real businesses.</p>
        </div>
        <Wave fill="#ffffff" />
      </section>

      <PlaceholderNotice />

      <section className="ec-section">
        <div className="ec-wrap ec-grid ec-grid-3">
          {articles.map((a) => (
            <article className="ec-post" key={a.slug}>
              <h3>{a.title}</h3>
              <p>{a.excerpt}</p>
              <div className="ec-post-meta">
                {formatDate(a.date)} · {a.readingTime}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
