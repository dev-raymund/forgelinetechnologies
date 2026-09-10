/** Remove this component from the pages once real content is in _data.ts. */
export default function PlaceholderNotice() {
  return (
    <div className="ec-wrap" style={{ paddingTop: 24 }}>
      <p className="ec-placeholder">
        <strong>Placeholder content.</strong> Stats, testimonials, client names, projects and
        articles on this site are structural stand-ins, not real claims. Replace them in{" "}
        <code>src/app/econtent/_data.ts</code> before launch.
      </p>
    </div>
  );
}
