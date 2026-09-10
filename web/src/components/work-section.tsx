"use client";

import { useState } from "react";
import type { Work } from "@/db/schema";
import { WORK_CATEGORIES } from "@/db/schema";

export default function WorkSection({ works }: { works: Work[] }) {
  const [filter, setFilter] = useState("all");

  // Counts derive from the data, so they can never drift from what's shown.
  const counts = works.reduce<Record<string, number>>((acc, w) => {
    acc[w.category] = (acc[w.category] ?? 0) + 1;
    return acc;
  }, {});

  const tabs = [
    { value: "all", label: "All", n: works.length },
    ...WORK_CATEGORIES.map((c) => ({ value: c.value, label: c.label, n: counts[c.value] ?? 0 })),
  ].filter((t) => t.n > 0);

  return (
    <section className="wrap band wv-blue wv-alt" id="work">
      <div className="work-head">
        <div className="sec-head">
          <p className="kicker">Work</p>
          <h2>
            Selected <span className="grad-text">work</span>
          </h2>
          <p className="sub">
            {works.length} builds for businesses across Australia, New Zealand, the US, and
            the Philippines. Every one of them is live — click through and judge for yourself.
          </p>
          <a className="sec-cta" href="#contact">
            Start a project like these
            <svg viewBox="0 0 24 24">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
        <div className="filters">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`filter${filter === t.value ? " is-active" : ""}`}
              data-filter={t.value}
              onClick={() => setFilter(t.value)}
            >
              {t.label} <em>{t.n}</em>
            </button>
          ))}
        </div>
      </div>

      <div className="work-grid">
        {works.map((w) => (
          <article
            key={w.id}
            className={`work-card surface${filter !== "all" && w.category !== filter ? " hide" : ""}`}
            data-cat={w.category}
          >
            <div className="thumb">
              {/* Plain <img>: these are pre-sized local assets, and Next/Image
                  would add a loader hop for no gain on a static grid. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img loading="lazy" src={w.imageUrl} alt={w.imageAlt || `${w.title} website`} />
            </div>
            <div className="work-body">
              {w.badge && <span className="badge-tech">{w.badge}</span>}
              <h3>{w.title}</h3>
              {w.description && <p>{w.description}</p>}
              {w.liveUrl && (
                <p className="links">
                  <a href={w.liveUrl} target="_blank" rel="noopener">
                    Live site →
                  </a>
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
