import Link from "next/link";

/**
 * Deliberately self-contained, with no stylesheet import.
 *
 * Next hoists the root not-found boundary into every route segment, so any CSS
 * imported here loads on EVERY page — including /admin and /econtent, which
 * have their own design systems. Importing site.css here silently re-created
 * exactly the global leak it was meant to remove.
 */
export default function NotFound() {
  return (
    <main
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "140px 22px 90px",
        textAlign: "center",
        fontFamily: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        color: "#333",
      }}
    >
      <h1 style={{ fontSize: 44, letterSpacing: "-1.2px", margin: "0 0 12px" }}>Page not found</h1>
      <p style={{ color: "#8a919e", fontSize: 17, margin: "0 0 26px" }}>
        That page doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          padding: "13px 26px",
          borderRadius: 50,
          background: "linear-gradient(135deg,#016ecc,#19d2fe)",
          color: "#fff",
          fontWeight: 800,
          fontSize: 15,
          textDecoration: "none",
        }}
      >
        Back to the homepage
      </Link>
    </main>
  );
}
