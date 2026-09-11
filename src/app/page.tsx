import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  // `absolute` so the homepage title is not suffixed by the layout template.
  title: { absolute: `${site.name} — ${site.tagline}` },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main className="shell">
      <h1>{site.name}</h1>
      <p className="tagline">{site.tagline}</p>
    </main>
  );
}
