"use client";

/**
 * Last-resort boundary, for failures in the root layout itself.
 *
 * It replaces the entire document, so it cannot use the app's layout, fonts or
 * stylesheet — if the layout is what threw, none of those are available. The
 * styling is therefore inline and deliberately plain; the only job here is to
 * say something human instead of a white screen.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d2350",
          color: "#e7ecf4",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "34rem" }}>
          <p
            style={{
              margin: 0,
              color: "#f97316",
              fontSize: 13,
              letterSpacing: "0.04em",
            }}
          >
            Something broke
          </p>
          <h1
            style={{
              margin: "14px 0 0",
              fontSize: 30,
              lineHeight: 1.15,
              color: "#fff",
            }}
          >
            Forgeline Technologies
          </h1>
          <p
            style={{
              margin: "16px 0 0",
              fontSize: 16,
              lineHeight: 1.6,
              color: "#9aabc4",
            }}
          >
            The site failed to load. Trying again usually works. If it keeps
            happening, email{" "}
            <a
              href="mailto:hello@forgelinetechnologies.com"
              style={{ color: "#fff" }}
            >
              hello@forgelinetechnologies.com
            </a>
            .
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 28,
              background: "#f97316",
              color: "#fff",
              border: 0,
              borderRadius: 3,
              padding: "12px 20px",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p style={{ marginTop: 32, fontSize: 12, color: "#9aabc4" }}>
              Reference {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
