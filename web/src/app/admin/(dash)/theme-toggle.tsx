"use client";

import { useEffect, useState } from "react";
import { IconSun, IconMoon } from "@/components/admin-icons";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  // Read what the pre-paint script already decided, so the button starts correct.
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(".adm");
    setTheme((el?.dataset.theme as Theme) ?? "light");
  }, []);

  const flip = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.querySelector<HTMLElement>(".adm")?.setAttribute("data-theme", next);
    try {
      localStorage.setItem("fg-admin-theme", next);
    } catch {
      /* private mode — the toggle still works for this page view */
    }
  };

  return (
    <button
      type="button"
      className="adm-btn ghost sm icon"
      onClick={flip}
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );
}
