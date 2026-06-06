"use client";

import { useEffect, useState } from "react";

const ORDER = ["light", "dark", "night"];

function apply(theme) {
  const c = document.documentElement.classList;
  c.remove("dark", "night");
  if (theme === "dark") c.add("dark");
  else if (theme === "night") {
    c.add("dark");
    c.add("night");
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(null);

  // Read the theme the no-flash script already applied
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) setTheme(stored);
    else
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    apply(next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  if (!theme) return null;

  const meta = {
    light: { label: "Light", icon: "M12 3v2m0 14v2m9-9h-2M5 12H3m14.7 6.7l-1.4-1.4M6.7 6.7L5.3 5.3m12 0l-1.4 1.4M6.7 17.3l-1.4 1.4M16 12a4 4 0 11-8 0 4 4 0 018 0z" },
    dark: { label: "Dark", icon: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" },
    night: { label: "Night", icon: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" },
  }[theme];

  return (
    <button
      onClick={cycle}
      className="text-navy-200 hover:text-white transition-colors min-h-[44px] inline-flex items-center gap-1.5 px-1.5"
      title={`Theme: ${meta.label} (tap to change)`}
      aria-label={`Theme: ${meta.label}. Tap to change.`}
    >
      <svg
        className={`w-4 h-4 ${theme === "night" ? "text-red-400" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={meta.icon} />
      </svg>
      <span className="text-2xs hidden sm:inline">{meta.label}</span>
    </button>
  );
}
