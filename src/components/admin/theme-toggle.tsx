"use client";

import { useSyncExternalStore } from "react";

/**
 * Light / dark / system, for the dashboard only.
 *
 * Three states rather than two. "System" is the default and the honest one:
 * someone who has told their operating system they prefer dark should get it
 * without asking again here, and should keep getting it when that preference
 * changes at sunset. A two-state toggle silently overrides that the first time
 * it is touched.
 *
 * The choice is stored per browser in localStorage — it is a display
 * preference, not account data, and syncing it to the database would mean a
 * round trip on every page just to decide what colour to paint.
 */

export const ADMIN_THEME_KEY = "forgeline-admin-theme";

type Choice = "light" | "dark" | "system";

const OPTIONS: { value: Choice; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
];

function isChoice(v: unknown): v is Choice {
  return v === "light" || v === "dark" || v === "system";
}

function read(): Choice {
  try {
    const stored = localStorage.getItem(ADMIN_THEME_KEY);
    return isChoice(stored) ? stored : "system";
  } catch {
    // Private windows and blocked site data throw on access. A theme
    // preference is not worth breaking the page over.
    return "system";
  }
}

function apply(choice: Choice) {
  let dark = choice === "dark";
  if (choice === "system") {
    dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  document.documentElement.dataset.adminTheme = dark ? "dark" : "light";
}

/*
 * A tiny external store, read through useSyncExternalStore.
 *
 * The obvious shape — useState plus an effect that reads localStorage on mount
 * — cannot read during render without a hydration mismatch, so it has to set
 * state in an effect, which is both an extra render and the thing
 * react-hooks/set-state-in-effect exists to catch. useSyncExternalStore is the
 * API for this exact problem: it takes a separate server snapshot, so the
 * markup React renders on the server and the value the browser actually holds
 * are allowed to differ without a warning.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab changing the preference should update this one too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === ADMIN_THEME_KEY) {
      apply(read());
      onChange();
    }
  };
  // And while "system" is the choice, follow the OS as it changes at dusk.
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onScheme = () => {
    if (read() === "system") apply("system");
  };
  window.addEventListener("storage", onStorage);
  mq.addEventListener("change", onScheme);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
    mq.removeEventListener("change", onScheme);
  };
}

/** The server has no localStorage, and "system" is what the markup assumes. */
const getServerSnapshot = (): Choice => "system";

export function ThemeToggle() {
  const choice = useSyncExternalStore(subscribe, read, getServerSnapshot);

  const pick = (next: Choice) => {
    try {
      localStorage.setItem(ADMIN_THEME_KEY, next);
    } catch {
      // Still apply it for this page view even if it cannot be remembered.
    }
    apply(next);
    listeners.forEach((l) => l());
  };

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="flex gap-0.5 rounded-sm border border-rule p-0.5"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => pick(o.value)}
          aria-pressed={choice === o.value}
          className={`flex-1 rounded-[2px] px-2 py-1 font-mono text-micro transition-colors ${
            choice === o.value
              ? "bg-ink text-on-ink"
              : "text-faint hover:bg-black/[0.06] hover:text-graphite"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
