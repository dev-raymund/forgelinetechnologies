import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell">
      <h1>Page not found</h1>
      <p className="tagline">That page doesn&rsquo;t exist or has been moved.</p>
      <p>
        <Link href="/">Back to the homepage</Link>
      </p>
    </main>
  );
}
