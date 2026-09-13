"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * A thin progress bar across the top during navigation.
 *
 * Most pages here are static and arrive in well under a second, so the bar is
 * deliberately delayed: it only appears once a navigation has taken longer
 * than a moment. Flashing a loading indicator for 80ms is worse than showing
 * nothing — it reads as a glitch rather than as progress.
 *
 * It fills toward 90% and waits there. The last 10% belongs to the arrival,
 * because a bar that reaches 100% before the page does is lying about what it
 * knows.
 */

const APPEAR_AFTER_MS = 180;

export function RouteProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState<number | null>(null);
  const first = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Nothing to show on the initial render — there was no navigation.
    if (first.current) {
      first.current = false;
      return;
    }

    // The pathname has already changed by the time this runs, so the new page
    // is here: finish whatever was showing and clear it.
    setWidth((w) => (w === null ? null : 100));
    const done = setTimeout(() => setWidth(null), 220);
    return () => clearTimeout(done);
  }, [pathname]);

  useEffect(() => {
    const clear = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };

    const onClick = (e: MouseEvent) => {
      /*
       * Capture phase, and deliberately no `defaultPrevented` check.
       *
       * Next's Link calls preventDefault() to take over the navigation, and a
       * document-level listener in the bubble phase runs after it — so
       * skipping prevented clicks skipped precisely the client-side
       * navigations this exists to indicate. Running in capture means nothing
       * has had the chance to prevent it yet.
       */
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const link = (e.target as HTMLElement | null)?.closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || link.target === "_blank" || link.hasAttribute("download")) return;

      // Same-origin, different page only. Hash links and external links are
      // not navigations worth indicating.
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      clear();
      timers.current.push(setTimeout(() => setWidth(28), APPEAR_AFTER_MS));
      timers.current.push(setTimeout(() => setWidth(62), APPEAR_AFTER_MS + 250));
      timers.current.push(setTimeout(() => setWidth(85), APPEAR_AFTER_MS + 700));
      timers.current.push(setTimeout(() => setWidth(92), APPEAR_AFTER_MS + 1600));
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clear();
    };
  }, []);

  if (width === null) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px]"
    >
      <div
        className="h-full bg-accent transition-[width] duration-200 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
