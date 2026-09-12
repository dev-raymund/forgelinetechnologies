"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts a figure up when it first comes into view.
 *
 * The server renders the real value, and that is what sits in the HTML — the
 * previous site animated from a literal `0`, so every crawler and no-JS
 * visitor saw a studio claiming six years of nothing. The count is a visual
 * flourish applied after hydration and nothing depends on it.
 *
 * Values arrive as strings like "6+", "17" or "100%": the digits animate and
 * any prefix or suffix is preserved exactly.
 */
export function Counter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const digits = value.match(/\d+/);
    if (!digits) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = Number(digits[0]);
    const [before, after] = value.split(digits[0]);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();

        const duration = 900;
        let raf = 0;
        let start: number | null = null;

        const tick = (now: number) => {
          start ??= now;
          const t = Math.min((now - start) / duration, 1);
          // Ease out: fast to begin with, settling on the real number.
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(`${before}${Math.round(target * eased)}${after}`);
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  // `tabular-nums` so the width does not jitter as the digits change.
  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  );
}
