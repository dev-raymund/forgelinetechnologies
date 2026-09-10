"use client";

import { useEffect } from "react";

/**
 * The behavior that used to live in the inline <script> at the bottom of
 * site/index.html. The year stamp and the work filter are gone — React owns
 * those now (see SiteFooter and WorkSection).
 */
export default function SiteScripts() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    const runCounter = (el: HTMLElement) => {
      const to = Number(el.dataset.to ?? 0);
      const suffix = el.dataset.suffix ?? "";
      const dur = 1400;
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(to * eased) + suffix;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const illus = document.querySelectorAll<HTMLElement>(".illus");
    const counters = document.querySelectorAll<HTMLElement>(".counter strong[data-to]");

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add("play");
            io.unobserve(e.target);
          });
        },
        { threshold: 0.25 },
      );
      illus.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());

      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            runCounter(e.target as HTMLElement);
            cio.unobserve(e.target);
          });
        },
        { threshold: 0.6 },
      );
      counters.forEach((el) => cio.observe(el));
      cleanups.push(() => cio.disconnect());
    } else {
      illus.forEach((el) => el.classList.add("play"));
      counters.forEach(runCounter);
    }

    // Nav is transparent over the gradient hero, solid white once you scroll past it.
    const navEl = document.querySelector(".nav");
    if (navEl) {
      const onScroll = () => navEl.classList.toggle("is-stuck", window.scrollY > 60);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onScroll));
    }

    // Preview the still-unpublished testimonials section: /?preview=testimonials
    if (new URLSearchParams(location.search).get("preview") === "testimonials") {
      document.getElementById("testimonials")?.removeAttribute("hidden");
    }

    // Scroll reveal
    if (
      "IntersectionObserver" in window &&
      window.matchMedia("(prefers-reduced-motion: no-preference)").matches
    ) {
      const revealEls = document.querySelectorAll<HTMLElement>(
        ".sec-head, .cap, .card, .addons > div, .steps li, .vcard, .tcard, " +
          ".counter, .faq > div, .founder-wrap, .split, .filters, .work-grid",
      );
      const rio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target as HTMLElement;
            rio.unobserve(el);
            el.classList.add("in");
            el.addEventListener(
              "animationend",
              () => {
                el.classList.remove("reveal", "in");
                el.style.animationDelay = "";
              },
              { once: true },
            );
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -50px 0px" },
      );
      revealEls.forEach((el, i) => {
        el.classList.add("reveal");
        el.style.animationDelay = (i % 6) * 55 + "ms";
        rio.observe(el);
      });
      cleanups.push(() => rio.disconnect());
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
