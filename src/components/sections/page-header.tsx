import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

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
  trail,
  visual,
  children,
}: {
  title: string;
  dek?: string;
  /** Short factual line above the title, e.g. a count or a category. */
  meta?: string;
  /** Breadcrumb trail, for nested routes. Rendered above everything else. */
  trail?: { name: string; path: string }[];
  /**
   * Schematic for the right-hand column. Hidden below lg — at phone width it
   * would be unreadable and would push the page's actual subject off screen,
   * which is the same call the homepage hero makes.
   */
  visual?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="on-ink bg-ink text-on-ink" aria-labelledby="page-title">
      <div className="shell">
        <div className="railed railed-inset pt-14 pb-14 md:pt-20 md:pb-20">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
            <div className={visual ? "lg:col-span-7" : "lg:col-span-12"}>
              {trail?.length ? <Breadcrumbs trail={trail} /> : null}
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
                <p className="mt-6 max-w-[58ch] text-dek text-on-ink-muted">
                  {dek}
                </p>
              ) : null}
              {children}
            </div>

            {visual ? (
              <div className="hidden text-white lg:col-span-5 lg:block">
                {visual}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
