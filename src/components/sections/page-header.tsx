import type { ReactNode } from "react";

/**
 * Inner-page header.
 *
 * Every page below the homepage opens on the same dark band so the site has a
 * recognisable entrance rather than a different treatment per route. The
 * homepage keeps its own hero — it is the only page that earns one.
 */
export function PageHeader({
  title,
  dek,
  meta,
  children,
}: {
  title: string;
  dek?: string;
  /** Short factual line above the title, e.g. a count or a category. */
  meta?: string;
  children?: ReactNode;
}) {
  return (
    <section className="on-ink bg-ink text-on-ink" aria-labelledby="page-title">
      <div className="shell">
        <div className="railed railed-inset pt-16 pb-16 md:pt-24 md:pb-20">
          {meta ? (
            <p className="mb-5 font-mono text-micro text-accent">{meta}</p>
          ) : null}
          <h1
            id="page-title"
            className="text-title max-w-[20ch] font-semibold text-white"
          >
            {title}
          </h1>
          {dek ? (
            <p className="mt-6 max-w-[58ch] text-dek text-on-ink-muted">{dek}</p>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  );
}
