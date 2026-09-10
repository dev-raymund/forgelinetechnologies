import PlaceholderNotice from "../_components/ec-placeholder";
import Wave from "../_components/ec-wave";
import { episodes, formatDate } from "../_data";

export const metadata = { title: "Podcast" };

export default function PodcastPage() {
  return (
    <>
      <section className="ec-page-head ec-has-wave">
        <div className="ec-wrap">
          <h1>The podcast</h1>
          <p>
            Conversations with founders, operators and developers about what shipped, what it cost
            and what they would do differently.
          </p>
        </div>
        <Wave fill="#ffffff" />
      </section>

      <PlaceholderNotice />

      <section className="ec-section ec-dark">
        <div className="ec-wrap" style={{ maxWidth: 820 }}>
          {episodes.map((ep) => (
            <div className="ec-ep" key={ep.number}>
              <span className="ec-ep-num" aria-hidden="true">
                EP{ep.number}
              </span>
              <div>
                <h3>{ep.title}</h3>
                <p>{ep.summary}</p>
                <small>
                  {formatDate(ep.date)} · {ep.duration}
                </small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
