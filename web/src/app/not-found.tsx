import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "140px 22px 90px", textAlign: "center" }}>
      <h1 style={{ fontSize: 44, letterSpacing: "-1.2px", margin: "0 0 12px" }}>Page not found</h1>
      <p style={{ color: "#8a919e", fontSize: 17, margin: "0 0 26px" }}>
        That page doesn&apos;t exist or has been moved.
      </p>
      <Link className="btn" href="/">Back to the homepage</Link>
    </main>
  );
}
