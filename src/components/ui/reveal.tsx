"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Reveals its children when they first scroll into view.
 *
 * Safe without JavaScript. The hidden state is applied by CSS only under a
 * `.js` class that an inline script adds to <html> during parse, so a visitor
 * with scripts off — and every crawler — gets the content visible rather than
 * a page of invisible divs. That is the failure mode this pattern usually
 * ships with, and it is the expensive one.
 *
 * It disconnects after firing: this is an entrance, not a scroll effect, and
 * re-animating on the way back up is the thing that makes a page feel
 * restless rather than alive.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  /** Stagger, in ms. Keep it under ~300 or the page feels slow. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion is handled entirely in CSS, which forces `.reveal`
    // visible under the media query. Checking it here too would mean calling
    // setState directly inside an effect — the pattern React flags — to
    // duplicate a rule that already holds.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "is-in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
